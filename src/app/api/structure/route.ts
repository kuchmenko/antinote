import { NextResponse } from "next/server";
import { MockIntelligenceService } from "@/lib/services/intelligence";
import { OpenAIIntelligenceService } from "@/lib/services/openai-intelligence";
import { generateEntryEmbedding } from "@/lib/services/search-service";
import { db } from "@/db";
import { entries } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";

const getService = () => {
    if (process.env.OPENAI_API_KEY) {
        return new OpenAIIntelligenceService();
    }
    return new MockIntelligenceService();
};

export async function POST(request: Request) {
    try {
        const { transcript } = await request.json();
        const { userId } = await auth();

        if (!transcript) {
            return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
        }

        const service = getService();
        const structuredData = await service.structure(transcript);

        // Save to DB if user is authenticated
        let entryId = null;
        if (userId) {
            const [inserted] = await db.insert(entries).values({
                userId,
                transcript,
                structuredData,
            }).returning({ id: entries.id });
            entryId = inserted.id;

            // Generate embedding in background (non-blocking)
            generateEntryEmbedding(entryId).catch((err) => {
                console.error("[Structure] Failed to generate embedding:", err);
            });
        }

        return NextResponse.json({ structured: structuredData, id: entryId });
    } catch (error) {
        console.error("Structuring error:", error);
        return NextResponse.json({ error: "Structuring failed" }, { status: 500 });
    }
}

