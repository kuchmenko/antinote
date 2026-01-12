"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import Button from "./ui/Button";
import Textarea from "./ui/Textarea";
import VoiceVisualizer from "./VoiceVisualizer";
import { useActivity } from "@/context/ActivityContext";

interface SmartInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    isProcessing: boolean;
    placeholder?: string;
    buttonText?: string;
    onReset?: () => void;
    autoFocus?: boolean;
    textareaClassName?: string;
    shouldFocus?: boolean;
    onEscape?: () => void;
    onFocus?: () => void;
}

export default function SmartInput({
    value,
    onChange,
    onSubmit,
    isProcessing,
    placeholder = "Start typing or use voice...",
    buttonText = "Capture",
    onReset,
    autoFocus = false,
    textareaClassName,
    shouldFocus,
    onEscape,
    onFocus,
}: SmartInputProps) {
    const { setActivity } = useActivity();
    const [isRecording, setIsRecording] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lastJPressRef = useRef<number>(0);

    const canSubmit = value.trim().length > 0 && !isProcessing && !isRecording;

    useEffect(() => {
        if ((autoFocus || shouldFocus) && !isRecording) {
            const textarea = textareaRef.current;
            if (textarea) {
                textarea.focus();
                // Move cursor to end
                const len = textarea.value.length;
                textarea.setSelectionRange(len, len);
            }
        }
    }, [autoFocus, shouldFocus, isRecording]);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [value]);

    // Voice recording
    const startRecording = async () => {
        try {
            setIsRecording(true);
            setActivity("recording");
            setErrorMessage(null);
            onChange(""); // Clear draft on new recording

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
            setIsRecording(false);
            setActivity("idle");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
    };

    const handleVoiceProcessing = async (audioBlob: Blob) => {
        try {
            setActivity("transcribing");
            // We need to notify parent about processing state if possible, 
            // but here we just handle the transcription locally for the input value
            const formData = new FormData();
            formData.append("file", audioBlob, "recording.webm");

            const transcribeRes = await fetch("/api/transcribe", { method: "POST", body: formData });
            if (!transcribeRes.ok) throw new Error("Transcription failed");
            const { transcript } = await transcribeRes.json();

            onChange(transcript);
            setIsRecording(false);
            setActivity("idle");

            // Focus textarea after transcription
            setTimeout(() => textareaRef.current?.focus(), 100);
        } catch (error: any) {
            setErrorMessage(error.message || "Something went wrong");
            setIsRecording(false);
            setActivity("idle");
        }
    };



    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey && canSubmit) {
            e.preventDefault();
            onSubmit();
        }

        if (e.key === "Escape") {
            e.preventDefault();
            textareaRef.current?.blur();
            onEscape?.();
            return;
        }

        // Ctrl+m to toggle voice while focused
        if (e.key === "m" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
            }
            return;
        }

        // "jj" to escape
        if (e.key === "j" && !e.metaKey && !e.ctrlKey && !e.altKey) {
            const now = Date.now();
            if (now - lastJPressRef.current < 300) {
                e.preventDefault();
                // Remove the previous 'j' if possible
                if (value.endsWith("j")) {
                    onChange(value.slice(0, -1));
                }
                onEscape?.();
            }
            lastJPressRef.current = now;
        }
    };

    // Global shortcuts for this component (only active when mounted)
    useEffect(() => {
        const handleGlobalKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

            // 'v' to toggle voice recording
            if (e.key === "v" && !isInput && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                if (isRecording) {
                    stopRecording();
                } else {
                    startRecording();
                }
            }
        };

        window.addEventListener("keydown", handleGlobalKey);
        return () => window.removeEventListener("keydown", handleGlobalKey);
    }, [isRecording]);

    return (
        <div className="w-full">
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
                                value={value}
                                onChange={(e) => {
                                    onChange(e.target.value);
                                    if (errorMessage) setErrorMessage(null);
                                }}
                                onKeyDown={handleKeyDown}
                                onFocus={onFocus}
                                placeholder={placeholder}
                                rows={2}
                                disabled={isProcessing}
                                className={clsx("pr-14", textareaClassName)}
                            />
                            <div className="absolute top-3 right-3 text-[10px] text-white/20 font-mono">
                                {value.length}
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 gap-4">
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={onSubmit}
                                    disabled={!canSubmit}
                                    isLoading={isProcessing}
                                    size="md"
                                >
                                    <Send size={16} className="mr-2" />
                                    {isProcessing ? "Processing..." : buttonText}
                                </Button>

                                {value && onReset && (
                                    <Button variant="ghost" size="sm" onClick={onReset}>
                                        Reset
                                    </Button>
                                )}
                            </div>

                            <button
                                onClick={startRecording}
                                disabled={isProcessing}
                                className={clsx(
                                    "group relative w-10 h-10 flex items-center justify-center rounded-full transition-all",
                                    "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20",
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                                data-interactive="true"
                                title="Voice Input (v)"
                            >
                                <Mic size={20} className="text-white/70 group-hover:text-white transition-colors" />
                            </button>
                        </div>

                        {errorMessage && (
                            <p className="text-red-400 text-sm mt-3">{errorMessage}</p>
                        )}

                        <p className="text-[10px] text-white/20 mt-2 text-center">
                            <span className="text-white/30">Enter</span> to {buttonText.toLowerCase()} · <span className="text-white/30">Ctrl+m</span> for voice
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
