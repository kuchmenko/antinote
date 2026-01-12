"use client";

import { useState, useEffect, useRef } from "react";
import UnifiedCapture from "@/components/UnifiedCapture";
import DailyFeed from "@/components/DailyFeed";
import Link from "next/link";
import { StructuredData } from "@/lib/services/types";
import { useEntries } from "@/context/EntriesContext";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import AppBackground from "@/components/AppBackground";

interface DashboardProps {
    user: { firstName: string | null; imageUrl?: string } | null;
    userEntries: { id: string; createdAt: Date; structured: StructuredData }[];
}

export default function Dashboard({ user, userEntries }: DashboardProps) {
    const { entries, setEntries, removeEntry, updateEntry, addEntry } = useEntries();
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const captureRef = useRef<HTMLDivElement>(null);

    // Initialize context with server data
    useEffect(() => {
        setEntries(userEntries);
    }, [userEntries, setEntries]);

    // Scroll capture into view when focused
    useEffect(() => {
        if (focusedIndex === -1 && captureRef.current) {
            captureRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }, [focusedIndex]);

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
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [entries.length]);

    const handleEntryCreated = (newEntry: { id: string; createdAt: Date; structured: StructuredData }) => {
        addEntry(newEntry);
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

    const hour = new Date().getHours();
    let timeGreeting = "Good evening";
    if (hour < 5) timeGreeting = "Late night";
    else if (hour < 12) timeGreeting = "Good morning";
    else if (hour < 18) timeGreeting = "Good afternoon";

    const firstName = user?.firstName;
    const greeting = firstName ? `${timeGreeting}, ${firstName}` : timeGreeting;

    return (
        <main className="relative min-h-screen w-full overflow-hidden flex flex-col items-center bg-black">
            <AppBackground subtle />
            <Navbar />

            <div className="relative z-10 flex flex-col items-center w-full max-w-2xl px-6 pt-32 pb-20">
                <PageHeader
                    title={`${greeting}.`}
                    description="Capture your thoughts."
                />

                {/* Capture Area */}
                <div className="w-full mb-8">
                    <UnifiedCapture
                        onEntryCreated={handleEntryCreated}
                        isFocused={focusedIndex === -1}
                        onEscape={() => setFocusedIndex(null)}
                        onFocus={() => setFocusedIndex(-1)}
                    />
                </div>

                <div className="w-full h-px bg-white/10 mb-4" />

                {/* Feed Section */}
                <div className="w-full">
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
