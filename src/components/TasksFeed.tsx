"use client";

import { useState, useEffect } from "react";
import DailyFeed from "./DailyFeed";
import { StructuredData } from "@/lib/services/types";

interface TasksFeedProps {
    entries: { id: string; createdAt: Date; structured: StructuredData }[];
}

export default function TasksFeed({ entries: initialEntries }: TasksFeedProps) {
    const [entries, setEntries] = useState(initialEntries);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    // Basic navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
            if (isInput) return;

            if (e.key === "j") {
                setFocusedIndex(prev => {
                    if (prev === null) return 0;
                    return Math.min(prev + 1, entries.length - 1);
                });
            } else if (e.key === "k") {
                setFocusedIndex(prev => {
                    if (prev === null) return 0;
                    return Math.max(prev - 1, 0);
                });
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [entries.length]);

    const handleDelete = async (id: string) => {
        setEntries(prev => prev.filter(e => e.id !== id));
        await fetch(`/api/delete?id=${id}`, { method: "DELETE" });
    };

    const handleUpdate = async (id: string, data: Partial<StructuredData>) => {
        setEntries(prev => prev.map(e => e.id === id ? { ...e, structured: { ...e.structured, ...data } } : e));
        await fetch("/api/update", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ entryId: id, updatedData: data }),
        });
    };

    return (
        <DailyFeed
            entries={entries}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            focusedIndex={focusedIndex}
            setFocusedIndex={setFocusedIndex}
        />
    );
}
