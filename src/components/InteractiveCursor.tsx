"use client";

import { useEffect, useState, useRef } from "react";
import {
    motion,
    useMotionValue,
    useSpring,
    useVelocity,
    useTransform,
    useMotionTemplate
} from "framer-motion";

interface HoverState {
    x: number;
    y: number;
    width: number;
    height: number;
    radius: string;
}

export default function InteractiveCursor() {
    const [isHovering, setIsHovering] = useState(false);
    const hoverRef = useRef<HoverState | null>(null);

    // Raw mouse position
    const mouseX = useMotionValue(-100);
    const mouseY = useMotionValue(-100);

    // Smooth physics for the cursor
    // Damping 30/Stiffness 350 gives a nice "heavy" but responsive feel
    const springConfig = { damping: 30, stiffness: 350, mass: 0.5 };
    const cursorX = useSpring(mouseX, springConfig);
    const cursorY = useSpring(mouseY, springConfig);

    // Velocity for squash and stretch
    const velocityX = useVelocity(cursorX);
    const velocityY = useVelocity(cursorY);

    // Calculate rotation based on movement direction
    const rotation = useTransform([velocityX, velocityY], ([vx, vy]: number[]) => {
        if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) return 0;
        return Math.atan2(vy, vx) * (180 / Math.PI);
    });

    // Squash and stretch based on total velocity magnitude
    const scaleX = useTransform(
        [velocityX, velocityY],
        ([vx, vy]: number[]) => {
            const speed = Math.sqrt(vx * vx + vy * vy);
            return Math.min(1 + speed * 0.0005, 1.3); // Stretch up to 1.3x
        }
    );

    const scaleY = useTransform(
        [velocityX, velocityY],
        ([vx, vy]: number[]) => {
            const speed = Math.sqrt(vx * vx + vy * vy);
            return Math.max(1 - speed * 0.0005, 0.8); // Squash down to 0.8x
        }
    );

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            const { clientX, clientY } = e;

            if (hoverRef.current) {
                // Magnetic Logic
                const { x, y, width, height } = hoverRef.current;
                const centerX = x + width / 2;
                const centerY = y + height / 2;

                // Calculate distance from center
                const dist = { x: clientX - centerX, y: clientY - centerY };

                // Apply magnetic pull (0.1 means strong pull to center, 0.3 means weaker)
                // We want the cursor to stick to the button but move slightly with the mouse
                const magneticX = centerX + dist.x * 0.2;
                const magneticY = centerY + dist.y * 0.2;

                mouseX.set(magneticX);
                mouseY.set(magneticY);
            } else {
                mouseX.set(clientX);
                mouseY.set(clientY);
            }
        };

        const handleInteraction = (target: HTMLElement) => {
            const interactive = target.closest("button, a, [role='button'], input, textarea, [data-interactive='true']");

            if (interactive) {
                const rect = interactive.getBoundingClientRect();
                const style = window.getComputedStyle(interactive);

                hoverRef.current = {
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                    radius: style.borderRadius === "0px" ? "12px" : style.borderRadius,
                };
                setIsHovering(true);
            } else {
                hoverRef.current = null;
                setIsHovering(false);
            }
        };

        const handleMouseOver = (e: MouseEvent) => handleInteraction(e.target as HTMLElement);
        const handleFocus = (e: FocusEvent) => handleInteraction(e.target as HTMLElement);
        const handleBlur = () => {
            hoverRef.current = null;
            setIsHovering(false);
        };

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
            {/* Main Cursor Dot - Morphs into the magnetic box */}
            <motion.div
                className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: "-50%",
                    translateY: "-50%",
                    rotate: isHovering ? 0 : rotation,
                    scaleX: isHovering ? 1 : scaleX,
                    scaleY: isHovering ? 1 : scaleY,
                }}
                animate={{
                    width: isHovering && hoverRef.current ? hoverRef.current.width : 12,
                    height: isHovering && hoverRef.current ? hoverRef.current.height : 12,
                    borderRadius: isHovering && hoverRef.current ? hoverRef.current.radius : "50%",
                    backgroundColor: isHovering ? "rgba(255, 255, 255, 0)" : "rgba(255, 255, 255, 1)",
                    border: isHovering ? "1px solid rgba(255, 255, 255, 0.5)" : "0px solid rgba(255, 255, 255, 0)",
                    opacity: 1,
                }}
                transition={{
                    type: "spring",
                    damping: 25,
                    stiffness: 300,
                    mass: 0.5
                }}
            />

            {/* Subtle Trail / Ghost (Only visible when moving fast and not hovering) */}
            <motion.div
                className="fixed top-0 left-0 w-3 h-3 bg-white/30 rounded-full pointer-events-none z-[9998] mix-blend-difference"
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
                animate={{
                    scale: isHovering ? 0 : 0.8,
                    opacity: isHovering ? 0 : 0.5,
                }}
                transition={{ duration: 0.1 }}
            />
        </>
    );
}
