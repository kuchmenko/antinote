"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";

interface HoverState {
    x: number;
    y: number;
    width: number;
    height: number;
    radius: string;
}

export default function InteractiveCursor() {
    const [hoverState, setHoverState] = useState<HoverState | null>(null);

    // Mouse position for the dot
    const mouseX = useMotionValue(-100);
    const mouseY = useMotionValue(-100);

    // Smooth springs for the dot
    const springConfig = { damping: 25, stiffness: 700 };
    const dotX = useSpring(mouseX, springConfig);
    const dotY = useSpring(mouseY, springConfig);

    // Smooth springs for the ring (when not hovering)
    const trailConfig = { damping: 30, stiffness: 200, mass: 0.8 };
    const trailX = useSpring(mouseX, trailConfig);
    const trailY = useSpring(mouseY, trailConfig);

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        const handleInteraction = (target: HTMLElement) => {
            const interactive = target.closest("button, a, [role='button'], input, textarea");

            if (interactive) {
                const rect = interactive.getBoundingClientRect();
                const style = window.getComputedStyle(interactive);

                setHoverState({
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                    radius: style.borderRadius === "0px" ? "12px" : style.borderRadius,
                });
            } else {
                setHoverState(null);
            }
        };

        const handleMouseOver = (e: MouseEvent) => handleInteraction(e.target as HTMLElement);
        const handleFocus = (e: FocusEvent) => handleInteraction(e.target as HTMLElement);
        const handleBlur = () => setHoverState(null);

        window.addEventListener("mousemove", moveCursor);
        window.addEventListener("mouseover", handleMouseOver, { passive: true });
        window.addEventListener("focusin", handleFocus, { passive: true });
        window.addEventListener("focusout", handleBlur, { passive: true });

        return () => {
            window.removeEventListener("mousemove", moveCursor);
            window.removeEventListener("mouseover", handleMouseOver);
            window.removeEventListener("focusin", handleFocus);
            window.removeEventListener("focusout", handleBlur);
        };
    }, [mouseX, mouseY]);

    return (
        <>
            {/* Main Cursor Dot - Hides when hovering */}
            <motion.div
                className="fixed top-0 left-0 w-3 h-3 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference"
                style={{
                    x: dotX,
                    y: dotY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
                animate={{
                    scale: hoverState ? 0 : 1,
                    opacity: hoverState ? 0 : 1,
                }}
            />

            {/* Trailing Ring / Wrap-around Box */}
            <motion.div
                className="fixed top-0 left-0 border border-white/40 pointer-events-none z-[9998] mix-blend-difference"
                style={{
                    x: hoverState ? hoverState.x : trailX,
                    y: hoverState ? hoverState.y : trailY,
                }}
                animate={{
                    width: hoverState ? hoverState.width : 40,
                    height: hoverState ? hoverState.height : 40,
                    borderRadius: hoverState ? hoverState.radius : "50%",
                    translateX: hoverState ? 0 : "-50%",
                    translateY: hoverState ? 0 : "-50%",
                    borderColor: hoverState ? "rgba(255, 255, 255, 0.6)" : "rgba(255, 255, 255, 0.3)",
                }}
                transition={{
                    type: "spring",
                    damping: 25,
                    stiffness: 300,
                    mass: 0.5,
                }}
            />
        </>
    );
}
