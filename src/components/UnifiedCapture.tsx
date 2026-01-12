"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Loader2, Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Textarea from "./ui/Textarea";
import NoteCard from "./NoteCard";
import VoiceVisualizer from "./VoiceVisualizer";
import { useToast } from "./ui/Toast";
import { StructuredData } from "@/lib/services/types";

type ProcessingState = "idle" | "recording" | "transcribing" | "structuring" | "complete" | "error";

export default function UnifiedCapture() {
    const [draft, setDraft] = useState("");
    const [processingState, setProcessingState] = useState<ProcessingState>("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [result, setResult] = useState<StructuredData | null>(null);
    const { showToast } = useToast();

    // Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const captureButtonRef = useRef<HTMLButtonElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isRecording = processingState === "recording";
    const isProcessing = processingState === "transcribing" || processingState === "structuring";
    const canSubmit = draft.trim().length > 0 && !isProcessing && !isRecording;

    // Voice recording
    const startRecording = async () => {
        try {
            setProcessingState("recording");
            setResult(null);
            setErrorMessage(null);
            setDraft("");

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);

            // Audio visualization
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            source.connect(analyserRef.current);

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                chunksRef.current = [];
                handleVoiceProcessing(blob);
                stream.getTracks().forEach(track => track.stop());
                audioContextRef.current?.close();
            };

            mediaRecorderRef.current.start();
        } catch (err) {
            console.error("Mic error:", err);
            setErrorMessage("Microphone access denied.");
            setProcessingState("error");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
    };

    const handleVoiceProcessing = async (audioBlob: Blob) => {
        try {
            setProcessingState("transcribing");
            const formData = new FormData();
            formData.append("file", audioBlob, "recording.webm");

            const transcribeRes = await fetch("/api/transcribe", { method: "POST", body: formData });
            if (!transcribeRes.ok) throw new Error("Transcription failed");
            const { transcript } = await transcribeRes.json();

            setDraft(transcript);
            setProcessingState("idle");

            // Focus the Capture button after transcription
            setTimeout(() => captureButtonRef.current?.focus(), 100);
        } catch (error: any) {
            setErrorMessage(error.message || "Something went wrong");
            setProcessingState("error");
        }
    };

    const handleStructure = async (text?: string) => {
        const content = text || draft.trim();
        if (!content) {
            setErrorMessage("Add a thought first.");
            setProcessingState("error");
            return;
        }

        try {
            setProcessingState("structuring");
            setErrorMessage(null);

            const res = await fetch("/api/structure", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transcript: content }),
            });

            if (!res.ok) throw new Error("Structuring failed");
            await res.json();

            // Success: clear form and show toast
            setDraft("");
            setResult(null);
            setProcessingState("idle");
            showToast("Thought captured!", "success");
        } catch (error: any) {
            setErrorMessage(error.message || "Something went wrong");
            setProcessingState("error");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Enter key (without shift for new line) to capture
        if (e.key === "Enter" && !e.shiftKey && canSubmit) {
            e.preventDefault();
            handleStructure();
        }
    };

    // Global "/" key to focus capture field
    useEffect(() => {
        const handleGlobalKey = (e: KeyboardEvent) => {
            // Only if not in an input/textarea
            const target = e.target as HTMLElement;
            if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

            if (e.key === "/") {
                e.preventDefault();
                textareaRef.current?.focus();
            }
        };

        window.addEventListener("keydown", handleGlobalKey);
        return () => window.removeEventListener("keydown", handleGlobalKey);
    }, []);

    const reset = () => {
        setDraft("");
        setResult(null);
        setProcessingState("idle");
        setErrorMessage(null);
    };



    return (
        <div className="w-full flex flex-col items-center">
            <Card variant="elevated" className="w-full p-6 overflow-hidden">
                <AnimatePresence mode="wait">
                    {isRecording ? (
                        <motion.div
                            key="recording"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex flex-col items-center justify-center py-8"
                        >
                            <VoiceVisualizer
                                analyser={analyserRef.current}
                                isActive={isRecording}
                            />
                            <p className="text-white/50 text-sm my-6 animate-pulse">Listening...</p>
                            <Button variant="danger" size="lg" onClick={stopRecording}>
                                <Square size={18} className="mr-2" fill="currentColor" />
                                Done
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="relative">
                                <Textarea
                                    ref={textareaRef}
                                    value={draft}
                                    onChange={(e) => {
                                        setDraft(e.target.value);
                                        if (processingState === "error") setProcessingState("idle");
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Start typing or use voice..."
                                    rows={4}
                                    disabled={isProcessing}
                                    className="pr-14"
                                />
                                <div className="absolute top-3 right-3 text-[10px] text-white/20 font-mono">
                                    {draft.length}
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4 gap-4">
                                <div className="flex items-center gap-3">
                                    <Button
                                        ref={captureButtonRef}
                                        onClick={() => handleStructure()}
                                        disabled={!canSubmit}
                                        isLoading={isProcessing}
                                        size="md"
                                    >
                                        <Send size={16} className="mr-2" />
                                        {isProcessing ? "Processing..." : "Capture"}
                                    </Button>

                                    {draft && (
                                        <Button variant="ghost" size="sm" onClick={reset}>
                                            Reset
                                        </Button>
                                    )}
                                </div>

                                <button
                                    onClick={startRecording}
                                    disabled={isProcessing}
                                    className={clsx(
                                        "group relative w-12 h-12 flex items-center justify-center rounded-full transition-all",
                                        "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20",
                                        "disabled:opacity-50 disabled:cursor-not-allowed"
                                    )}
                                    data-interactive="true"
                                >
                                    <Mic size={20} className="text-white/70 group-hover:text-white transition-colors" />
                                </button>
                            </div>

                            {errorMessage && (
                                <p className="text-red-400 text-sm mt-3">{errorMessage}</p>
                            )}

                            <p className="text-[10px] text-white/20 mt-4 text-center">
                                <span className="text-white/30">Enter</span> to capture · <span className="text-white/30">/</span> to focus
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

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
