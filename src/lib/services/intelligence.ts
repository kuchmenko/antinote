import { IntelligenceService, StructuredData } from "./types";

export class MockIntelligenceService implements IntelligenceService {
    async structure(transcript: string): Promise<StructuredData> {
        console.log(`[MockIntelligence] Structuring: "${transcript.substring(0, 20)}..."`);

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Simple keyword-based mock logic
        if (transcript.toLowerCase().includes("buy") || transcript.toLowerCase().includes("finish")) {
            return {
                type: "task",
                content: transcript,
                tags: ["todo", "urgent"],
                next_steps: ["Create task in tracker", "Set due date"]
            };
        }

        return {
            type: "idea",
            content: transcript,
            tags: ["thought"],
        };
    }

    async synthesize(transcripts: string[]): Promise<string> {
        return `Synthesis of ${transcripts.length} notes: You seem focused on productivity today.`;
    }

    async createEmbedding(text: string): Promise<number[]> {
        // Return 1536 random zeros/ones (mock embedding) or just empty
        return new Array(1536).fill(0);
    }
}
