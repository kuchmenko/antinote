import { NextResponse } from "next/server";

const WS_HOST = "localhost";
const WS_PORT = "3001";

export async function GET(request: Request) {
    const protocol = process.env.NODE_ENV === "production" ? "wss" : "ws";
    const wsUrl = `${protocol}://${WS_HOST}:${WS_PORT}`;

    return NextResponse.json({
        wsUrl,
        mode: process.env.NODE_ENV || "development",
        message: "WebSocket URL for testing"
    });
}
