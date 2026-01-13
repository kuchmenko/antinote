"use client";

import { Loop } from "@/lib/services/types";
import { useLoops } from "@/hooks/useLoops";
import { formatDistanceToNow } from "date-fns";

interface LoopCardProps {
    loop: Loop;
    showSource?: boolean;
}

export function LoopCard({ loop, showSource = false }: LoopCardProps) {
    console.log('[FE][LoopCard] Rendering', { id: loop.id, type: loop.type, status: loop.status });
    const { markDone, snooze, unsnooze } = useLoops();
    const handleDone = () => markDone(loop.id);
    const handleSnoozeToday = () => {
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59);
        console.log('[FE][LoopCard] Snoozing until today end', { id: loop.id, endOfDay });
        snooze({ loopId: loop.id, until: endOfDay });
    };
    const handleSnoozeTomorrow = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0);
        console.log('[FE][LoopCard] Snoozing until tomorrow', { id: loop.id, tomorrow });
        snooze({ loopId: loop.id, until: tomorrow });
    };
    const handleUnsnooze = () => {
        console.log('[FE][LoopCard] Unsnoozing', { id: loop.id });
        unsnooze(loop.id);
    };





    return (
        <div className="group relative flex items-center gap-4 py-3 px-4 hover:bg-white/[0.02] rounded-md transition-colors border border-transparent hover:border-white/5">
            {/* Status Dot */}
            <button
                onClick={handleDone}
                disabled={loop.status === "done"}
                className="flex-shrink-0"
            >
                <div className={`w-2 h-2 rounded-full transition-all ${loop.status === "done" ? "bg-white/20" :
                    loop.status === "snoozed" ? "bg-orange-500/50 group-hover:bg-orange-400" :
                        "bg-blue-500/50 group-hover:bg-blue-400"
                    }`} />
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0 flex items-baseline gap-3">
                <span className={`text-sm truncate ${loop.status === "done" ? "text-white/20 line-through" : "text-white/80"}`}>
                    {loop.content}
                </span>

                {/* Metadata */}
                <div className="flex items-center gap-2 text-[10px] font-mono text-white/20 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>{loop.type}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(loop.createdAt))} ago</span>
                </div>
            </div>

            {/* Actions */}
            {loop.status !== "done" && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={handleSnoozeToday}
                        className="p-1.5 text-white/20 hover:text-white/60 hover:bg-white/5 rounded transition-all text-xs"
                        title="Snooze till today"
                    >
                        🌙
                    </button>
                    <button
                        onClick={handleSnoozeTomorrow}
                        className="p-1.5 text-white/20 hover:text-white/60 hover:bg-white/5 rounded transition-all text-xs"
                        title="Snooze till tomorrow"
                    >
                        📅
                    </button>
                    {loop.status === "snoozed" && (
                        <button
                            onClick={handleUnsnooze}
                            className="p-1.5 text-white/20 hover:text-white/60 hover:bg-white/5 rounded transition-all text-xs"
                            title="Unsnooze"
                        >
                            🔄
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
