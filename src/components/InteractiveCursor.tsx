"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
    motion,
    useMotionValue,
    useSpring,
    useVelocity,
    useTransform,
    useAnimationFrame
} from "framer-motion";

// Padding around element when hovering (makes ring bigger than element)
const HOVER_PADDING = 8;

interface HoverState {
    x: number;
    y: number;
    width: number;
    height: number;
    radius: string;
}

export default function InteractiveCursor() {
    const [hoverState, setHoverState] = useState<HoverState | null>(null);
    const isHoveringRef = useRef(false);
    const hoverStateRef = useRef<HoverState | null>(null);
    const activeElementRef = useRef<Element | null>(null);

    // Raw mouse position
    const mouseX = useMotionValue(-100);
    const mouseY = useMotionValue(-100);

    // Cursor size for proper centering
    const cursorWidth = useMotionValue(10);
    const cursorHeight = useMotionValue(10);

    // Smooth physics - heavy but responsive
    const springConfig = { damping: 25, stiffness: 400, mass: 0.8 };
    const cursorX = useSpring(mouseX, springConfig);
    const cursorY = useSpring(mouseY, springConfig);
    const springWidth = useSpring(cursorWidth, springConfig);
    const springHeight = useSpring(cursorHeight, springConfig);

    // Velocity for subtle effects
    const velocityX = useVelocity(cursorX);
    const velocityY = useVelocity(cursorY);

    const wobbleX = useMotionValue(0);
    const wobbleY = useMotionValue(0);
    const timeRef = useRef(0);

    useAnimationFrame((t) => {
        if (!isHoveringRef.current) {
            timeRef.current = t;
            return;
        }
        const elapsed = (t - timeRef.current) * 0.001;
        wobbleX.set(Math.sin(elapsed * 2) * 1.5);
        wobbleY.set(Math.cos(elapsed * 2.5) * 1.5);
    });

    const scale = useTransform(
        [velocityX, velocityY],
        ([vx, vy]: number[]) => {
            const speed = Math.sqrt(vx * vx + vy * vy);
            return 1 + Math.min(speed * 0.0003, 0.12);
        }
    );

    // Update geometry from active element
    const updateGeometry = useCallback(() => {
        if (!activeElementRef.current) return;
        
        const rect = activeElementRef.current.getBoundingClientRect();
        const style = window.getComputedStyle(activeElementRef.current as HTMLElement);
        
        const newHoverState: HoverState = {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            radius: style.borderRadius === "0px" ? "12px" : style.borderRadius,
        };
        
        hoverStateRef.current = newHoverState;
        setHoverState(newHoverState);
        cursorWidth.set(rect.width + HOVER_PADDING * 2);
        cursorHeight.set(rect.height + HOVER_PADDING * 2);
    }, [cursorWidth, cursorHeight]);

    // Set cursor position to element center
    const setCursorToElementCenter = useCallback(() => {
        if (!hoverStateRef.current) return;
        const hs = hoverStateRef.current;
        const centerX = hs.x + hs.width / 2;
        const centerY = hs.y + hs.height / 2;
        mouseX.set(centerX);
        mouseY.set(centerY);
    }, [mouseX, mouseY]);

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            const { clientX, clientY } = e;

            if (isHoveringRef.current && hoverStateRef.current) {
                const hs = hoverStateRef.current;
                const elementCenterX = hs.x + hs.width / 2;
                const elementCenterY = hs.y + hs.height / 2;
                
                // Light magnetic pull toward center (0.15)
                const offsetX = clientX - elementCenterX;
                const offsetY = clientY - elementCenterY;
                const magneticX = elementCenterX + offsetX * 0.15;
                const magneticY = elementCenterY + offsetY * 0.15;

                mouseX.set(magneticX);
                mouseY.set(magneticY);
            } else {
                mouseX.set(clientX);
                mouseY.set(clientY);
            }
        };

        const handleInteraction = (target: EventTarget | null) => {
            // Safe guard for non-Element targets
            if (!(target instanceof Element)) {
                isHoveringRef.current = false;
                activeElementRef.current = null;
                setHoverState(null);
                cursorWidth.set(10);
                cursorHeight.set(10);
                return;
            }

            const interactive = target.closest("button, a, [role='button'], input, textarea, [data-interactive='true']");

            if (interactive) {
                // Only update if element changed
                if (activeElementRef.current !== interactive) {
                    activeElementRef.current = interactive;
                    isHoveringRef.current = true;
                    updateGeometry();
                }
            } else {
                isHoveringRef.current = false;
                activeElementRef.current = null;
                setHoverState(null);
                cursorWidth.set(10);
                cursorHeight.set(10);
            }
        };

        const handleMouseOver = (e: MouseEvent) => handleInteraction(e.target);
        
        const handleFocus = (e: FocusEvent) => {
            handleInteraction(e.target);
            // Move cursor to focused element center
            if (isHoveringRef.current) {
                setCursorToElementCenter();
            }
        };
        
        const handleBlur = () => {
            isHoveringRef.current = false;
            activeElementRef.current = null;
            setHoverState(null);
            cursorWidth.set(10);
            cursorHeight.set(10);
        };

        // Update geometry on scroll/resize
        const handleScrollResize = () => {
            if (isHoveringRef.current && activeElementRef.current) {
                updateGeometry();
            }
        };

        window.addEventListener("mousemove", moveCursor, { passive: true });
        window.addEventListener("mouseover", handleMouseOver, { passive: true });
        window.addEventListener("focusin", handleFocus, { passive: true });
        window.addEventListener("focusout", handleBlur, { passive: true });
        window.addEventListener("scroll", handleScrollResize, { passive: true, capture: true });
        window.addEventListener("resize", handleScrollResize, { passive: true });

        return () => {
            window.removeEventListener("mousemove", moveCursor);
            window.removeEventListener("mouseover", handleMouseOver);
            window.removeEventListener("focusin", handleFocus);
            window.removeEventListener("focusout", handleBlur);
            window.removeEventListener("scroll", handleScrollResize, { capture: true });
            window.removeEventListener("resize", handleScrollResize);
        };
    }, [mouseX, mouseY, cursorWidth, cursorHeight, updateGeometry, setCursorToElementCenter]);

    const isHovering = hoverState !== null;

    return (
        <>
            {/* Main Cursor - width/height on container for proper centering */}
            <motion.div
                className="fixed top-0 left-0 pointer-events-none z-[9999] flex items-center justify-center"
                style={{
                    x: useTransform([cursorX, wobbleX], ([cx, wx]: number[]) => cx + wx),
                    y: useTransform([cursorY, wobbleY], ([cy, wy]: number[]) => cy + wy),
                    width: springWidth,
                    height: springHeight,
                    translateX: "-50%",
                    translateY: "-50%",
                    scale: scale,
                }}
            >
                {/* Outer glow ring - fills container */}
                <motion.div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    animate={{
                        borderRadius: isHovering && hoverState ? hoverState.radius : "50%",
                        border: "1px solid rgba(255, 255, 255, 0.25)",
                        backgroundColor: isHovering ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.1)",
                        boxShadow: isHovering 
                            ? "0 0 24px rgba(255, 255, 255, 0.08), inset 0 0 12px rgba(255, 255, 255, 0.03)"
                            : "0 0 12px rgba(255, 255, 255, 0.15)",
                    }}
                    transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 400,
                        mass: 0.8
                    }}
                />
                
                {/* Inner dot - cursor anchor */}
                <motion.div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        width: 4,
                        height: 4,
                        backgroundColor: "rgba(255, 255, 255, 0.85)",
                    }}
                />
            </motion.div>

            {/* Ambient trail */}
            <motion.div
                className="fixed top-0 left-0 pointer-events-none z-[9998]"
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
                animate={{
                    scale: isHovering ? 0 : 0.5,
                    opacity: isHovering ? 0 : 0.2,
                }}
                transition={{ duration: 0.25 }}
            >
                <div 
                    className="rounded-full"
                    style={{
                        width: 5,
                        height: 5,
                        background: "radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)",
                    }}
                />
            </motion.div>
        </>
    );
}
