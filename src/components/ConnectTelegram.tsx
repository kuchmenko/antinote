"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export default function ConnectTelegram() {
    const [loading, setLoading] = useState(false);

    const handleConnect = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/telegram/connect", { method: "POST" });
            const data = await res.json();
            if (data.link) {
                window.open(data.link, "_blank");
            } else {
                alert("Failed to generate connection link.");
            }
        } catch (error) {
            console.error(error);
            alert("Error connecting to Telegram.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleConnect}
            className="px-6 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-sm flex items-center gap-2 backdrop-blur-md"
        >
            <Send className="w-4 h-4" />
            {loading ? "Connecting..." : "Connect Telegram"}
        </button>
    );
}
