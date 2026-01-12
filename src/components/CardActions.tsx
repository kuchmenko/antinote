import { motion } from "framer-motion";
import { Trash2, Edit3, Sparkles } from "lucide-react";
import clsx from "clsx";

interface CardActionsProps {
    onDelete: () => void;
    onEdit: () => void;
    onImprove: () => void;
}

export default function CardActions({ onDelete, onEdit, onImprove }: CardActionsProps) {
    const buttonBase = "flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300";

    return (
        <div className="flex items-center gap-1">
            <motion.button
                onClick={onEdit}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={clsx(
                    buttonBase,
                    "text-white/40 hover:text-blue-400",
                    "hover:bg-blue-500/10"
                )}
                title="Edit entry"
            >
                <Edit3 size={16} />
            </motion.button>

            <motion.button
                onClick={onImprove}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={clsx(
                    buttonBase,
                    "text-white/40 hover:text-purple-400",
                    "hover:bg-purple-500/10"
                )}
                title="AI Improve"
            >
                <Sparkles size={16} />
            </motion.button>

            <motion.button
                onClick={onDelete}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={clsx(
                    buttonBase,
                    "text-white/40 hover:text-red-400",
                    "hover:bg-red-500/10"
                )}
                title="Delete entry"
            >
                <Trash2 size={16} />
            </motion.button>
        </div>
    );
}
