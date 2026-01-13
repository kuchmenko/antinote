"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface CircleWaveProps {
    amplitude: number;
    isActive: boolean;
    className?: string;
    centerIcon?: React.ReactNode;
}

const CIRCLE_COUNT = 4;
const BASE_RADIUS = 20;
const RADIUS_INCREMENT = 12;
const ANIMATION_DELAY = 0.1;
const BASE_SCALE = 1.0;
const MAX_SCALE = 1.5;
const MIN_AMPLITUDE = 0;
const MAX_AMPLITUDE = 255;
const MIN_OPACITY = 0.3;
const MAX_OPACITY = 1.0;
const INACTIVE_OPACITY = 0.1;
const LOW_HUE = 260;
const HIGH_HUE = 190;
const SATURATION = 70;
const LIGHTNESS = 60;
const SHADOW_FACTOR = 0.5;

export default function CircleWave({ amplitude, isActive, className, centerIcon }: CircleWaveProps) {
    const circles = useMemo(() => {
        return Array.from({ length: CIRCLE_COUNT }, (_, i) => ({
            id: i,
            baseRadius: BASE_RADIUS + i * RADIUS_INCREMENT,
            delay: i * ANIMATION_DELAY,
        }));
    }, []);

    const normalizedAmplitude = Math.min(1, amplitude / MAX_AMPLITUDE);
    const currentScale = BASE_SCALE + normalizedAmplitude * (MAX_SCALE - BASE_SCALE);
    const currentHue = LOW_HUE - normalizedAmplitude * (LOW_HUE - HIGH_HUE);
    const opacity = isActive ? MIN_OPACITY + normalizedAmplitude * (MAX_OPACITY - MIN_OPACITY) : INACTIVE_OPACITY;

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {circles.map((circle) => (
                <motion.div
                    key={circle.id}
                    className="absolute rounded-full border"
                    style={{
                        width: circle.baseRadius * 2,
                        height: circle.baseRadius * 2,
                        borderColor: `hsla(${currentHue}, ${SATURATION}%, ${LIGHTNESS}%, ${opacity})`,
                        boxShadow: `0 0 ${circle.baseRadius * SHADOW_FACTOR}px hsla(${currentHue}, ${SATURATION}%, ${LIGHTNESS}%, ${opacity * 0.3})`,
                    }}
                    animate={{
                        scale: isActive ? currentScale : 1,
                        opacity: isActive ? opacity : 0,
                    }}
                    initial={{ scale: 1, opacity: 0 }}
                    exit={{ scale: 1, opacity: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                        delay: circle.delay,
                    }}
                />
            ))}

            <div className="relative z-10">
                <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md">
                    {centerIcon ?? <span className="text-white/80 text-lg">🎤</span>}
                </div>
            </div>
        </div>
    );
}
