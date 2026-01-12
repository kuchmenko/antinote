import { NextResponse } from "next/server";
import { OpenAIIntelligenceService } from "@/lib/services/openai-intelligence";
import { db } from "@/db";
import { entries, compilations } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq, gt, desc, gte, lt } from "drizzle-orm";

export async function POST(request: Request) {
    try {
        const { date } = await request.json(); // Expect YYYY-MM-DD
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!date) {
            return NextResponse.json({ error: "Date is required" }, { status: 400 });
        }

        // 1. Get latest compilation for this day
        const [latestCompilation] = await db
            .select()
            .from(compilations)
            .where(and(
                eq(compilations.userId, userId),
                eq(compilations.date, date)
            ))
            .orderBy(desc(compilations.compiledAt))
            .limit(1);

        // 2. Determine time range for new entries
        let query;

        if (latestCompilation) {
            // Get entries after the last compilation
            query = db
                .select()
                .from(entries)
                .where(and(
                    eq(entries.userId, userId),
                    gt(entries.createdAt, latestCompilation.compiledAt)
                ));
        } else {
            // Get all entries for the day
            // Assuming date is in local time, we need to cover the full day in UTC? 
            // For simplicity in this v1, we'll fetch all entries created on this date string 
            // BUT entries.createdAt is timestamp. 
            // We'll rely on client passing the start/end or just filter safely.
            // Let's assume we want ALL entries that haven't been compiled yet?
            // Or just all entries for that "day" logic.

            // Allow client to pass timezone offset? 
            // For now, let's just grab entries from the last 24h if date is today.
            // A better approach is to rely on client timestamp?

            // Let's grab everything from the start of the requested date.
            const startDate = new Date(date);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);

            query = db
                .select()
                .from(entries)
                .where(and(
                    eq(entries.userId, userId),
                    gte(entries.createdAt, startDate),
                    lt(entries.createdAt, endDate)
                ));
        }

        const newEntries = await query;
        console.log(`Found ${newEntries.length} new entries for compilation`);

        if (newEntries.length === 0) {
            // Nothing to update
            return NextResponse.json({
                message: "No new entries to compile",
                compilation: latestCompilation
            });
        }

        // 3. Compile
        const service = new OpenAIIntelligenceService();
        const previousContent = latestCompilation?.content;

        // Prepare simplified entries for AI
        const entriesForAi = newEntries.map(e => ({
            content: e.transcript, // Use raw transcript as we might not have structure or structure is skipped
            createdAt: e.createdAt
        }));

        const newContent = await service.compileDay(entriesForAi, previousContent);

        // 4. Save new compilation
        const allEntryIds = [
            ...(latestCompilation?.relatedEntryIds as string[] || []),
            ...newEntries.map(e => e.id)
        ];

        const [saved] = await db.insert(compilations).values({
            userId,
            date,
            content: newContent,
            relatedEntryIds: allEntryIds,
        }).returning();

        return NextResponse.json({ compilation: saved });

    } catch (error) {
        console.error("Compilation error:", error);
        return NextResponse.json({ error: "Compilation failed" }, { status: 500 });
    }
}
