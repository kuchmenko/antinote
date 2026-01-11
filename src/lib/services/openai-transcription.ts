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
                language: "en", // Optional: Auto-detect is default, but 'en' is faster if we know it's English
            });

            return response.text;
        } catch (error) {
            console.error("OpenAI Transcription Error:", error);
            throw new Error("Failed to transcribe audio");
        }
    }
}
