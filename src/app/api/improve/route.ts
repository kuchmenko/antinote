import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { entries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { StructuredData } from "@/lib/services/types";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { entryId, instruction } = body as {
            entryId: string;
            instruction: string;
        };

        if (!entryId || !instruction) {
            return NextResponse.json({
                error: "Entry ID and instruction are required"
            }, { status: 400 });
        }

        // Get current entry
        const [currentEntry] = await db
            .select({
                id: entries.id,
                userId: entries.userId,
                transcript: entries.transcript,
                structuredData: entries.structuredData,
                createdAt: entries.createdAt,
            })
            .from(entries)
            .where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
            .limit(1);

        if (!currentEntry) {
            return NextResponse.json({
                error: "Entry not found or unauthorized"
            }, { status: 404 });
        }

        const currentData = currentEntry.structuredData as StructuredData;

        // Build AI prompt for improvement
        const prompt = `
You are an expert personal assistant helping to improve a user's note entry.

**Original Entry:**
Type: ${currentData.type}
Content: ${currentData.content}
Tags: ${currentData.tags.join(", ")}
${currentData.next_steps ? `Action Items: ${currentData.next_steps.join(", ")}` : ""}

**User's Improvement Instruction:**
"${instruction}"

**Your Task:**
Improve this entry based on the user's instruction. Maintain the same language as the original content.
You may:
- Enhance or modify the content
- Add, remove, or refine tags
- Add, enhance, or restructure action items
- Change the type if it makes more sense

Return ONLY valid JSON matching this structure:
{
  "type": "task" | "idea" | "worry" | "plan" | "unknown",
  "content": "improved content string",
  "tags": ["tag1", "tag2"],
  "next_steps": ["step1", "step2"] (optional, can be empty array or omitted)
}

Make meaningful improvements that align with the user's instruction while preserving the core intent of the original entry.
`;

        // Call OpenAI to improve the entry
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a helpful assistant that outputs JSON." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error("No content returned from OpenAI");
        }

        const improvedData = JSON.parse(content) as StructuredData;

        // Update entry in database
        const [updated] = await db
            .update(entries)
            .set({
                structuredData: improvedData,
            })
            .where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
            .returning();

        return NextResponse.json({
            success: true,
            structuredData: improvedData,
            entry: updated
        });
    } catch (error) {
        console.error("Error improving entry:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Failed to improve entry"
        }, { status: 500 });
    }
}
