import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { extractLoopsFromEntry } from "@/lib/services/loops-service";
import { db } from "@/db";
import { entries } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{}> }
) {
    console.log('[BE][/api/loops/from-entry] POST request received');
    const { userId } = await auth();
    if (!userId) {
        console.log('[BE][/api/loops/from-entry] Unauthorized - no userId');
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const entryId = searchParams.get("entryId");

    if (!entryId) {
        console.log('[BE][/api/loops/from-entry] Missing entryId');
        return NextResponse.json({ error: "entryId required" }, { status: 400 });
    }

    console.log('[BE][/api/loops/from-entry] Fetching entry:', entryId);
    const [entry] = await db.select()
        .from(entries)
        .where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
        .limit(1);

    if (!entry) {
        console.log('[BE][/api/loops/from-entry] Entry not found:', entryId);
        return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    console.log('[BE][/api/loops/from-entry] Entry found, extracting loops');
    const createdLoops = await extractLoopsFromEntry(
        entryId,
        entry.structuredData as any,
        userId
    );

    console.log('[BE][/api/loops/from-entry] Returning created loops:', createdLoops.length);
    return NextResponse.json({ loops: createdLoops, count: createdLoops.length });
}
