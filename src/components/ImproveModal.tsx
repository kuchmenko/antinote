import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, Lightbulb, Target, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { StructuredData } from "@/lib/services/types";
import clsx from "clsx";

interface ImproveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImprove: (instruction: string) => Promise<StructuredData>;
    currentData: StructuredData;
}

const improvementSuggestions = [
    { icon: Target, text: "Make it more specific and actionable" },
    { icon: Lightbulb, text: "Expand with more details and context" },
    { icon: Zap, text: "Simplify and make it concise" },
];

export default function ImproveModal({ isOpen, onClose, onImprove, currentData }: ImproveModalProps) {
    const [instruction, setInstruction] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [improvedData, setImprovedData] = useState<StructuredData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            // Reset state when modal closes
            setInstruction("");
            setImprovedData(null);
            setError(null);
            setIsLoading(false);
        }

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };

        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    const handleImprove = async () => {
        if (!instruction.trim()) {
            setError("Please enter an improvement instruction");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const improved = await onImprove(instruction);
            setImprovedData(improved);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to improve entry");
        } finally {
            setIsLoading(false);
        }
    };

    const handleApply = () => {
        onClose();
    };

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

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.target === e.currentTarget && onClose()}
                    >
                        <div className="w-full max-w-3xl bg-black/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/30">
                                        <Sparkles className="text-purple-400" size={20} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">AI Improve</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Current Content */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-white/60 mb-2">Current Entry</label>
                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                    <p className="text-white/80 text-sm leading-relaxed">{currentData.content}</p>
                                </div>
                            </div>

                            {!improvedData ? (
                                <>
                                    {/* Instruction Input */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-white/60 mb-2">
                                            How should AI improve this entry?
                                        </label>
                                        <textarea
                                            value={instruction}
                                            onChange={(e) => {
                                                setInstruction(e.target.value);
                                                setError(null);
                                            }}
                                            rows={3}
                                            disabled={isLoading}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none disabled:opacity-50"
                                            placeholder="e.g., Make it more actionable, add specific deadlines, expand with more details..."
                                        />
                                        {error && (
                                            <p className="mt-2 text-sm text-red-400">{error}</p>
                                        )}
                                    </div>

                                    {/* Suggestions */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-white/60 mb-3">Quick Suggestions</label>
                                        <div className="grid gap-2">
                                            {improvementSuggestions.map((suggestion, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setInstruction(suggestion.text)}
                                                    disabled={isLoading}
                                                    className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left text-white/80 hover:text-white transition-all disabled:opacity-50 group"
                                                >
                                                    <suggestion.icon size={16} className="text-purple-400 group-hover:scale-110 transition-transform" />
                                                    <span className="text-sm">{suggestion.text}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <motion.button
                                        onClick={handleImprove}
                                        disabled={isLoading || !instruction.trim()}
                                        whileHover={{ scale: isLoading ? 1 : 1.02 }}
                                        whileTap={{ scale: isLoading ? 1 : 0.98 }}
                                        className={clsx(
                                            "w-full px-6 py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                                            "bg-gradient-to-r from-purple-500 to-blue-500",
                                            "hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]",
                                            "text-white",
                                            "disabled:opacity-50 disabled:cursor-not-allowed"
                                        )}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="animate-spin" size={20} />
                                                <span>AI is improving your entry...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={20} />
                                                <span>Improve with AI</span>
                                            </>
                                        )}
                                    </motion.button>
                                </>
                            ) : (
                                <>
                                    {/* Preview Improved Content */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-white/60 mb-2">Improved Version</label>
                                        <div className="p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl">
                                            <p className="text-white text-sm leading-relaxed mb-4">{improvedData.content}</p>

                                            {improvedData.tags && improvedData.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {improvedData.tags.map((tag, idx) => (
                                                        <span key={idx} className="text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded-full bg-white/10 text-white/70 border border-white/10">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {improvedData.next_steps && improvedData.next_steps.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-white/10">
                                                    <p className="text-[10px] font-bold text-white/40 mb-2 uppercase tracking-widest">Action Items</p>
                                                    <ul className="space-y-2">
                                                        {improvedData.next_steps.map((step, idx) => (
                                                            <li key={idx} className="flex items-start gap-2 text-sm text-white/80">
                                                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400" />
                                                                <span>{step}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Apply/Retry Buttons */}
                                    <div className="flex gap-3">
                                        <motion.button
                                            onClick={() => {
                                                setImprovedData(null);
                                                setInstruction("");
                                            }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all"
                                        >
                                            Try Different Instruction
                                        </motion.button>
                                        <motion.button
                                            onClick={handleApply}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={clsx(
                                                "flex-1 px-6 py-3 rounded-xl font-medium transition-all",
                                                "bg-gradient-to-r from-purple-500 to-blue-500",
                                                "hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]",
                                                "text-white"
                                            )}
                                        >
                                            Apply Improvements
                                        </motion.button>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
