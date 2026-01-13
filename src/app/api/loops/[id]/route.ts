import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateLoopStatus, snoozeLoop, unsnoozeLoop, updateLoopContent, deleteLoop } from "@/lib/services/loops-service";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    console.log('[BE][/api/loops/:id] PATCH request', { id });
    const { userId } = await auth();
    if (!userId) {
        console.log('[BE][/api/loops/:id] Unauthorized - no userId');
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status, snoozedUntil, content } = body;

    console.log('[BE][/api/loops/:id] Request body', { status, snoozedUntil, hasContent: !!content });

    if (status) {
        await updateLoopStatus(id, status);
    }

    if (snoozedUntil === null) {
        await unsnoozeLoop(id);
    } else if (snoozedUntil) {
        await snoozeLoop(id, new Date(snoozedUntil));
    }

    if (content) {
        await updateLoopContent(id, content);
    }

    console.log('[BE][/api/loops/:id] PATCH completed successfully');
    return NextResponse.json({ success: true });
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    console.log('[BE][/api/loops/:id] DELETE request', { id });
    const { userId } = await auth();
    if (!userId) {
        console.log('[BE][/api/loops/:id] Unauthorized - no userId');
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteLoop(id);
    console.log('[BE][/api/loops/:id] DELETE completed successfully');
    return NextResponse.json({ success: true });
}
