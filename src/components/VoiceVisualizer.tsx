"use client";

import { useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface VoiceVisualizerProps {
    analyser: AnalyserNode | null;
    isActive: boolean;
}

export default function VoiceVisualizer({ analyser, isActive }: VoiceVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(0);
    const dataArrayRef = useRef<Uint8Array | null>(null);

    const draw = useCallback(() => {
        if (!canvasRef.current || !analyser || !isActive) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        if (!dataArrayRef.current) {
            dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        }

        const render = () => {
            if (!isActive) return;
            animationFrameRef.current = requestAnimationFrame(render);
            analyser.getByteFrequencyData(dataArrayRef.current as unknown as Uint8Array<ArrayBuffer>);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const barCount = 32;
            const barWidth = 3;
            const gap = 4;
            const maxHeight = canvas.height * 0.7;

            // Draw bars from center outward
            for (let i = 0; i < barCount; i++) {
                const dataIndex = Math.floor((i / barCount) * dataArrayRef.current!.length);
                const value = dataArrayRef.current![dataIndex];
                const percent = value / 255;
                const barHeight = Math.max(4, maxHeight * percent);

                // Gradient from violet to cyan
                const hue = 260 - (i / barCount) * 80;
                const saturation = 70 + percent * 30;
                const lightness = 50 + percent * 30;
                const alpha = 0.6 + percent * 0.4;

                ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;

                // Right side
                const rightX = centerX + i * (barWidth + gap);
                ctx.beginPath();
                ctx.roundRect(rightX, centerY - barHeight / 2, barWidth, barHeight, 2);
                ctx.fill();

                // Left side (mirror)
                const leftX = centerX - (i + 1) * (barWidth + gap);
                ctx.beginPath();
                ctx.roundRect(leftX, centerY - barHeight / 2, barWidth, barHeight, 2);
                ctx.fill();
            }

            // Glow effect in center
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 100);
            gradient.addColorStop(0, "rgba(139, 92, 246, 0.15)");
            gradient.addColorStop(1, "rgba(139, 92, 246, 0)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };

        render();
    }, [analyser, isActive]);

    useEffect(() => {
        if (isActive && analyser) {
            draw();
        }

        return () => {
            cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isActive, analyser, draw]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full flex items-center justify-center"
        >
            <canvas
                ref={canvasRef}
                width={500}
                height={120}
                className="w-full h-28"
            />

            {/* Ambient glow behind */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-cyan-500/10 blur-2xl -z-10" />
        </motion.div>
    );
}
