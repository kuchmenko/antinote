import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
        return new Response(
            JSON.stringify({ error: "OpenAI API key not configured" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    return new Response(
        JSON.stringify({
            apiKey: openaiApiKey,
            realtimeUrl: "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview"
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
    );
}
