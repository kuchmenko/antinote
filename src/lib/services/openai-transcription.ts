import OpenAI from "openai";
import { TranscriptionService } from "./types";

export class OpenAITranscriptionService implements TranscriptionService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    async transcribe(audioBlob: Blob): Promise<string> {
        console.log(`[OpenAI] Transcribing ${audioBlob.size} bytes...`);

        // Convert Blob to File object which OpenAI SDK expects
        const file = new File([audioBlob], "recording.webm", { type: "audio/webm" });

        try {
            const response = await this.openai.audio.transcriptions.create({
                file: file,
                model: "whisper-1",
                // language: "en", // Removed to allow auto-detection
                prompt: "Voice note, clear speech, professional context, tasks, ideas, plans. Голосовая заметка, четкая речь.",
            });

            return response.text;
        } catch (error) {
            console.error("OpenAI Transcription Error:", error);
            throw new Error("Failed to transcribe audio");
        }
    }
}
