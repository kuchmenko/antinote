"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import NoteCard from "./NoteCard";
import { StructuredData } from "@/lib/services/types";
import ImproveModal from "./ImproveModal";
import DeletionPrompt from "./DeletionPrompt";
import clsx from "clsx";

interface DailyFeedProps {
    entries: { id: string; createdAt: Date; structured: StructuredData; pending?: boolean }[];
    onDelete: (id: string) => void;
    onUpdate: (id: string, updatedData: Partial<StructuredData>) => void;
    focusedIndex: number | null;
    setFocusedIndex: (index: number | null) => void;
}

export default function DailyFeed({ entries, onDelete, onUpdate, focusedIndex, setFocusedIndex }: DailyFeedProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [improvingId, setImprovingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const entryRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Scroll selected entry into view
    useEffect(() => {
        if (focusedIndex !== null && focusedIndex >= 0 && entries.length > 0 && entryRefs.current[focusedIndex]) {
            entryRefs.current[focusedIndex]?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }, [focusedIndex, entries.length]);

    // Keyboard shortcuts for actions
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
            // Allow Escape to pass through even if editing/improving or input focused
            if (e.key === "Escape") {
                if (editingId) {
                    e.preventDefault();
                    setEditingId(null);
                }
                // We don't return here because we might want other things to happen? 
                // No, if we handled it, we should probably return or let it bubble?
                // But the switch below handles it too. 
                // Actually, if I handle it here, I don't need it in the switch.
                // But let's just allow it to reach the switch.
            }

            if ((isInput || editingId || improvingId || deletingId) && e.key !== "Escape") return; // Don't trigger shortcuts if input focused or modal open (except Escape)

            if (entries.length === 0 || focusedIndex === null || focusedIndex < 0) return;

            switch (e.key) {
                case "H": // Home (Top)
                    if (e.shiftKey) {
                        e.preventDefault();
                        setFocusedIndex(0);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                    break;
                case "d": // Delete with prompt
                    if (!e.shiftKey) {
                        e.preventDefault();
                        const id = entries[focusedIndex].id;
                        setDeletingId(id);
                    }
                    break;
                case "D": // Delete without prompt
                    if (e.shiftKey) {
                        e.preventDefault();
                        const id = entries[focusedIndex].id;
                        onDelete(id);
                    }
                    break;
                case "e": // Edit
                    e.preventDefault();
                    setEditingId(entries[focusedIndex].id);
                    break;
                case "i": // Improve
                    e.preventDefault();
                    setImprovingId(entries[focusedIndex].id);
                    break;
                case "Escape":
                    if (editingId) {
                        e.preventDefault();
                        setEditingId(null);
                    }
                    if (deletingId) {
                        e.preventDefault();
                        setDeletingId(null);
                    }
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [entries, focusedIndex, onDelete, editingId, improvingId, setFocusedIndex]);

    const handleEditSave = (content: string) => {
        if (editingId) {
            onUpdate(editingId, { content });
            setEditingId(null);
        }
    };

    const handleImprove = async (instruction: string): Promise<StructuredData> => {
        if (!improvingId) throw new Error("No entry selected for improvement");

        const response = await fetch("/api/improve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                entryId: improvingId,
                instruction,
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to improve entry");
        }

        const improved = await response.json();
        onUpdate(improvingId, improved.structuredData);
        return improved.structuredData;
    };

    // Removed: const editingEntry = entries.find(e => e.id === editingId);
    const improvingEntry = entries.find(e => e.id === improvingId);

    return (
        <section className="w-full max-w-2xl px-6 pb-32">
            <div className="flex flex-col gap-6">
                <AnimatePresence mode="popLayout">
                    {entries.map((entry, index) => {
                        const isEditing = editingId === entry.id;
                        const isBlurred = editingId !== null && !isEditing;

                        return (
                            <motion.div
                                key={entry.id}
                                layout
                                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                                animate={{
                                    opacity: isBlurred ? 0.3 : 1,
                                    y: 0,
                                    scale: 1,
                                }}
                                exit={{
                                    scale: [1, 0.95, 0.9, 0],
                                    y: [0, -20, -100, -200],
                                    opacity: [1, 0.8, 0, 0],
                                    filter: ["blur(0px)", "blur(0px)", "blur(10px)", "blur(20px) brightness(2)"],
                                    rotateX: [0, 10, 45, 90],
                                    transition: {
                                        duration: 1.2,
                                        times: [0, 0.3, 0.8, 1],
                                        ease: "easeInOut"
                                    }
                                }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="w-full flex flex-col items-center transition-all duration-500"
                                ref={el => { entryRefs.current[index] = el; }}
                                onClick={() => !editingId && setFocusedIndex(index)}
                            >
                                <div className={clsx(
                                    "flex flex-col items-center mb-4 transition-opacity duration-300",
                                    isEditing ? "opacity-0" : "opacity-100"
                                )}>
                                    <div className="h-8 w-px bg-gradient-to-b from-transparent to-white/10 mb-2" />
                                    <span className="text-[10px] font-mono text-white/20">
                                        {entry.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <NoteCard
                                    id={entry.id}
                                    data={entry.structured}
                                    onDelete={() => setDeletingId(entry.id)}
                                    onUpdate={onUpdate}
                                    isSelected={index === focusedIndex && !editingId}
                                    isEditing={isEditing}
                                    onEditStart={(id) => setEditingId(id)}
                                    onEditSubmit={handleEditSave}
                                    onEditCancel={() => setEditingId(null)}
                                    onImproveStart={(id) => setImprovingId(id)}
                                    pending={entry.pending}
                                    compact={index > 0}
                                />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {entries.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-white/20 text-sm font-mono mt-12 text-center"
                    >
                        Nothing yet. Start capturing!
                    </motion.div>
                )}
            </div>

            {/* Popover / Modals */}
            {/* Removed: EditPopover component */}
            {/* {editingEntry && (
                <EditPopover
                    isOpen={!!editingEntry}
                    onClose={() => { setEditingId(null); setAnchorRect(null); }}
                    onSave={handleEditSave}
                    currentData={editingEntry.structured}
                    anchorRect={anchorRect}
                />
            )} */}

            {improvingEntry && (
                <ImproveModal
                    isOpen={!!improvingEntry}
                    onClose={() => setImprovingId(null)}
                    onImprove={handleImprove}
                    currentData={improvingEntry.structured}
                />
            )}

            <DeletionPrompt
                isOpen={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={() => {
                    if (deletingId) {
                        onDelete(deletingId);
                        setDeletingId(null);
                    }
                }}
            />
        </section>
    );
}
