"use client";

import { useState, useEffect } from "react";
import UnifiedCapture from "@/components/UnifiedCapture";
import DailyFeed from "@/components/DailyFeed";
import { OpenLoopsSection } from "@/components/OpenLoopsSection";
import Navbar from "@/components/Navbar";
import AppBackground from "@/components/AppBackground";
import { useEntries } from "@/context/EntriesContext";
import type { StructuredData } from "@/lib/services/types";
import { useQueryClient } from "@tanstack/react-query";
import SystemHeader from "@/components/SystemHeader";
import { useLoopsByStatus } from "@/hooks/useLoops";

interface DashboardProps {
    user: { firstName: string | null; imageUrl?: string } | null;
    userEntries: { id: string; createdAt: Date; structured: StructuredData }[];
}

export default function Dashboard({ user, userEntries }: DashboardProps) {
    const { entries, removeEntry, updateEntry, addEntry, setEntries } = useEntries();
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    // Initialize entries from server
    useEffect(() => {
        if (userEntries && userEntries.length > 0) {
            setEntries(userEntries);
        }
    }, [userEntries, setEntries]);

    // Global Navigation Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

            if (isInput) return;

            if (e.key === "j") {
                e.preventDefault();
                setFocusedIndex(prev => {
                    if (prev === null) return 0; // Start at first entry
                    if (prev === -1) return 0; // From capture to first entry
                    return Math.min(prev + 1, entries.length - 1);
                });
            } else if (e.key === "k") {
                e.preventDefault();
                setFocusedIndex(prev => {
                    if (prev === null) return -1; // Start at capture
                    if (prev === 0) return -1; // From first entry to capture
                    if (prev === -1) return -1; // Stay at capture
                    return Math.max(prev - 1, -1);
                });
            } else if (e.key === "i") {
                e.preventDefault();
                setFocusedIndex(-1);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [entries.length]);

    const queryClient = useQueryClient();

    const handleEntryCreated = (newEntry: { id: string; createdAt: Date; structured: StructuredData }) => {
        addEntry(newEntry);
        // Refresh loops immediately
        queryClient.invalidateQueries({ queryKey: ["loops"] });
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/delete?id=${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete entry");
            }

            removeEntry(id);
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

            updateEntry(id, updatedData);
        } catch (error) {
            console.error("Error updating entry:", error);
            alert("Failed to update entry. Please try again.");
        }
    };

    const { open, snoozed } = useLoopsByStatus();
    const totalLoops = (open?.length || 0) + (snoozed?.length || 0);

    return (
        <main className="relative min-h-screen w-full overflow-hidden flex flex-col items-center bg-black">
            <AppBackground subtle />
            <Navbar />

            <div className="relative z-10 flex flex-col items-center w-full max-w-2xl px-6 pt-32 pb-20">
                {/* System Header */}
                <SystemHeader loopCount={totalLoops} />

                {/* Capture Area (The Anchor) */}
                <div className="w-full mb-12">
                    <UnifiedCapture
                        onEntryCreated={handleEntryCreated}
                        onEntryRemoved={removeEntry}
                        isFocused={focusedIndex === -1}
                        onEscape={() => setFocusedIndex(null)}
                        onFocus={() => setFocusedIndex(-1)}
                    />
                </div>

                {/* Active Memory (Compact Loops) */}
                <OpenLoopsSection compact />

                {/* The Log (Feed) */}
                <div className="w-full opacity-60 hover:opacity-100 transition-opacity duration-500">
                    <DailyFeed
                        entries={entries}
                        onDelete={handleDelete}
                        onUpdate={handleUpdate}
                        focusedIndex={focusedIndex}
                        setFocusedIndex={setFocusedIndex}
                    />
                </div>
            </div>
        </main>
    );
}
