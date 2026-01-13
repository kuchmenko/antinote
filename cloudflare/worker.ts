export interface Env {
    OPENAI_API_KEY: string;
}

type ClientMessage =
    | { type: "audio"; audio: string }
    | { type: "stop" }
    | { type: "ping" };

type ClientEvent =
    | { type: "ready" }
    | { type: "transcription"; isFinal: boolean; transcript: string; timestamp: number }
    | { type: "error"; message: string }
    | { type: "pong" };

const OPENAI_REALTIME_URL = "https://api.openai.com/v1/realtime";
const OPENAI_CLIENT_SECRETS_URL = "https://api.openai.com/v1/realtime/client_secrets";

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname !== "/ws") {
            return new Response("Not found", { status: 404 });
        }

        if (request.headers.get("Upgrade") !== "websocket") {
            return new Response("Expected websocket", { status: 400 });
        }

        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);
        server.accept();

        const sendToClient = (event: ClientEvent) => {
            if (server.readyState !== WebSocket.OPEN) return;
            server.send(JSON.stringify(event));
        };

        let openaiWebSocket: WebSocket | null = null;

        const closeAll = (code?: number, reason?: string) => {
            if (server.readyState === WebSocket.OPEN) {
                server.close(code, reason);
            }
            if (openaiWebSocket && openaiWebSocket.readyState === WebSocket.OPEN) {
                openaiWebSocket.close();
            }
        };

        try {
            const apiKey = env.OPENAI_API_KEY.replace(/[^\x21-\x7E]/g, "").trim();

            const pendingAudioChunks: string[] = [];
            const MAX_PENDING_AUDIO_CHUNKS = 50;
            let pendingStop = false;

            const flushPendingAudio = () => {
                if (!openaiWebSocket || openaiWebSocket.readyState !== WebSocket.OPEN) {
                    return;
                }

                if (pendingStop) {
                    pendingAudioChunks.length = 0;
                    openaiWebSocket.send(JSON.stringify({ type: "input_audio_buffer.clear" }));
                    pendingStop = false;
                    return;
                }

                if (pendingAudioChunks.length === 0) return;

                for (const chunk of pendingAudioChunks) {
                    openaiWebSocket.send(JSON.stringify({
                        type: "input_audio_buffer.append",
                        audio: chunk
                    }));
                }
                pendingAudioChunks.length = 0;
            };

            server.addEventListener("message", (event) => {
                if (typeof event.data !== "string") {
                    return;
                }

                let message: ClientMessage;
                try {
                    message = JSON.parse(event.data);
                } catch {
                    return;
                }

                if (message.type === "ping") {
                    sendToClient({ type: "pong" });
                    return;
                }

                if (message.type === "stop") {
                    pendingStop = true;
                    pendingAudioChunks.length = 0;

                    if (openaiWebSocket && openaiWebSocket.readyState === WebSocket.OPEN) {
                        openaiWebSocket.send(JSON.stringify({ type: "input_audio_buffer.clear" }));
                        pendingStop = false;
                    }
                    return;
                }

                if (message.type === "audio") {
                    if (openaiWebSocket && openaiWebSocket.readyState === WebSocket.OPEN) {
                        openaiWebSocket.send(JSON.stringify({
                            type: "input_audio_buffer.append",
                            audio: message.audio
                        }));
                        return;
                    }

                    if (pendingAudioChunks.length < MAX_PENDING_AUDIO_CHUNKS) {
                        pendingAudioChunks.push(message.audio);
                    }
                }
            });

            const secretResponse = await fetch(OPENAI_CLIENT_SECRETS_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    expires_after: {
                        anchor: "created_at",
                        seconds: 600
                    },
                    session: {
                        type: "transcription",
                        audio: {
                            input: {
                                format: {
                                    type: "audio/pcm",
                                    rate: 24000
                                },
                                noise_reduction: {
                                    type: "near_field"
                                },
                                transcription: {
                                    model: "gpt-4o-mini-transcribe"
                                },
                                turn_detection: {
                                    type: "server_vad",
                                    threshold: 0.5,
                                    prefix_padding_ms: 300,
                                    silence_duration_ms: 500
                                }
                            }
                        }
                    }
                })
            });

            if (!secretResponse.ok) {
                const text = await secretResponse.text();
                sendToClient({ type: "error", message: `Failed to create client secret: ${secretResponse.status} ${text}` });
                closeAll(1011, "Failed to create client secret");
                return new Response(null, { status: 101, webSocket: client });
            }

            const secretJson = await secretResponse.json() as { value?: unknown };
            const clientSecret = typeof secretJson.value === "string" ? secretJson.value : "";

            if (!clientSecret) {
                sendToClient({ type: "error", message: "Client secret missing" });
                closeAll(1011, "Client secret missing");
                return new Response(null, { status: 101, webSocket: client });
            }

            const openaiResponse = await fetch(OPENAI_REALTIME_URL, {
                headers: {
                    "Authorization": `Bearer ${clientSecret}`,
                    "Upgrade": "websocket"
                }
            });

            const ws = openaiResponse.webSocket;
            if (!ws) {
                const message = `OpenAI websocket upgrade failed (status ${openaiResponse.status})`;
                sendToClient({ type: "error", message });
                closeAll(1011, message);
                return new Response(null, { status: 101, webSocket: client });
            }

            openaiWebSocket = ws;
            openaiWebSocket.accept();

            flushPendingAudio();
            sendToClient({ type: "ready" });

            let finalTranscript = "";
            let currentItemId: string | null = null;
            let currentDelta = "";

            const emitTranscript = (isFinal: boolean, text: string) => {
                if (text.trim().length === 0) return;
                sendToClient({
                    type: "transcription",
                    isFinal,
                    transcript: text,
                    timestamp: Date.now()
                });
            };

            openaiWebSocket.addEventListener("message", (event) => {
                if (typeof event.data !== "string") {
                    return;
                }

                let message: any;
                try {
                    message = JSON.parse(event.data);
                } catch {
                    return;
                }

                if (message.type === "error") {
                    const msg = message.error?.message || "OpenAI realtime error";
                    sendToClient({ type: "error", message: msg });
                    return;
                }

                if (message.type === "conversation.item.input_audio_transcription.delta") {
                    const itemId = typeof message.item_id === "string" ? message.item_id : null;
                    const delta = typeof message.delta === "string" ? message.delta : "";

                    if (!itemId || delta.length === 0) {
                        return;
                    }

                    if (currentItemId !== itemId) {
                        currentItemId = itemId;
                        currentDelta = "";
                    }

                    currentDelta += delta;

                    const combined = finalTranscript
                        ? `${finalTranscript} ${currentDelta}`
                        : currentDelta;

                    emitTranscript(false, combined);
                    return;
                }

                if (message.type === "conversation.item.input_audio_transcription.completed") {
                    const transcript = typeof message.transcript === "string" ? message.transcript : "";

                    if (transcript.trim().length === 0) {
                        return;
                    }

                    finalTranscript = finalTranscript
                        ? `${finalTranscript} ${transcript}`
                        : transcript;

                    currentItemId = null;
                    currentDelta = "";

                    emitTranscript(true, finalTranscript);
                }
            });

            openaiWebSocket.addEventListener("close", () => {
                closeAll(1011, "OpenAI websocket closed");
            });

            openaiWebSocket.addEventListener("error", () => {
                sendToClient({ type: "error", message: "OpenAI websocket error" });
                closeAll(1011, "OpenAI websocket error");
            });


            server.addEventListener("close", () => {
                closeAll();
            });

            server.addEventListener("error", () => {
                closeAll(1011, "Client websocket error");
            });

            return new Response(null, { status: 101, webSocket: client });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Worker websocket proxy error";
            sendToClient({ type: "error", message });
            closeAll(1011, message);
            return new Response(null, { status: 101, webSocket: client });
        }
    }
};
