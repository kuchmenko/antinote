"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Loader2, FileText, Check } from "lucide-react";
import clsx from "clsx";

interface ActionMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onCompile: () => void;
    isCompiling: boolean;
}

export default function ActionMenu({ isOpen, onClose, onCompile, isCompiling }: ActionMenuProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Tab") {
                e.preventDefault();
                if (isOpen) {
                    onClose();
                } else {
                    // Open logic is handled in parent or here? 
                    // Usually parent handles toggle, but Tab is global.
                    // For now, let's assume parent passes 'isOpen' but we might need to notify parent to open.
                    // Actually, let's just use the prop.
                }
            }
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Menu */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                    >
                        <div className="w-[400px] bg-[#1C1C1E] border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col">
                            {/* Header */}
                            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                                <span className="text-sm font-medium text-white/60">Actions</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-mono text-white/20 bg-white/5 px-2 py-1 rounded">Tab to close</span>
                                </div>
                            </div>

                            {/* Actions List */}
                            <div className="p-2 flex flex-col gap-1">
                                <button
                                    onClick={onCompile}
                                    disabled={isCompiling}
                                    className={clsx(
                                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all group",
                                        "hover:bg-white/5 focus:bg-white/5 focus:outline-none",
                                        isCompiling && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <div className={clsx(
                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                        "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20"
                                    )}>
                                        {isCompiling ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="w-4 h-4" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-white group-hover:text-white">Compile Day</div>
                                        <div className="text-xs text-white/40 group-hover:text-white/60">Synthesize all notes into a summary</div>
                                    </div>
                                    <div className="text-[10px] font-mono text-white/20">C</div>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
