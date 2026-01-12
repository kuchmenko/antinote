"use client";

import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { CheckCircle2, Lightbulb, AlertCircle, Calendar, Sparkles } from "lucide-react";
import clsx from "clsx";
import { StructuredData } from "@/lib/services/types";
import { MouseEvent, useState, useEffect } from "react";
import CardActions from "./CardActions";
import SmartInput from "./SmartInput";

interface NoteCardProps {
    id: string;
    data: StructuredData;
    onUpdate?: (id: string, updatedData: Partial<StructuredData>) => void;
    onDelete?: (id: string) => void;
    isSelected?: boolean;
    onEditStart?: (id: string) => void;
    onImproveStart?: (id: string) => void;
    isEditing?: boolean;
    onEditSubmit?: (content: string) => void;
    onEditCancel?: () => void;
}

const iconMap = {
    task: CheckCircle2,
    idea: Lightbulb,
    worry: AlertCircle,
    plan: Calendar,
    unknown: Sparkles,
};

// Unified Premium Gold Theme
const typeStyles = {
    task: {
        accent: "text-emerald-400",
        bgAccent: "bg-emerald-400/10",
        border: "border-emerald-500/20",
        glow: "shadow-[0_0_40px_-10px_rgba(16,185,129,0.1)]",
    },
    idea: {
        accent: "text-amber-400",
        bgAccent: "bg-amber-400/10",
        border: "border-amber-500/20",
        glow: "shadow-[0_0_40px_-10px_rgba(245,158,11,0.1)]",
    },
    worry: {
        accent: "text-rose-400",
        bgAccent: "bg-rose-400/10",
        border: "border-rose-500/20",
        glow: "shadow-[0_0_40px_-10px_rgba(244,63,94,0.1)]",
    },
    plan: {
        accent: "text-blue-400",
        bgAccent: "bg-blue-400/10",
        border: "border-blue-500/20",
        glow: "shadow-[0_0_40px_-10px_rgba(59,130,246,0.1)]",
    },
    unknown: {
        accent: "text-gold-400",
        bgAccent: "bg-gold-400/10",
        border: "border-gold-500/20",
        glow: "shadow-[0_0_40px_-10px_rgba(255,215,0,0.1)]",
    },
};

export default function NoteCard({ id, data, onUpdate, onDelete, isSelected, onEditStart, onImproveStart, isEditing, onEditSubmit, onEditCancel }: NoteCardProps) {
    const Icon = iconMap[data.type] || Sparkles;
    const styles = typeStyles[data.type] || typeStyles.unknown;

    // 3D Tilt Logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["5deg", "-5deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-5deg", "5deg"]);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseXFromCenter = e.clientX - rect.left - width / 2;
        const mouseYFromCenter = e.clientY - rect.top - height / 2;

        x.set(mouseXFromCenter / width);
        y.set(mouseYFromCenter / height);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    // Action handlers
    const handleDelete = () => {
        if (onDelete && confirm("Are you sure you want to delete this entry?")) {
            onDelete(id);
        }
    };

    // Local state for editing content
    const [editContent, setEditContent] = useState(data.content);

    // Update local state when data changes (e.g. if prop updates)
    useEffect(() => {
        setEditContent(data.content);
    }, [data.content]);

    const handleEditSubmit = () => {
        if (onEditSubmit) {
            onEditSubmit(editContent);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            data-interactive="true"
            className={clsx(
                "group relative w-full max-w-[600px] p-6 rounded-2xl transition-all duration-500",
                "bg-[#0A0A0A] border perspective-1000",
                isSelected ? "border-white/30 shadow-[0_0_50px_-10px_rgba(255,255,255,0.15)] scale-[1.02]" : styles.border,
                isSelected ? "" : styles.glow,
                "hover:shadow-[0_0_80px_-20px_rgba(255,255,255,0.1)]"
            )}
        >
            {/* Subtle Gold Sheen on Hover */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/[0.03] to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            {/* Inner Content Container */}
            <div className="relative z-10 flex flex-col items-center text-center" style={{ transform: "translateZ(20px)" }}>

                {/* Header: Icon & Type */}
                <div className="flex flex-col items-center gap-3 mb-4">
                    <div className={clsx("p-2 rounded-full transition-colors duration-300", styles.bgAccent)}>
                        <Icon size={16} className={styles.accent} />
                    </div>
                </div>

                {/* Main Content - Serif & Elegant */}
                <AnimatePresence mode="wait">
                    {isEditing ? (
                        <motion.div
                            key="editor"
                            initial={{ opacity: 0, y: -20, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -20, height: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="w-full mb-4 overflow-hidden"
                        >
                            <SmartInput
                                value={editContent}
                                onChange={setEditContent}
                                onSubmit={handleEditSubmit}
                                isProcessing={false}
                                buttonText="Save"
                                autoFocus
                                textareaClassName="text-lg md:text-xl font-serif font-medium leading-relaxed text-white/90 selection:bg-white/20 !bg-transparent !border-none !p-0 !m-0 !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!ring-0 focus:!ring-offset-0 focus:!outline-none hover:!border-none hover:!ring-0 resize-none text-center"
                                onEscape={onEditCancel}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <p className="text-lg md:text-xl font-serif font-medium leading-relaxed text-white/90 mb-4 selection:bg-white/20">
                                {data.content}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Metadata Footer - Subtle (Hide when editing) */}
                {!isEditing && (
                    <div className="w-full flex items-center justify-between border-t border-white/5 pt-4 mt-2 opacity-40 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex gap-2">
                            {data.tags.map((tag) => (
                                <span key={tag} className="text-[10px] uppercase tracking-widest text-white/60">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Items - Only if present (Hide when editing) */}
                {!isEditing && data.next_steps && data.next_steps.length > 0 && (
                    <div className="w-full mt-4 pt-4 border-t border-white/5 text-left">
                        <p className="text-[10px] font-bold text-white/30 mb-3 uppercase tracking-widest text-center">Next Steps</p>
                        <ul className="space-y-2">
                            {data.next_steps.map((step, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-white/60 font-serif italic justify-center">
                                    <span className="w-1 h-1 rounded-full bg-white/30" />
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Managing Overlay - Actions (Hide when editing) */}
            {!isEditing && (
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-[-10px] group-hover:translate-y-0 z-30">
                    <div className="p-1.5 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex gap-1 transform scale-90 hover:scale-100 transition-transform">
                        <CardActions
                            onDelete={handleDelete}
                            onEdit={() => onEditStart?.(id)}
                            onImprove={() => onImproveStart?.(id)}
                        />
                    </div>
                </div>
            )}
        </motion.div>
    );
}
