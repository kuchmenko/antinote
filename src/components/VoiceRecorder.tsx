"use client";

import { useState, useRef } from "react";
import { Mic, Square, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import NoteCard from "./NoteCard";
import { StructuredData } from "@/lib/services/types";

export default function VoiceRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<StructuredData | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(0);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);

            // Audio Visualization Setup
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            source.connect(analyserRef.current);

            const bufferLength = analyserRef.current.frequencyBinCount;
            dataArrayRef.current = new Uint8Array(bufferLength);

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                chunksRef.current = [];
                handleUpload(blob);

                // Cleanup
                if (stream) stream.getTracks().forEach(track => track.stop());
                if (audioContextRef.current) audioContextRef.current.close();
                cancelAnimationFrame(animationFrameRef.current);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            drawVisualizer();
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsProcessing(true);
        }
    };

    const handleUpload = async (audioBlob: Blob) => {
        setIsProcessing(true);
        setResult(null);
        try {
            const formData = new FormData();
            formData.append("file", audioBlob, "recording.webm");

            const response = await fetch("/api/ingest", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Upload failed");
            }

            const data = await response.json();
            console.log("Processing complete:", data);
            setResult(data.structured);
        } catch (error) {
            console.error("Error uploading:", error);
            alert("Failed to process voice note.");
        } finally {
            setIsProcessing(false);
        }
    };

    const drawVisualizer = () => {
        if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        const draw = () => {
            if (!isRecording) return;

            animationFrameRef.current = requestAnimationFrame(draw);
            analyserRef.current!.getByteFrequencyData(dataArrayRef.current as any);

            ctx.clearRect(0, 0, width, height);

            // Draw visualizer bars (Mirrored)
            const barWidth = (width / dataArrayRef.current!.length) * 2.5; // Wider bars
            const centerY = height / 2;

            for (let i = 0; i < dataArrayRef.current!.length; i++) {
                const value = dataArrayRef.current![i];
                const percent = value / 255;
                const barHeight = (height * 0.6) * percent; // Slightly shorter max height

                // Premium Gradient Color
                // Dynamic HSL based on frequency index for a subtle rainbow/aurora effect
                const hue = 200 + (i / dataArrayRef.current!.length) * 60; // Blue to Purple
                const lightness = 60 + (percent * 40);

                ctx.fillStyle = `hsla(${hue}, 80%, ${lightness}%, ${percent + 0.2})`;

                // Draw centered bar with rounded caps
                const x = width / 2 + (i * barWidth) - (dataArrayRef.current!.length * barWidth / 2);

                // Right side
                ctx.beginPath();
                ctx.roundRect(width / 2 + (i * 3), centerY - barHeight / 2, 2, barHeight, 4);
                ctx.fill();

                // Left side (Mirror)
                ctx.beginPath();
                ctx.roundRect(width / 2 - (i * 3), centerY - barHeight / 2, 2, barHeight, 4);
                ctx.fill();
            }
        };

        draw();
    };

    return (
        <div className="flex flex-col items-center justify-center w-full relative">
            {/* Visualizer Container */}
            <div className="relative w-full h-[240px] flex items-center justify-center mb-12">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent pointer-events-none" />

                <canvas
                    ref={canvasRef}
                    width={800}
                    height={240}
                    className={clsx(
                        "w-full h-full transition-all duration-500",
                        isRecording ? "opacity-100 scale-100 blur-0" : "opacity-30 scale-95 blur-sm"
                    )}
                />

                {!isRecording && !isProcessing && !result && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <Sparkles className="w-6 h-6 text-white/20 mb-4 animate-pulse" />
                        <p className="text-white/40 text-sm font-light tracking-[0.2em] uppercase">
                            Tap below to capture
                        </p>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="relative z-20">
                <AnimatePresence mode="wait">
                    {isProcessing ? (
                        <motion.div
                            key="processing"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 rounded-full bg-white/20 blur-xl animate-pulse" />
                                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
                                    <Loader2 className="animate-spin text-white" size={32} />
                                </div>
                            </div>
                            <span className="text-white/60 text-sm font-medium tracking-wide animate-pulse">Structuring Thoughts...</span>
                        </motion.div>
                    ) : isRecording ? (
                        <motion.button
                            key="stop"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={stopRecording}
                            className="group relative w-24 h-24 flex items-center justify-center"
                        >
                            <div className="absolute inset-0 rounded-full bg-red-500/20 blur-2xl group-hover:bg-red-500/30 transition-all duration-500" />
                            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.4)] border border-red-400/50">
                                <Square size={28} fill="currentColor" className="text-white" />
                            </div>
                        </motion.button>
                    ) : (
                        <motion.button
                            key="record"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startRecording}
                            className="group relative w-24 h-24 flex items-center justify-center"
                        >
                            <div className="absolute inset-0 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-all duration-500" />
                            <div className="relative w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.2)] border border-white group-hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] transition-all duration-300">
                                <Mic size={32} className="text-black" />
                            </div>
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Result Card */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                        transition={{ type: "spring", damping: 20, stiffness: 100 }}
                        className="w-full flex justify-center mt-16"
                    >
                        <NoteCard data={result} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
