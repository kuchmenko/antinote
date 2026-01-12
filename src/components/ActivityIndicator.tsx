"use client";

import { motion } from "framer-motion";
import { useActivity } from "@/context/ActivityContext";
import { cn } from "@/lib/utils";

export default function ActivityIndicator({ className }: { className?: string }) {
    const { activity } = useActivity();

    if (activity === "idle") return null;

    const getColor = () => {
        switch (activity) {
            case "recording": return "stroke-red-500";
            case "transcribing": return "stroke-amber-500";
            case "compiling": return "stroke-purple-500";
            default: return "stroke-white/20";
        }
    };

    return (
        <div className={cn("absolute inset-0 pointer-events-none", className)}>
            <motion.svg
                className="w-full h-full -rotate-90"
                viewBox="0 0 100 100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className={getColor()}
                    initial={{ pathLength: 0 }}
                    animate={{
                        pathLength: [0.2, 0.8, 0.2],
                        rotate: [0, 360],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            </motion.svg>

            {/* Glow effect */}
            <motion.div
                className={cn(
                    "absolute inset-0 rounded-full blur-md opacity-40",
                    activity === "recording" && "bg-red-500",
                    activity === "transcribing" && "bg-amber-500",
                    activity === "compiling" && "bg-purple-500"
                )}
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            />
        </div>
    );
}
