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
    You are a wise, stoic mentor and personal biographer. Your goal is to help the user reflect on their day, finding meaning in their actions and thoughts.
    
    Here are the raw notes from today:
    ${combinedText}

    **Language Instruction**: Detect the primary language of the notes. Generate the summary **IN THAT SAME LANGUAGE**.

    Please generate a markdown summary that feels like a rewarding chapter of their life:
    1.  **The Day's Narrative**: A warm, insightful reflection on what the user accomplished and thought about. Focus on the *why* and the *feeling*, not just the *what*. Acknowledge struggles with empathy and celebrate wins with pride.
    2.  **Actionable Wisdom**: A checklist of the most critical tasks, framed as steps towards their larger goals.
    3.  **Sparks & Insights**: A list of the creative ideas or deep thoughts they had, highlighted as valuable gems to keep.
    4.  **Focus for Tomorrow**: A gentle but firm suggestion for where to direct their energy next, based on today's momentum.

    Format the output in clean, beautiful Markdown. Use formatting (bold, italics) to emphasize key points. Use emojis to add warmth but keep it elegant.
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
            You are a wise, stoic mentor and personal biographer. You are maintaining a living narrative of the user's day.
            
            Here is the current narrative of the day so far:
            ${previousSummary}
            
            Here are NEW notes that have come in since the last update:
            ${newEntriesText}
            
            **Task**: Update the narrative to incorporate the new experiences and thoughts.
            - Weave new tasks into the actionable wisdom.
            - Add new ideas to the sparks & insights.
            - If new notes clarify or contradict previous ones, update the narrative flow naturally.
            - Maintain the structure (The Day's Narrative, Actionable Wisdom, Sparks & Insights, Focus for Tomorrow).
            - **CRITICAL**: Keep the tone warm, insightful, and encouraging. Maintain the language of the notes.
            `;
        } else {
            prompt = `
            You are a wise, stoic mentor and personal biographer. Your goal is to help the user see the signal in the noise of their day.
            
            Here are the raw notes:
            ${newEntriesText}
            
            **Language Instruction**: Detect the primary language. Output IN THAT LANGUAGE.
            
            Please generate a markdown summary that feels like a rewarding chapter:
            1.  **The Day's Narrative**: A warm, insightful reflection.
            2.  **Actionable Wisdom**: A checklist of critical steps.
            3.  **Sparks & Insights**: A list of valuable ideas.
            4.  **Focus for Tomorrow**: A guiding suggestion.
            
            Format in clean, beautiful Markdown.
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
