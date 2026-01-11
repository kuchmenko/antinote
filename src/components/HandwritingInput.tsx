"use client";

import { useState } from "react";
import { Loader2, PenLine } from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import NoteCard from "./NoteCard";
import { StructuredData } from "@/lib/services/types";

export default function HandwritingInput() {
    const [draft, setDraft] = useState("");
    const [processingState, setProcessingState] = useState<"idle" | "structuring" | "complete" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [result, setResult] = useState<StructuredData | null>(null);

    const handleSubmit = async () => {
        if (!draft.trim()) {
            setErrorMessage("Add a thought before structuring.");
            setProcessingState("error");
            return;
        }

        try {
            setProcessingState("structuring");
            setErrorMessage(null);
            setResult(null);

            const structureRes = await fetch("/api/structure", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transcript: draft.trim() }),
            });

            if (!structureRes.ok) throw new Error("Structuring failed");
            const { structured } = await structureRes.json();

            setResult(structured);
            setProcessingState("complete");
        } catch (error: any) {
            console.error("Processing error:", error);
            setErrorMessage(error.message || "Something went wrong");
            setProcessingState("error");
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="flex flex-col items-center w-full">
            <div className="w-full rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-8 shadow-[0_40px_80px_rgba(15,23,42,0.35)]">
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                            <PenLine className="w-5 h-5 text-white/70" />
                        </div>
                        <div>
                            <p className="text-white font-medium">Handwritten Flow</p>
                            <p className="text-sm text-white/50">Ergonomic, quiet capture for focused thinking.</p>
                        </div>
                    </div>
                    <div className="text-xs text-white/40">⌘/Ctrl + Enter to structure</div>
                </div>

                <div className="relative">
                    <textarea
                        value={draft}
                        onChange={(event) => {
                            setDraft(event.target.value);
                            if (processingState === "error") {
                                setProcessingState("idle");
                                setErrorMessage(null);
                            }
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Write as if it were paper — short sparks or long streams. We will organize it for you."
                        className={clsx(
                            "w-full min-h-[220px] rounded-2xl border border-white/10 bg-black/40 text-white/80 p-6 text-base leading-relaxed",
                            "placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300 ease-out"
                        )}
                    />
                    <div className="absolute bottom-4 right-5 text-xs text-white/30">
                        {draft.trim().length} chars
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                    <button
                        onClick={handleSubmit}
                        disabled={processingState === "structuring"}
                        className={clsx(
                            "px-6 py-3 rounded-full text-sm font-medium transition-all border",
                            processingState === "structuring"
                                ? "bg-white/10 border-white/10 text-white/50 cursor-wait"
                                : "bg-white text-black border-white hover:scale-105"
                        )}
                    >
                        {processingState === "structuring" ? "Structuring..." : "Structure Note"}
                    </button>
                    <button
                        onClick={() => {
                            setDraft("");
                            setResult(null);
                            setProcessingState("idle");
                            setErrorMessage(null);
                        }}
                        className="px-4 py-3 rounded-full text-sm text-white/60 border border-white/10 hover:border-white/30 hover:text-white transition"
                    >
                        Clear
                    </button>

                    {processingState === "error" && errorMessage && (
                        <span className="text-sm text-red-400">{errorMessage}</span>
                    )}

                    {processingState === "structuring" && (
                        <div className="flex items-center gap-2 text-sm text-white/50">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Shaping your thought...
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                        transition={{ type: "spring", damping: 20, stiffness: 100 }}
                        className="w-full flex justify-center mt-16"
                    >
                        <NoteCard id="preview" data={result} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
