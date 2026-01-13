"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Card from "./ui/Card";
import NoteCard from "./NoteCard";
import { useToast } from "./ui/Toast";
import { StructuredData } from "@/lib/services/types";
import SmartInput from "./SmartInput";
import { useActivity } from "@/context/ActivityContext";

type ProcessingState = "idle" | "recording" | "transcribing" | "structuring" | "complete" | "error";

interface UnifiedCaptureProps {
    onEntryCreated?: (entry: { id: string; createdAt: Date; structured: StructuredData; pending?: boolean }) => void;
    onEntryUpdated?: (id: string, entry: { structured: StructuredData; pending?: boolean }) => void;
    onEntryRemoved?: (id: string) => void;
    isFocused?: boolean;
    onEscape?: () => void;
    onFocus?: () => void;
}

export default function UnifiedCapture({ onEntryCreated, onEntryUpdated, onEntryRemoved, isFocused, onEscape, onFocus }: UnifiedCaptureProps) {
    const [draft, setDraft] = useState("");
    const [processingState, setProcessingState] = useState<ProcessingState>("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [result, setResult] = useState<StructuredData | null>(null);
    const { showToast } = useToast();

    const { setActivity } = useActivity();

    // Refs
    const captureButtonRef = useRef<HTMLButtonElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isProcessing = processingState === "transcribing" || processingState === "structuring";

    const handleStructure = async () => {
        const content = draft.trim();
        if (!content) {
            setErrorMessage("Add a thought first.");
            return;
        }

        // Generate a temporary ID for the pending entry
        const tempId = `pending-${Date.now()}`;
        const pendingEntry = {
            id: tempId,
            createdAt: new Date(),
            structured: {
                schemaVersion: 1 as const,
                type: "unknown" as const,
                content: content,
                tags: [],
            },
            pending: true,
        };

        // Optimistic UI: Add pending entry immediately
        if (onEntryCreated) {
            onEntryCreated(pendingEntry);
        }

        // Clear input and set state
        setDraft("");
        setErrorMessage(null);
        setProcessingState("structuring");
        setActivity("transcribing");

        // Unfocus IMMEDIATELY so user can see the pending entry
        if (onEscape) {
            onEscape();
        }

        try {
            const res = await fetch("/api/structure", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transcript: content }),
            });

            if (!res.ok) throw new Error("Structuring failed");
            const data = await res.json();

            // Update the pending entry with real data
            if (onEntryRemoved) {
                onEntryRemoved(tempId); // Remove the temp entry
            }
            if (onEntryCreated && data.id) {
                onEntryCreated({
                    id: data.id,
                    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
                    structured: data.structured,
                    pending: false,
                });
            }



            // Then do the rest of cleanup
            setResult(null);
            setProcessingState("idle");
            setActivity("idle");
            showToast("Captured", "success");
        } catch (error: any) {
            // Remove pending entry on error and restore draft
            if (onEntryRemoved) {
                onEntryRemoved(tempId);
            }
            setDraft(content);
            setErrorMessage(error.message || "Something went wrong");
            setProcessingState("error");
            setActivity("idle");
        }
    };



    const reset = () => {
        setDraft("");
        setResult(null);
        setProcessingState("idle");
        setActivity("idle");
        setErrorMessage(null);
    };

    return (
        <div className="w-full mx-auto relative z-50">
            {/* Focus Overlay */}
            <AnimatePresence>
                {isFocused && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[-1]"
                        onClick={onEscape}
                    />
                )}
            </AnimatePresence>

            <div className={`relative transition-all duration-500 ${isFocused ? 'scale-105' : ''}`}>
                <SmartInput
                    value={draft}
                    onChange={setDraft}
                    onSubmit={handleStructure}
                    isProcessing={false} // NEVER block the input
                    onReset={reset}
                    shouldFocus={isFocused}
                    onEscape={onEscape}
                    onFocus={onFocus}
                    minimal
                />

                {/* System Status Line */}
                <div className="absolute -bottom-6 left-0 w-full flex justify-center">
                    <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                        {isProcessing ? "Processing..." : isFocused ? "Ready to Capture" : "System Idle"}
                    </span>
                </div>
            </div>

            {/* Result */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                        transition={{ type: "spring", damping: 20, stiffness: 100 }}
                        className="w-full flex flex-col items-center mt-12"
                    >
                        <div className="flex items-center gap-2 mb-4 text-emerald-400 text-sm">
                            <Sparkles size={14} />
                            <span>Structured successfully</span>
                        </div>
                        <NoteCard id="preview" data={result} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
