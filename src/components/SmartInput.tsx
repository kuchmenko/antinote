"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import Button from "./ui/Button";
import Textarea from "./ui/Textarea";
import VoiceVisualizer from "./VoiceVisualizer";
import StreamingVoiceInput from "./StreamingVoiceInput";
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
    minimal?: boolean;
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
    minimal,
}: SmartInputProps) {
    const { setActivity } = useActivity();
    const [isRecording, setIsRecording] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [useStreamingVoice, setUseStreamingVoice] = useState(false);
    const [wsUrl, setWsUrl] = useState<string>("");

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lastJPressRef = useRef<number>(0);

    const canSubmit = value.trim().length > 0 && !isProcessing && !isRecording;

    const fetchWsConfig = async () => {
        try {
            const res = await fetch("/api/ws-config");
            const data = await res.json();
            setWsUrl(data.wsUrl || "");
            setUseStreamingVoice(!!data.wsUrl);
        } catch (error) {
            console.error("Failed to fetch WebSocket config:", error);
            setUseStreamingVoice(false);
        }
    };

    const enterStreamingVoice = () => {
        setUseStreamingVoice(true);
        if (!wsUrl) {
            void fetchWsConfig();
        }
    };

    const handleVoiceProcessing = async (audioBlob: Blob) => {
        try {
            setActivity("transcribing");

            const formData = new FormData();
            formData.append("file", audioBlob, "recording.webm");

            const transcribeRes = await fetch("/api/transcribe", { method: "POST", body: formData });
            if (!transcribeRes.ok) throw new Error("Transcription failed");
            const { transcript } = await transcribeRes.json();

            onChange(transcript);
            setIsRecording(false);
            setActivity("idle");

            setTimeout(() => textareaRef.current?.focus(), 100);
        } catch (error: any) {
            setErrorMessage(error.message || "Something went wrong");
            setIsRecording(false);
            setActivity("idle");
        }
    };

    const handleStreamingTranscript = (text: string) => {
        onChange(text);
        setIsRecording(false);
        setActivity("idle");

        setTimeout(() => textareaRef.current?.focus(), 100);
    };

    const startRecording = async () => {
        try {
            setIsRecording(true);
            setActivity("recording");
            setErrorMessage(null);
            onChange("");

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);

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

                if (stream) stream.getTracks().forEach(track => track.stop());
                if (audioContextRef.current) audioContextRef.current.close();
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

    useEffect(() => {
        if (autoFocus || shouldFocus) {
            const textarea = textareaRef.current;
            if (textarea && !isRecording) {
                textarea.focus();
                const len = textarea.value.length;
                textarea.setSelectionRange(len, len);
            }
        }
    }, [autoFocus, shouldFocus, isRecording]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [value]);

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

        if (e.key === "m" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
            }
            return;
        }

        if (e.key === "j" && !e.metaKey && !e.ctrlKey && !e.altKey) {
            const now = Date.now();
            if (now - lastJPressRef.current < 300) {
                e.preventDefault();
                if (value.endsWith("j")) {
                    onChange(value.slice(0, -1));
                }
                onEscape?.();
            }
            lastJPressRef.current = now;
        }
    };

    useEffect(() => {
        const handleGlobalKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

            if (e.key === "v" && e.shiftKey && !isInput && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                enterStreamingVoice();
                return;
            }

            if (e.key === "v" && !isInput && !e.metaKey && !e.ctrlKey && !useStreamingVoice) {
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
    }, [isRecording, useStreamingVoice]);

    if (minimal) {
        return (
            <div className="w-full">
                <AnimatePresence mode="wait">
                    {useStreamingVoice ? (
                        <motion.div
                            key="streaming"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full"
                        >
                            {!wsUrl && (
                                <button
                                    onClick={fetchWsConfig}
                                    className="w-full px-4 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 text-purple-300 transition-all"
                                >
                                    Enable Cloudflare Streaming
                                </button>
                            )}

                            {wsUrl && (
                                <StreamingVoiceInput
                                    onTranscriptReady={handleStreamingTranscript}
                                    wsUrl={wsUrl}
                                    disabled={isProcessing}
                                />
                            )}

                            <button
                                onClick={() => setUseStreamingVoice(false)}
                                className="mt-4 text-xs text-white/40 hover:text-white/60 transition-colors"
                            >
                                Back to standard mode
                            </button>
                        </motion.div>
                    ) : isRecording ? (
                        <motion.div
                            key="recording"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-4 py-2 px-4 bg-white/5 rounded-md border border-white/10"
                        >
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-sm font-mono text-white/60">Listening...</span>
                            <div className="flex-1 h-4">
                                <VoiceVisualizer
                                    analyser={analyserRef.current}
                                    isActive={isRecording}
                                />
                            </div>
                            <button
                                onClick={stopRecording}
                                className="text-xs text-white/40 hover:text-white uppercase font-mono"
                            >
                                [STOP]
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="relative flex items-start gap-3 p-4 bg-black border border-white/20 rounded-lg shadow-2xl group focus-within:border-white/40 transition-colors"
                        >
                            <span className="text-emerald-500 font-mono mt-1 select-none">{">"}</span>

                            <div className="flex-1">
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
                                    rows={1}
                                    disabled={isProcessing}
                                    variant="minimal"
                                    className={clsx("min-h-[24px]", textareaClassName)}
                                />
                            </div>

                            <div className="flex items-center gap-3 self-start mt-1">
                                <span className="text-[10px] font-mono text-white/20 select-none">
                                    {value.length}
                                </span>

                                <button
                                    onClick={(e) => {
                                        if (e.altKey) {
                                            enterStreamingVoice();
                                            return;
                                        }
                                        void startRecording();
                                    }}
                                    onDoubleClick={() => {
                                        enterStreamingVoice();
                                    }}
                                    disabled={isProcessing}
                                    className="text-white/20 hover:text-white/60 transition-colors"
                                    title="Voice Input (v)"
                                >
                                    <Mic size={14} />
                                </button>

                                <button
                                    onClick={onSubmit}
                                    disabled={!canSubmit}
                                    className="text-white/20 hover:text-emerald-500 disabled:opacity-10 disabled:hover:text-white/20 transition-colors"
                                    title="Capture (Enter)"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {errorMessage && (
                    <p className="text-red-400 text-xs font-mono mt-2 ml-2">{errorMessage}</p>
                )}
            </div>
        );
    }

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {useStreamingVoice ? (
                    <motion.div
                        key="streaming"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full"
                    >
                        {!wsUrl && (
                            <button
                                onClick={fetchWsConfig}
                                className="w-full px-4 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 text-purple-300 transition-all"
                            >
                                Enable Cloudflare Streaming
                            </button>
                        )}

                        {wsUrl && (
                            <StreamingVoiceInput
                                onTranscriptReady={handleStreamingTranscript}
                                wsUrl={wsUrl}
                                disabled={isProcessing}
                            />
                        )}

                        <button
                            onClick={() => setUseStreamingVoice(false)}
                            className="mt-4 text-xs text-white/40 hover:text-white/60 transition-colors"
                        >
                            Back to standard mode
                        </button>
                    </motion.div>
                ) : isRecording ? (
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
                                onClick={(e) => {
                                    if (e.altKey) {
                                        enterStreamingVoice();
                                        return;
                                    }
                                    void startRecording();
                                }}
                                onDoubleClick={() => {
                                    enterStreamingVoice();
                                }}
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
