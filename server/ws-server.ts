import { WebSocketServer, WebSocket } from "ws";
import http from "http";

const PORT = process.env.WS_PORT || 3001;

const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("WebSocket server is running");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (clientWs: WebSocket) => {
    console.log("Client connected");

    let openaiWs: WebSocket | null = null;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error("OPENAI_API_KEY not set");
        clientWs.close();
        return;
    }

    openaiWs = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview`,
        ["realtime", apiKey]
    );

    openaiWs.on("open", () => {
        console.log("Connected to OpenAI Realtime API");

        const sessionUpdate = {
            type: "session.update",
            session: {
                modalities: ["text", "audio"],
                instructions: "Transcribe the user's speech accurately in real-time. Output text only, no conversational responses.",
                voice: "alloy",
                input_audio_format: "pcm16",
                output_audio_format: "pcm16",
                input_audio_transcription: {
                    model: "whisper-1"
                }
            }
        };

        openaiWs?.send(JSON.stringify(sessionUpdate));
    });

    openaiWs.on("message", (data: Buffer) => {
        try {
            const message = JSON.parse(data.toString());

            if (message.type === "conversation.item.input_audio_transcription.completed") {
                const transcript = message.item?.input_audio_transcription?.transcript || "";

                if (transcript) {
                    const transcriptionEvent = {
                        type: "transcription",
                        isFinal: true,
                        transcript,
                        timestamp: Date.now()
                    };
                    clientWs.send(JSON.stringify(transcriptionEvent));
                }
            } else if (message.type === "error") {
                console.error("OpenAI error:", message.error);
                const errorEvent = {
                    type: "error",
                    message: message.error?.message || "Unknown error"
                };
                clientWs.send(JSON.stringify(errorEvent));
            } else {
                clientWs.send(data.toString());
            }
        } catch (error) {
            console.error("Failed to parse OpenAI message:", error);
        }
    });

    openaiWs.on("error", (error: Error) => {
        console.error("OpenAI WebSocket error:", error);
        const errorEvent = {
            type: "error",
            message: "Connection to OpenAI failed"
        };
        clientWs.send(JSON.stringify(errorEvent));
    });

    openaiWs.on("close", () => {
        console.log("OpenAI connection closed");
    });

    clientWs.on("message", (data: Buffer) => {
        try {
            const message = JSON.parse(data.toString());

            if (message.type === "audio") {
                const base64Audio = message.audio;
                if (base64Audio) {
                    const audioBuffer = Buffer.from(base64Audio, "base64");
                    openaiWs?.send(JSON.stringify({
                        type: "input_audio_buffer.append",
                        audio: base64Audio
                    }));
                }
            } else if (message.type === "ping") {
                clientWs.send(JSON.stringify({ type: "pong" }));
            }
        } catch (error) {
            console.error("Failed to parse client message:", error);
        }
    });

    clientWs.on("close", () => {
        console.log("Client disconnected");
        openaiWs?.close();
    });

    clientWs.on("error", (error: Error) => {
        console.error("Client WebSocket error:", error);
    });
});

wss.on("error", (error: Error) => {
    console.error("WebSocket server error:", error);
});

server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
});
