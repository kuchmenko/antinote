"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NoteCard from "./NoteCard";
import clsx from "clsx";
import { StructuredData } from "@/lib/services/types";

type FilterType = "all" | "task" | "idea" | "worry" | "plan";

const filters: { id: FilterType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "task", label: "Tasks" },
    { id: "idea", label: "Ideas" },
    { id: "worry", label: "Worries" },
    { id: "plan", label: "Plans" },
];

interface DailyFeedProps {
    entries: {
        id: string;
        createdAt: Date;
        structured: StructuredData;
    }[];
}

export default function DailyFeed({ entries: initialEntries }: DailyFeedProps) {
    const [activeFilter, setActiveFilter] = useState<FilterType>("all");
    const [entries, setEntries] = useState(initialEntries);

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/delete?id=${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete entry");
            }

            // Remove from local state
            setEntries(prev => prev.filter(entry => entry.id !== id));
        } catch (error) {
            console.error("Error deleting entry:", error);
            alert("Failed to delete entry. Please try again.");
        }
    };

    const handleUpdate = async (id: string, updatedData: Partial<StructuredData>) => {
        try {
            const response = await fetch("/api/update", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ entryId: id, updatedData }),
            });

            if (!response.ok) {
                throw new Error("Failed to update entry");
            }

            // Update local state
            setEntries(prev => prev.map(entry =>
                entry.id === id
                    ? { ...entry, structured: { ...entry.structured, ...updatedData } }
                    : entry
            ));
        } catch (error) {
            console.error("Error updating entry:", error);
            alert("Failed to update entry. Please try again.");
        }
    };

    const filteredFeed = activeFilter === "all"
        ? entries
        : entries.filter(entry => entry.structured.type === activeFilter);

    return (
        <section className="w-full max-w-[800px] mx-auto mt-32 pb-32">
            {/* Filter Bar */}
            <div className="flex items-center justify-center mb-12 space-x-2 overflow-x-auto py-2">
                {filters.map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                        data-interactive="true"
                        className={clsx(
                            "relative px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition-all duration-300",
                            activeFilter === filter.id
                                ? "text-white bg-white/10 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                : "text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent"
                        )}
                    >
                        {filter.label}
                        {activeFilter === filter.id && (
                            <motion.div
                                layoutId="activeFilter"
                                className="absolute inset-0 rounded-full bg-white/5"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                ))}
            </div>

            <div className="flex items-center justify-center mb-16 space-x-4">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/20" />
                <h2 className="text-sm font-medium uppercase tracking-[0.3em] text-white/40">Stream</h2>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/20" />
            </div>

            <div className="flex flex-col items-center gap-12 min-h-[400px]">
                <AnimatePresence mode="popLayout">
                    {filteredFeed.map((entry) => (
                        <motion.div
                            key={entry.id}
                            layout
                            initial={{ opacity: 0, y: 40, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="w-full flex flex-col items-center"
                        >
                            <div className="flex flex-col items-center mb-4">
                                <div className="h-8 w-px bg-gradient-to-b from-transparent to-white/10 mb-2" />
                                <span className="text-[10px] font-mono text-white/20">
                                    {entry.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <NoteCard
                                id={entry.id}
                                data={entry.structured}
                                onDelete={handleDelete}
                                onUpdate={handleUpdate}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredFeed.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-white/20 text-sm font-mono mt-12"
                    >
                        No entries found.
                    </motion.div>
                )}
            </div>
        </section>
    );
}
