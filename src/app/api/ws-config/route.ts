import { NextRequest, NextResponse } from "next/server";

const defaultLocalWsUrl = "ws://localhost:3001";
const defaultCloudflareWsUrl = "wss://antinote-ws.kuchmenko.space/ws";

export async function GET(request: NextRequest) {
    const fromEnv = process.env.TRANSCRIBE_WS_URL;
    const wsUrl =
        fromEnv ||
        (process.env.NODE_ENV === "production" ? defaultCloudflareWsUrl : defaultLocalWsUrl);

    return NextResponse.json({
        wsUrl,
        message: "Connect to this URL for real-time transcription"
    });
}
