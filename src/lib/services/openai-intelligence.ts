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
    
    The voice note may be in ANY language (English, Russian, etc.). 
    **CRITICAL: Preserve the original language of the note for the 'content', 'tags', and 'next_steps' fields.**

    Analyze the text and determine its primary type:
    - 'task': Actionable items, to-dos.
    - 'idea': Thoughts, concepts, creative sparks.
    - 'worry': Anxieties, concerns, things weighing on the mind.
    - 'plan': Future events, trips, schedules.
    - 'unknown': If it doesn't fit clearly.

    Extract:
    - content: The core message, cleaned up (in original language).
    - tags: 2-4 relevant tags (lowercase, in original language).
    - next_steps: 1-3 concrete, actionable next steps if applicable (in original language).

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
                model: "gpt-5-mini",
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
        console.log(`[OpenAI] Synthesizing ${transcripts.length} entries...`);

        const combinedText = transcripts.join("\n\n---\n\n");
        const prompt = `
    You are an expert executive assistant. Your goal is to synthesize the user's daily notes into a cohesive summary and action plan.

    Here are the raw notes from today:
    ${combinedText}

    **Language Instruction**: Detect the primary language of the notes (e.g., Russian or English). Generate the summary **IN THAT SAME LANGUAGE**.

    Please generate a markdown summary that includes:
    1.  **Executive Summary**: A 2-3 sentence overview of the day's themes.
    2.  **Key Action Items**: A checklist of the most important tasks extracted from the notes.
    3.  **Insights & Ideas**: A bulleted list of creative sparks or important thoughts.
    4.  **Tomorrow's Plan**: A suggested schedule or focus for the next day based on these notes.

    Format the output in clean, professional Markdown. Use emojis sparingly but effectively.
    `;

        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: "You are a helpful assistant that outputs Markdown." },
                    { role: "user", content: prompt }
                ],
            });

            const content = response.choices[0].message.content;
            if (!content) throw new Error("No content returned from OpenAI");

            return content;
        } catch (error) {
            console.error("OpenAI Synthesis Error:", error);
            return "Failed to generate synthesis. Please try again later.";
        }
    }

    async compileDay(newEntries: { content: string; createdAt: Date }[], previousSummary?: string): Promise<string> {
        console.log(`[OpenAI] Compiling day with ${newEntries.length} new entries...`);

        const newEntriesText = newEntries.map(e => `[${new Date(e.createdAt).toLocaleTimeString()}] ${e.content}`).join("\n");

        let prompt = "";
        if (previousSummary) {
            prompt = `
            You are an expert executive assistant. You are maintaining a living document of the user's day.
            
            Here is the current summary of the day so far:
            ${previousSummary}
            
            Here are NEW notes that have come in since the last update:
            ${newEntriesText}
            
            **Task**: Update the summary to incorporate the new information.
            - If new tasks were added, add them to the action items.
            - If new ideas/thoughts were added, integrate them.
            - If the new notes clarify or contradict previous ones, update accordingly.
            - Maintain the same structure (Executive Summary, Key Action Items, Insights, Tomorrow's Plan).
            - **CRITICAL**: Keep the tone professional and concise. Maintain the language of the notes.
            `;
        } else {
            prompt = `
            You are an expert executive assistant. Your goal is to separate signal from noise and create a clear summary of the user's day based on their notes.
            
            Here are the raw notes:
            ${newEntriesText}
            
            **Language Instruction**: Detect the primary language. Output IN THAT LANGUAGE.
            
            Please generate a markdown summary that includes:
            1.  **Executive Summary**: A brief overview.
            2.  **Key Action Items**: A checklist of tasks.
            3.  **Insights & Ideas**: Bulleted list.
            4.  **Tomorrow's Plan**: Suggested focus.
            
            Format in clean Markdown.
            `;
        }

        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: "You are a helpful assistant that outputs Markdown." },
                    { role: "user", content: prompt }
                ],
            });

            const content = response.choices[0].message.content;
            if (!content) throw new Error("No content returned from OpenAI");

            return content;
        } catch (error) {
            console.error("OpenAI Compilation Error:", error);
            throw error;
        }
    }

    async createEmbedding(text: string): Promise<number[]> {
        console.log(`[OpenAI] Creating embedding for: "${text.substring(0, 30)}..."`);

        try {
            const response = await this.openai.embeddings.create({
                model: "text-embedding-3-small",
                input: text,
            });

            return response.data[0].embedding;
        } catch (error) {
            console.error("OpenAI Embedding Error:", error);
            throw new Error("Failed to create embedding");
        }
    }
}
