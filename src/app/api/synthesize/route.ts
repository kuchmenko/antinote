import { NextResponse } from "next/server";
import { OpenAIIntelligenceService } from "@/lib/services/openai-intelligence";
import { db } from "@/db";
import { entries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

const intelligenceService = new OpenAIIntelligenceService();

export async function POST() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch today's entries
        // For MVP, we'll just fetch the last 20 entries for the user
        // In a real app, we'd filter by date
        const userEntries = await db
            .select({
                transcript: entries.transcript,
            })
            .from(entries)
            .where(eq(entries.userId, userId))
            .orderBy(desc(entries.createdAt))
            .limit(20);

        if (userEntries.length === 0) {
            return NextResponse.json({ summary: "No entries found to synthesize." });
        }

        const transcripts = userEntries.map(e => e.transcript);
        const summary = await intelligenceService.synthesize(transcripts);

        return NextResponse.json({ summary });
    } catch (error) {
        console.error("Error synthesizing entries:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
