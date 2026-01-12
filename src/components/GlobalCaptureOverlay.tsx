"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UnifiedCapture from "./UnifiedCapture";
import { useEntries } from "@/context/EntriesContext";
import { X } from "lucide-react";

export default function GlobalCaptureOverlay() {
    const [isOpen, setIsOpen] = useState(false);
    const { addEntry } = useEntries();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

            if (e.key === "i" && !isInput && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                setIsOpen(true);
            }

            if (e.key === "Escape" && isOpen) {
                e.preventDefault();
                setIsOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    const handleEntryCreated = (entry: any) => {
        addEntry(entry);
        // Optional: Close on success? Or keep open for rapid entry?
        // Let's close it for now to return to context.
        setIsOpen(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsOpen(false);
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="w-full max-w-2xl relative"
                    >
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors"
                        >
                            <X size={24} />
                            <span className="sr-only">Close</span>
                        </button>

                        <UnifiedCapture
                            onEntryCreated={handleEntryCreated}
                            isFocused={true}
                            onEscape={() => setIsOpen(false)}
                        />

                        <div className="mt-4 text-center text-white/30 text-sm font-mono">
                            Press <span className="text-white/50">Esc</span> to close
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
