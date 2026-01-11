import OpenAI from "openai";
import { IntelligenceService, StructuredData } from "./types";

export class OpenAIIntelligenceService implements IntelligenceService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    async structure(transcript: string): Promise<StructuredData> {
        console.log(`[OpenAI] Structuring: "${transcript.substring(0, 20)}..."`);

        const prompt = `
    You are an expert personal assistant. Your goal is to structure the following voice note into a structured format.
    
    Analyze the text and determine its primary type:
    - 'task': Actionable items, to-dos.
    - 'idea': Thoughts, concepts, creative sparks.
    - 'worry': Anxieties, concerns, things weighing on the mind.
    - 'plan': Future events, trips, schedules.
    - 'unknown': If it doesn't fit clearly.

    Extract:
    - content: The core message, cleaned up.
    - tags: 2-4 relevant tags (lowercase).
    - next_steps: 1-3 concrete, actionable next steps if applicable.

    Return ONLY valid JSON matching this structure:
    {
      "type": "task" | "idea" | "worry" | "plan" | "unknown",
      "content": "string",
      "tags": ["string"],
      "next_steps": ["string"] (optional)
    }

    Voice Note:
    "${transcript}"
    `;

        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: "You are a helpful assistant that outputs JSON." },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" },
            });

            const content = response.choices[0].message.content;
            if (!content) throw new Error("No content returned from OpenAI");

            const data = JSON.parse(content) as StructuredData;
            return data;
        } catch (error) {
            console.error("OpenAI Intelligence Error:", error);
            // Fallback to basic structure on error
            return {
                type: "unknown",
                content: transcript,
                tags: ["error", "raw"],
            };
        }
    }

    async synthesize(transcripts: string[]): Promise<string> {
        // Implementation for end-of-day synthesis (future)
        return "Synthesis not implemented yet.";
    }
}
