"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useEffect } from "react";

interface DeletionPromptProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function DeletionPrompt({ isOpen, onClose, onConfirm }: DeletionPromptProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === "Escape") onClose();
            if (e.key === "Enter") onConfirm();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, onConfirm]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="pointer-events-auto w-full max-w-sm bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">

                            <div className="flex flex-col items-center text-center">
                                {/* Icon - Minimal */}
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                                    <Trash2 className="text-white/60" size={16} />
                                </div>

                                {/* Text - Elegant & Minimal */}
                                <h2 className="text-lg font-bold tracking-tighter text-white mb-1">Delete Entry</h2>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-6">
                                    Return to the void
                                </p>

                                {/* Actions */}
                                <div className="flex gap-2 w-full">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-4 py-2 rounded-lg text-xs font-medium text-white/60 hover:text-white bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={onConfirm}
                                        className="flex-1 px-4 py-2 rounded-lg text-xs font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
