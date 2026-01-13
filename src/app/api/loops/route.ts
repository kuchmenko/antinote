import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getLoopsForDate } from "@/lib/services/loops-service";

export async function GET(request: NextRequest) {
    console.log('[BE][/api/loops] GET request received');
    const { userId } = await auth();
    if (!userId) {
        console.log('[BE][/api/loops] Unauthorized - no userId');
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const dateStr = searchParams.get("date");
    const date = dateStr ? new Date(dateStr) : new Date();

    console.log('[BE][/api/loops] Fetching loops', { userId, dateStr, date });

    const { today, carryover } = await getLoopsForDate(userId, date);

    const allLoops = [...today, ...carryover];
    console.log('[BE][/api/loops] Returning loops:', { today: today.length, carryover: carryover.length, total: allLoops.length });

    return NextResponse.json(allLoops);
}
