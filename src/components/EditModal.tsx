import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { StructuredData } from "@/lib/services/types";
import clsx from "clsx";

interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedData: Partial<StructuredData>) => void;
    currentData: StructuredData;
}

const typeOptions = [
    { value: "task", label: "Task" },
    { value: "idea", label: "Idea" },
    { value: "worry", label: "Worry" },
    { value: "plan", label: "Plan" },
    { value: "unknown", label: "Unknown" },
] as const;

export default function EditModal({ isOpen, onClose, onSave, currentData }: EditModalProps) {
    const [content, setContent] = useState(currentData.content);
    const [type, setType] = useState(currentData.type);
    const [tags, setTags] = useState(currentData.tags.join(", "));
    const [nextSteps, setNextSteps] = useState(currentData.next_steps?.join("\n") || "");

    useEffect(() => {
        if (isOpen) {
            setContent(currentData.content);
            setType(currentData.type);
            setTags(currentData.tags.join(", "));
            setNextSteps(currentData.next_steps?.join("\n") || "");
        }
    }, [isOpen, currentData]);

    const handleSave = () => {
        const tagsArray = tags.split(",").map(t => t.trim()).filter(t => t.length > 0);
        const nextStepsArray = nextSteps.split("\n").map(s => s.trim()).filter(s => s.length > 0);

        onSave({
            content,
            type,
            tags: tagsArray,
            next_steps: nextStepsArray.length > 0 ? nextStepsArray : undefined,
        });
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
                        <div className="w-full max-w-2xl bg-black/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">Edit Entry</h2>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Form */}
                            <div className="space-y-6">
                                {/* Type Selector */}
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-2">Type</label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value as typeof type)}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                    >
                                        {typeOptions.map(option => (
                                            <option key={option.value} value={option.value} className="bg-black">
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-2">Content</label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none"
                                        placeholder="Enter content..."
                                    />
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-2">
                                        Tags <span className="text-white/40">(comma separated)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={tags}
                                        onChange={(e) => setTags(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                        placeholder="urgent, work, personal"
                                    />
                                </div>

                                {/* Next Steps */}
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-2">
                                        Action Items <span className="text-white/40">(one per line)</span>
                                    </label>
                                    <textarea
                                        value={nextSteps}
                                        onChange={(e) => setNextSteps(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none"
                                        placeholder="Step 1&#10;Step 2&#10;Step 3"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-8">
                                <motion.button
                                    onClick={onClose}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all"
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    onClick={handleSave}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={clsx(
                                        "flex-1 px-6 py-3 rounded-xl font-medium transition-all",
                                        "bg-gradient-to-r from-purple-500 to-blue-500",
                                        "hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]",
                                        "text-white"
                                    )}
                                >
                                    Save Changes
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
