import { db } from "@/db";
import { loops } from "@/db/schema";
import { Loop, LoopMeta, StructuredData } from "./types";
import { eq, and, lte, isNull, or, gt, gte, lt } from "drizzle-orm";
import crypto from "crypto";

function computeLoopHash(sourceEntryId: string, type: string, content: string): string {
    const normalized = content.trim().toLowerCase();
    const input = `${sourceEntryId}|${type}|${normalized}`;
    return crypto.createHash("sha256").update(input).digest("hex");
}

export async function createLoop(params: {
    sourceEntryId: string;
    type: Loop["type"];
    content: string;
    userId: string;
    extractedFrom: LoopMeta["extractedFrom"];
    tags?: string[];
}): Promise<Loop | null> {
    const hash = computeLoopHash(params.sourceEntryId, params.type, params.content);

    // Optimize: Filter by sourceEntryId first (much smaller set than all user loops)
    const existing = await db.select()
        .from(loops)
        .where(and(
            eq(loops.userId, params.userId),
            eq(loops.sourceEntryId, params.sourceEntryId)
        ))
        .then(rows => rows.find(l => (l.meta as any)?.hash === hash));

    if (existing) {
        return existing as unknown as Loop;
    }

    const meta: LoopMeta = {
        hash,
        extractedFrom: params.extractedFrom,
        tags: params.tags,
        origin: "auto",
    };

    const [created] = await db.insert(loops).values({
        userId: params.userId,
        sourceEntryId: params.sourceEntryId,
        type: params.type,
        content: params.content,
        status: "open",
        meta: meta as any,
    }).returning();

    return created as unknown as Loop;
}

export async function extractLoopsFromEntry(
    entryId: string,
    structured: StructuredData,
    userId: string
): Promise<Loop[]> {
    const createdLoops: Loop[] = [];

    if (structured.type === "task") {
        const loop = await createLoop({
            sourceEntryId: entryId,
            type: "task",
            content: structured.content,
            userId,
            extractedFrom: "content",
            tags: structured.tags,
        });
        if (loop) createdLoops.push(loop);
    }

    if (structured.next_steps && structured.next_steps.length > 0) {
        for (const step of structured.next_steps) {
            const loop = await createLoop({
                sourceEntryId: entryId,
                type: "task",
                content: step,
                userId,
                extractedFrom: "next_steps",
                tags: structured.tags,
            });
            if (loop) createdLoops.push(loop);
        }
    }

    if (structured.type === "worry") {
        const loop = await createLoop({
            sourceEntryId: entryId,
            type: "worry",
            content: structured.content,
            userId,
            extractedFrom: "content",
            tags: structured.tags,
        });
        if (loop) createdLoops.push(loop);
    }

    return createdLoops;
}

export async function getLoopsForDate(
    userId: string,
    date: Date
): Promise<{ today: Loop[], carryover: Loop[] }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Optimize: Use DB filtering instead of fetching all loops
    const today = await db.select()
        .from(loops)
        .where(and(
            eq(loops.userId, userId),
            gte(loops.createdAt, startOfDay),
            lte(loops.createdAt, endOfDay)
        )) as unknown as Loop[];

    const carryover = await db.select()
        .from(loops)
        .where(and(
            eq(loops.userId, userId),
            lt(loops.createdAt, startOfDay),
            eq(loops.status, "open"),
            or(isNull(loops.snoozedUntil), lte(loops.snoozedUntil, new Date()))
        )) as unknown as Loop[];

    return { today, carryover };
}

export async function updateLoopStatus(
    loopId: string,
    status: Loop["status"],
    doneAt?: Date
): Promise<void> {
    const updates: any = { status };
    if (status === "done") {
        updates.doneAt = doneAt || new Date();
    }

    await db.update(loops)
        .set(updates)
        .where(eq(loops.id, loopId));
}

export async function snoozeLoop(
    loopId: string,
    until: Date
): Promise<void> {
    await db.update(loops)
        .set({ status: "snoozed", snoozedUntil: until })
        .where(eq(loops.id, loopId));
}

export async function unsnoozeLoop(loopId: string): Promise<void> {
    await db.update(loops)
        .set({ status: "open", snoozedUntil: null })
        .where(eq(loops.id, loopId));
}

export async function updateLoopContent(
    loopId: string,
    content: string
): Promise<void> {
    await db.update(loops)
        .set({ content })
        .where(eq(loops.id, loopId));
}

export async function deleteLoop(loopId: string): Promise<void> {
    await db.delete(loops).where(eq(loops.id, loopId));
}
