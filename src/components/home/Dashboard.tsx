"use client";

import { useState, useEffect } from "react";
import UnifiedCapture from "@/components/UnifiedCapture";
import DailyFeed from "@/components/DailyFeed";
import Link from "next/link";
import { StructuredData } from "@/lib/services/types";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import AppBackground from "@/components/AppBackground";
import ReactMarkdown from "react-markdown";
import ActionMenu from "@/components/ActionMenu";
import { motion, AnimatePresence } from "framer-motion";
import DailyCompilation from "@/components/DailyCompilation";

interface DashboardProps {
    user: { firstName: string | null; imageUrl?: string } | null;
    userEntries: { id: string; createdAt: Date; structured: StructuredData }[];
    initialCompilation: any; // Type this properly if possible, but any is fine for generic object
}

export default function Dashboard({ user, userEntries, initialCompilation }: DashboardProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [compilation, setCompilation] = useState(initialCompilation);
    const [isCompiling, setIsCompiling] = useState(false);

    const hour = new Date().getHours();
    let timeGreeting = "Good evening";
    if (hour < 5) timeGreeting = "Late night";
    else if (hour < 12) timeGreeting = "Good morning";
    else if (hour < 18) timeGreeting = "Good afternoon";

    const firstName = user?.firstName;
    const greeting = firstName ? `${timeGreeting}, ${firstName}` : timeGreeting;

    const handleCompile = async () => {
        setIsCompiling(true);
        try {
            const today = new Date().toISOString().split("T")[0];
            const res = await fetch("/api/day/compile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date: today }),
            });
            const data = await res.json();
            if (data.compilation) {
                setCompilation(data.compilation);
            }
        } catch (error) {
            console.error("Compile failed", error);
        } finally {
            setIsCompiling(false);
            setIsMenuOpen(false);
        }
    };

    return (
        <main className="relative min-h-screen w-full overflow-hidden flex flex-col items-center bg-black">
            <AppBackground subtle />
            <Navbar />

            <ActionMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onCompile={handleCompile}
                isCompiling={isCompiling}
            />

            {/* Hidden trigger for menu if needed or just rely on Tab */}
            {/* We effectively need to listen to Tab to OPEN it. 
                ActionMenu handles closing on Tab, but we need to open it. 
                Since ActionMenu is rendered conditionally/always? 
                ActionMenu logic for Tab opening was: "if (e.key === 'Tab') ... if (isOpen) close".
                We need a global listener to OPEN it.
            */}
            <GlobalTabListener onTab={() => setIsMenuOpen((prev) => !prev)} />

            <div className="relative z-10 flex flex-col items-center w-full max-w-2xl px-6 pt-32 pb-20">
                <PageHeader
                    title={`${greeting}.`}
                    description="Capture your thoughts."
                />

                {/* Capture Area */}
                <div className="w-full mb-16">
                    <UnifiedCapture />
                </div>

                <div className="w-full h-px bg-white/10 mb-8" />

                {/* Summary Section */}
                <AnimatePresence>
                    {compilation && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full mb-12"
                        >
                            <div className="flex justify-between items-baseline mb-6 px-2">
                                <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">Daily Compilation</h3>
                                <span className="text-[10px] text-white/20 font-mono">
                                    {new Date(compilation.compiledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <DailyCompilation content={compilation.content} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Feed Section */}
                <div className="w-full">
                    <div className="flex justify-between items-baseline mb-6">
                        <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">Today</h3>
                        <Link
                            href="/history"
                            className="text-xs text-white/30 hover:text-white transition-colors"
                        >
                            View all →
                        </Link>
                    </div>
                    <DailyFeed entries={userEntries} />
                </div>
            </div>
        </main>
    );
}

function GlobalTabListener({ onTab }: { onTab: () => void }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handle = (e: KeyboardEvent) => {
            if (e.key === "Tab") {
                e.preventDefault();
                onTab();
            }
        };
        window.addEventListener("keydown", handle);
        return () => window.removeEventListener("keydown", handle);
    }, [onTab]);

    return null;
}
