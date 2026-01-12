"use client";

import { useState } from "react";
import UnifiedCapture from "@/components/UnifiedCapture";
import DailyFeed from "@/components/DailyFeed";
import Link from "next/link";
import { StructuredData } from "@/lib/services/types";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import AppBackground from "@/components/AppBackground";

interface DashboardProps {
    user: { firstName: string | null; imageUrl?: string } | null;
    userEntries: { id: string; createdAt: Date; structured: StructuredData }[];
}

export default function Dashboard({ user, userEntries }: DashboardProps) {
    const [entries, setEntries] = useState(userEntries);

    const handleEntryCreated = (newEntry: { id: string; createdAt: Date; structured: StructuredData }) => {
        setEntries((prev) => [newEntry, ...prev]);
    };

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
                <div className="w-full mb-16">
                    <UnifiedCapture onEntryCreated={handleEntryCreated} />
                </div>

                <div className="w-full h-px bg-white/10 mb-8" />

                {/* Feed Section */}
                <div className="w-full">
                    <DailyFeed entries={entries} onDelete={handleDelete} onUpdate={handleUpdate} />
                </div>
            </div>
        </main>
    );
}
