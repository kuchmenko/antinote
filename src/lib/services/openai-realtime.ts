import OpenAI from "openai";

export interface TranscriptionEvent {
    isFinal: boolean;
    transcript: string;
    timestamp: number;
}

export interface RealtimeCallbacks {
    onTranscript: (event: TranscriptionEvent) => void;
    onError: (error: Error) => void;
    onConnected: () => void;
    onDisconnected: () => void;
}

export class OpenAIRealtimeService {
    private ws: WebSocket | null = null;
    private callbacks: RealtimeCallbacks;
    private apiKey: string;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 3;
    private realtimeUrl: string;

    constructor(apiKey: string, callbacks: RealtimeCallbacks, realtimeUrl?: string) {
        this.apiKey = apiKey;
        this.callbacks = callbacks;
        this.realtimeUrl = realtimeUrl || `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview`;
    }

    connect(): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            return;
        }

        this.ws = new WebSocket(this.realtimeUrl, [
            "realtime",
            this.apiKey
        ]);

        this.ws.onopen = () => {
            this.reconnectAttempts = 0;
            this.callbacks.onConnected();
            this.sendSessionUpdate();
        };

        this.ws.onmessage = (event) => {
            this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
            this.callbacks.onError(new Error(`WebSocket error: ${error}`));
        };

        this.ws.onclose = () => {
            this.callbacks.onDisconnected();

            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
            }
        };
    }

    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    private sendSessionUpdate(): void {
        const message = {
            type: "session.update",
            session: {
                modalities: ["text", "audio"],
                instructions: "Transcribe user's speech accurately and in real-time. Output text only, no conversational responses.",
                voice: "alloy",
                input_audio_format: "pcm16",
                output_audio_format: "pcm16",
                input_audio_transcription: {
                    model: "whisper-1"
                }
            }
        };

        this.send(JSON.stringify(message));
    }

    sendAudio(audioData: ArrayBuffer): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            const message = {
                type: "input_audio_buffer.append",
                audio: this.base64Encode(audioData)
            };

            this.send(JSON.stringify(message));
        }
    }

    sendBase64Audio(base64Audio: string): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            const message = {
                type: "input_audio_buffer.append",
                audio: base64Audio
            };

            this.send(JSON.stringify(message));
        }
    }

    private send(data: string): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(data);
        }
    }

    private handleMessage(data: string | ArrayBuffer): void {
        if (typeof data !== "string") {
            return;
        }

        try {
            const message = JSON.parse(data);

            switch (message.type) {
                case "session.created":
                case "session.updated":
                    console.log("Realtime session:", message.session);
                    break;

                case "conversation.item.input_audio_transcription.completed":
                    this.handleTranscription(message);
                    break;

                case "error":
                    this.callbacks.onError(new Error(message.error?.message || "Realtime API error"));
                    break;

                default:
                    break;
            }
        } catch (error) {
            console.error("Failed to parse message:", error);
        }
    }

    private handleTranscription(message: any): void {
        const transcript = message.transcript || "";
        const transcription = message.item?.input_audio_transcription;

        if (transcription) {
            this.callbacks.onTranscript({
                isFinal: true,
                transcript,
                timestamp: Date.now()
            });
        }
    }

    private base64Encode(data: ArrayBuffer): string {
        const bytes = new Uint8Array(data);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
}

export function createRealtimeService(apiKey: string, callbacks: RealtimeCallbacks, realtimeUrl?: string): OpenAIRealtimeService {
    return new OpenAIRealtimeService(apiKey, callbacks, realtimeUrl);
}
