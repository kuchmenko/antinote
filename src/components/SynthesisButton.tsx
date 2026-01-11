"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function SynthesisButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);

    const handleSynthesize = async () => {
        setIsOpen(true);
        if (summary) return; // Already synthesized

        setIsLoading(true);
        try {
            const res = await fetch("/api/synthesize", { method: "POST" });
            const data = await res.json();
            setSummary(data.summary);
        } catch (error) {
            console.error("Synthesis failed:", error);
            setSummary("Failed to generate synthesis. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <motion.button
                onClick={handleSynthesize}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-8 right-8 z-40 flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-medium shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] transition-shadow"
                data-interactive="true"
            >
                <Sparkles size={18} className="text-purple-600" />
                <span>Synthesize Day</span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl"
                        >
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                                data-interactive="true"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                                    <Sparkles size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-white">Daily Synthesis</h2>
                            </div>

                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                    <Loader2 size={32} className="text-purple-500 animate-spin" />
                                    <p className="text-white/40 text-sm animate-pulse">Analyzing neural patterns...</p>
                                </div>
                            ) : (
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown>{summary || ""}</ReactMarkdown>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
