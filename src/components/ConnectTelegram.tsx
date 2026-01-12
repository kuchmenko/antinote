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
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group hover:bg-white/[0.07] transition-colors">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#229ED9]/20 flex items-center justify-center text-[#229ED9]">
                    <Send className="w-6 h-6" />
                </div>
                <div className="flex flex-col gap-1">
                    <h3 className="font-medium text-white/90">Telegram Bot</h3>
                    <p className="text-sm text-white/40">Receive notifications and capture notes via Telegram</p>
                </div>
            </div>

            <button
                onClick={handleConnect}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? "Connecting..." : "Connect"}
            </button>
        </div>
    );
}
