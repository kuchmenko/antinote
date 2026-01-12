import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { searchEntries } from "@/lib/services/search-service";

export async function GET(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (!query || query.trim().length === 0) {
            return NextResponse.json({ results: [] });
        }

        const results = await searchEntries(userId, query);

        return NextResponse.json({ results });
    } catch (error) {
        console.error("Search API Error:", error);
        return NextResponse.json(
            { error: "Search failed" },
            { status: 500 }
        );
    }
}
