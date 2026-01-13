"use client";

import { useLoopsByStatus } from "@/hooks/useLoops";
import { LoopCard } from "@/components/LoopCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface OpenLoopsSectionProps {
    compact?: boolean;
}

export function OpenLoopsSection({ compact = false }: OpenLoopsSectionProps) {
    const { open, done, snoozed } = useLoopsByStatus();

    const hasLoops = open.length > 0 || done.length > 0 || snoozed.length > 0;

    if (compact) {
        if (!hasLoops) return null;

        return (
            <div className="w-full mb-8">
                <div className="flex items-center justify-between mb-2 px-1">
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/40">Active Memory</h3>
                    <Link href="/tasks" className="text-[10px] font-mono text-white/40 hover:text-white transition-colors flex items-center gap-1 group uppercase tracking-widest">
                        View All <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
                <div className="flex items-center gap-4 text-sm font-mono">
                    {open.length > 0 && (
                        <div className="flex items-center gap-2 text-white/60">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            <span>{open.length} Open</span>
                        </div>
                    )}
                    {snoozed.length > 0 && (
                        <div className="flex items-center gap-2 text-white/40">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                            <span>{snoozed.length} Snoozed</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white/90">
                    Open Loops ({open.length})
                </h2>
                <div className="text-xs text-white/40">
                    Today ({new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </div>
            </div>

            {!hasLoops && (
                <div className="text-center py-8">
                    <div className="text-4xl mb-2">✨</div>
                    <p className="text-white/60 text-sm">
                        No open loops today. Capture something to get started!
                    </p>
                </div>
            )}

            {hasLoops && (
                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-2 w-2 bg-blue-400 rounded-full" />
                        <div className="h-16 bg-orange-400 rounded-full" />
                        <h3 className="text-lg font-semibold text-white">Today</h3>
                    </div>

                    {open.length > 0 && (
                        <div className="space-y-3">
                            {open.map((loop) => (
                                <LoopCard key={loop.id} loop={loop} />
                            ))}
                        </div>
                    )}

                    {done.length > 0 && (
                        <details className="group">
                            <summary className="text-sm text-white/40 cursor-pointer hover:text-white/60 transition-colors">
                                Completed today ({done.length})
                            </summary>
                            <div className="mt-3 space-y-3 pl-4 border-l-2 border-white/10">
                                {done.map((loop) => (
                                    <LoopCard key={loop.id} loop={loop} />
                                ))}
                            </div>
                        </details>
                    )}

                    {snoozed.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-white/10">
                            <h3 className="text-lg font-semibold text-white">Snoozed</h3>
                            <p className="text-white/60 text-sm mb-3">
                                {snoozed.length} items put on hold
                            </p>
                            <div className="space-y-3">
                                {snoozed.map((loop) => (
                                    <LoopCard key={loop.id} loop={loop} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
