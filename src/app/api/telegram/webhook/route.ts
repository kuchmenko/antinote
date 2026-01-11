import { NextRequest, NextResponse } from "next/server";
import { TelegramBotService } from "@/lib/services/telegram-bot";

const bot = new TelegramBotService(process.env.TELEGRAM_BOT_TOKEN || "");

export async function POST(req: NextRequest) {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
        return NextResponse.json({ error: "Bot token not configured" }, { status: 500 });
    }

    try {
        const update = await req.json();
        await bot.handleUpdate(update);
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Telegram Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
