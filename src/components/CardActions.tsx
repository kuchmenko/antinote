import { motion } from "framer-motion";
import { Trash2, Edit3, Sparkles } from "lucide-react";
import clsx from "clsx";

interface CardActionsProps {
    onDelete: () => void;
    onEdit: () => void;
    onImprove: () => void;
    typeClass: {
        icon: string;
        border: string;
    };
}

export default function CardActions({ onDelete, onEdit, onImprove, typeClass }: CardActionsProps) {
    const buttonBase = "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 backdrop-blur-sm";

    return (
        <div className="flex items-center gap-2">
            <motion.button
                onClick={onEdit}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={clsx(
                    buttonBase,
                    "bg-blue-500/10 border border-blue-500/30 text-blue-400",
                    "hover:bg-blue-500/20 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                )}
                title="Edit entry"
            >
                <Edit3 size={16} />
            </motion.button>

            <motion.button
                onClick={onImprove}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={clsx(
                    buttonBase,
                    "bg-purple-500/10 border border-purple-500/30 text-purple-400",
                    "hover:bg-purple-500/20 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                )}
                title="AI Improve"
            >
                <Sparkles size={16} />
            </motion.button>

            <motion.button
                onClick={onDelete}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={clsx(
                    buttonBase,
                    "bg-red-500/10 border border-red-500/30 text-red-400",
                    "hover:bg-red-500/20 hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                )}
                title="Delete entry"
            >
                <Trash2 size={16} />
            </motion.button>
        </div>
    );
}
