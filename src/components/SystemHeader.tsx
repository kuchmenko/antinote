"use client";

import { useState, useEffect } from "react";
import { Activity } from "lucide-react";

export default function SystemHeader({ loopCount }: { loopCount: number }) {
    const [time, setTime] = useState<string>("");

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
            }));
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full flex items-center justify-between text-xs font-mono text-white/40 uppercase tracking-widest mb-12 select-none">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span>Daily OS v1.0</span>
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 font-bold text-white/60">
                {time}
            </div>

            <div className="flex items-center gap-2">
                <Activity size={12} />
                <span>{loopCount} Active Loops</span>
            </div>
        </div>
    );
}
