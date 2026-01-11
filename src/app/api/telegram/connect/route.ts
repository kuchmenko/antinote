import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { connectTokens } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const token = uuidv4();
        // Expires in 5 minutes
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await db.insert(connectTokens).values({
            userId,
            token,
            expiresAt,
        });

        // Use a generic bot username env var or just assume user knows the bot
        // Ideally: https://t.me/MyBot?start=token
        // We can return the full link if we know the bot username
        const botUsername = process.env.TELEGRAM_BOT_USERNAME || "AntinoteBot";
        const link = `https://t.me/${botUsername}?start=${token}`;

        return NextResponse.json({ link });
    } catch (error) {
        console.error("Connect Token Error:", error);
        return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
    }
}
