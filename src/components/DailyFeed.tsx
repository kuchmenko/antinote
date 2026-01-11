"use client";

import { motion } from "framer-motion";
import NoteCard from "./NoteCard";
import { MOCK_FEED } from "@/lib/mock-data";

export default function DailyFeed() {
    return (
        <section className="w-full max-w-[800px] mx-auto mt-32 pb-32">
            <div className="flex items-center justify-center mb-16 space-x-4">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/20" />
                <h2 className="text-sm font-medium uppercase tracking-[0.3em] text-white/40">Stream</h2>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/20" />
            </div>

            <div className="flex flex-col items-center gap-12">
                {MOCK_FEED.map((entry, index) => (
                    <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.15, duration: 0.8, ease: "easeOut" }}
                        className="w-full flex flex-col items-center"
                    >
                        <div className="flex flex-col items-center mb-4">
                            <div className="h-8 w-px bg-gradient-to-b from-transparent to-white/10 mb-2" />
                            <span className="text-[10px] font-mono text-white/20">
                                {entry.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <NoteCard data={entry.structured} />
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
