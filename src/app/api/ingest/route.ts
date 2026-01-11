import { NextResponse } from "next/server";
import { MockTranscriptionService } from "@/lib/services/transcription";
import { MockIntelligenceService } from "@/lib/services/intelligence";
import { OpenAITranscriptionService } from "@/lib/services/openai-transcription";
import { OpenAIIntelligenceService } from "@/lib/services/openai-intelligence";

// Factory to choose service based on env vars
const getServices = () => {
    if (process.env.OPENAI_API_KEY) {
        console.log("Using Real OpenAI Services");
        return {
            transcription: new OpenAITranscriptionService(),
            intelligence: new OpenAIIntelligenceService(),
        };
    } else {
        console.warn("OPENAI_API_KEY not found. Using Mock Services.");
        return {
            transcription: new MockTranscriptionService(),
            intelligence: new MockIntelligenceService(),
        };
    }
};

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as Blob;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        console.log("Received audio file:", file.size, "bytes");

        const { transcription, intelligence } = getServices();

        // Step 1: Transcribe
        const transcript = await transcription.transcribe(file);
        console.log("Transcript:", transcript);

        // Step 2: Parallel Intelligence Agents
        // In a real scenario, we might have multiple agents running different prompts
        // For now, we simulate one "Structuring Agent"
        const [structuredData] = await Promise.all([
            intelligence.structure(transcript),
            // Add more parallel agents here later (e.g., SentimentAgent, ActionItemAgent)
        ]);

        const response = {
            transcript,
            structured: structuredData,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error processing audio:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
