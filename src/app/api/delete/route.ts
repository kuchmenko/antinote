import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { entries } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const entryId = searchParams.get("id");

        if (!entryId) {
            return NextResponse.json({ error: "Entry ID is required" }, { status: 400 });
        }

        // Delete entry (verify ownership)
        const result = await db
            .delete(entries)
            .where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
            .returning();

        if (result.length === 0) {
            return NextResponse.json({ error: "Entry not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json({ success: true, id: entryId });
    } catch (error) {
        console.error("Error deleting entry:", error);
        return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
    }
}
