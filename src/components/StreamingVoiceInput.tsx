"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { Mic, Square, Sparkles } from "lucide-react";
import CircleWave from "./CircleWave";
import { useRealtimeTranscriptionProxy } from "@/hooks/useRealtimeTranscriptionProxy";

interface StreamingVoiceInputProps {
    onTranscriptReady: (text: string) => void;
    wsUrl: string;
    disabled?: boolean;
}

export default function StreamingVoiceInput({
    onTranscriptReady,
    wsUrl,
    disabled = false,
}: StreamingVoiceInputProps) {
    const [currentTranscript, setCurrentTranscript] = useState("");
    const [isReady, setIsReady] = useState(false);

    const {
        isRecording,
        isTranscribing,
        isConnected,
        startRecording,
        stopRecording,
        getCurrentAmplitude,
    } = useRealtimeTranscriptionProxy({
        wsUrl: wsUrl,
        onTranscript: (text: string, isFinal: boolean) => {
            setCurrentTranscript(text);
            if (isFinal && text.trim().length > 0) {
                onTranscriptReady(text);
            }
        },
        onError: (error: Error) => {
            console.error("Transcription error:", error);
        },
    });

    const amplitude = getCurrentAmplitude();

    const handleStart = () => {
        if (!wsUrl) {
            console.error("WebSocket URL not provided");
            return;
        }
        setIsReady(false);
        startRecording();
        setCurrentTranscript("");
    };

    const handleStop = () => {
        stopRecording();
    };

    useEffect(() => {
        if (!isRecording && !isTranscribing && currentTranscript.trim().length > 0) {
            const timer = setTimeout(() => {
                setIsReady(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isRecording, isTranscribing, currentTranscript]);

    return (
        <div className="flex flex-col items-center w-full gap-6">
            <AnimatePresence mode="wait">
                {isRecording ? (
                    <motion.div
                        key="recording"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex flex-col items-center gap-6 w-full"
                    >
                        <CircleWave
                            amplitude={amplitude}
                            isActive={isConnected}
                            className="mb-4"
                        />

                        <div className="flex flex-col items-center gap-3 w-full max-w-md">
                            <p className="text-white/50 text-sm animate-pulse">
                                {isConnected ? "Listening..." : "Connecting..."}
                            </p>

                            {currentTranscript && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full px-6 py-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md"
                                >
                                    <p className="text-white/90 text-lg leading-relaxed">
                                        {currentTranscript}
                                    </p>
                                    {isConnected && isTranscribing && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-purple-400">
                                            <Sparkles size={12} className="animate-pulse" />
                                            <span>Processing live...</span>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            <motion.button
                                onClick={handleStop}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                whileTap={{ scale: 0.95 }}
                                className="group relative w-20 h-20 flex items-center justify-center"
                            >
                                <div className="absolute inset-0 rounded-full bg-red-500/20 blur-2xl group-hover:bg-red-500/30 transition-all duration-500" />
                                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.4)] border border-red-400/50">
                                    <Square size={28} fill="currentColor" className="text-white" />
                                </div>
                            </motion.button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        key="start"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStart}
                        disabled={disabled || !wsUrl}
                        className="group relative w-24 h-24 flex items-center justify-center"
                    >
                        <div className="absolute inset-0 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-all duration-500" />
                        <div className={clsx(
                            "relative w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.2)] border border-white transition-all duration-300",
                            "group-hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]"
                        )}>
                            <Mic size={32} className="text-black" />
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>

            {isReady && !isRecording && currentTranscript.trim().length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-emerald-400 text-sm"
                >
                    <Sparkles size={14} />
                    <span>Transcript ready</span>
                </motion.div>
            )}
        </div>
    );
}
