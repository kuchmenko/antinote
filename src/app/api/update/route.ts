import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { entries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { StructuredData } from "@/lib/services/types";

export async function PATCH(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { entryId, updatedData } = body as {
            entryId: string;
            updatedData: Partial<StructuredData>
        };

        if (!entryId) {
            return NextResponse.json({ error: "Entry ID is required" }, { status: 400 });
        }

        // Get current entry to merge updates
        const [currentEntry] = await db
            .select()
            .from(entries)
            .where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
            .limit(1);

        if (!currentEntry) {
            return NextResponse.json({ error: "Entry not found or unauthorized" }, { status: 404 });
        }

        // Merge updated data with current structured data
        const currentStructured = currentEntry.structuredData as StructuredData;
        const mergedData: StructuredData = {
            ...currentStructured,
            ...updatedData,
        };

        // Update entry
        const [updated] = await db
            .update(entries)
            .set({
                structuredData: mergedData,
            })
            .where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
            .returning();

        return NextResponse.json({ success: true, entry: updated });
    } catch (error) {
        console.error("Error updating entry:", error);
        return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
    }
}
