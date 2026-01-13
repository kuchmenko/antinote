"use client";

import { useState } from "react";
import { Loop } from "@/lib/services/types";
import { LoopCard } from "@/components/LoopCard";
import { motion, AnimatePresence } from "framer-motion";

// Helper type for data passed from Server Components (where Dates are serialized to strings)
export interface SerializedLoop extends Omit<Loop, "createdAt" | "dueAt" | "snoozedUntil" | "doneAt"> {
    createdAt: string;
    dueAt?: string | null;
    snoozedUntil?: string | null;
    doneAt?: string | null;
}

interface LoopsFeedProps {
    loops: SerializedLoop[];
}

export default function LoopsFeed({ loops: serializedLoops }: LoopsFeedProps) {
    // Hydrate dates
    const initialLoops: Loop[] = serializedLoops.map(l => ({
        ...l,
        createdAt: new Date(l.createdAt),
        dueAt: l.dueAt ? new Date(l.dueAt) : null,
        snoozedUntil: l.snoozedUntil ? new Date(l.snoozedUntil) : null,
        doneAt: l.doneAt ? new Date(l.doneAt) : null,
    }));

    const [localLoops, setLocalLoops] = useState<Loop[]>(initialLoops);

    const open = localLoops.filter(l => l.status === "open");
    const done = localLoops.filter(l => l.status === "done");
    const snoozed = localLoops.filter(l => l.status === "snoozed");

    return (
        <div className="w-full max-w-2xl space-y-8 pb-32">
            {/* Open Loops */}
            <section>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-400 rounded-full" />
                    Open ({open.length})
                </h3>
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {open.map(loop => (
                            <motion.div
                                key={loop.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <LoopCard loop={loop} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {open.length === 0 && (
                        <div className="text-white/20 text-sm italic">No open loops.</div>
                    )}
                </div>
            </section>

            {/* Snoozed Loops */}
            {snoozed.length > 0 && (
                <section>
                    <h3 className="text-lg font-semibold text-white/60 mb-4 flex items-center gap-2">
                        <div className="h-2 w-2 bg-orange-400 rounded-full" />
                        Snoozed ({snoozed.length})
                    </h3>
                    <div className="space-y-3 opacity-80">
                        {snoozed.map(loop => (
                            <LoopCard key={loop.id} loop={loop} />
                        ))}
                    </div>
                </section>
            )}

            {/* Done Loops */}
            {done.length > 0 && (
                <section>
                    <details className="group">
                        <summary className="text-lg font-semibold text-white/40 mb-4 cursor-pointer hover:text-white/60 transition-colors flex items-center gap-2">
                            <div className="h-2 w-2 bg-green-400 rounded-full" />
                            Completed ({done.length})
                        </summary>
                        <div className="space-y-3 pl-4 border-l-2 border-white/10 opacity-60">
                            {done.map(loop => (
                                <LoopCard key={loop.id} loop={loop} />
                            ))}
                        </div>
                    </details>
                </section>
            )}
        </div>
    );
}
