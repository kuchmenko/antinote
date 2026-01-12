"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Home, CheckSquare, BookOpen, History as HistoryIcon, User } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { useRouter } from "next/navigation";

interface ActionMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onCompile: () => void;
    isCompiling: boolean;
}

export default function ActionMenu({ isOpen, onClose, onCompile, isCompiling }: ActionMenuProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();

    // Reset search and selection when menu opens
    useEffect(() => {
        if (isOpen) {
            setSearchQuery("");
            setSelectedIndex(0);
        }
    }, [isOpen]);

    const actions = [
        {
            id: 'home',
            type: 'link',
            href: '/',
            label: 'Home',
            icon: Home,
            section: 'Navigation'
        },
        {
            id: 'tasks',
            type: 'link',
            href: '/tasks',
            label: 'Tasks',
            icon: CheckSquare,
            section: 'Navigation'
        },
        {
            id: 'compilations',
            type: 'link',
            href: '/compilations',
            label: 'Compilations',
            icon: BookOpen,
            section: 'Navigation'
        },
        {
            id: 'history',
            type: 'link',
            href: '/history',
            label: 'History',
            icon: HistoryIcon,
            section: 'Navigation'
        },
        {
            id: 'profile',
            type: 'link',
            href: '/profile',
            label: 'Profile & Settings',
            icon: User,
            section: 'Navigation'
        },
        {
            id: 'compile',
            type: 'button',
            onClick: onCompile,
            label: 'Compile Day',
            description: 'Synthesize all notes into a summary',
            icon: Sparkles,
            shortcut: 'C',
            section: 'Actions',
            disabled: isCompiling,
            loading: isCompiling
        }
    ];

    const filteredActions = actions.filter(action =>
        action.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (action.description && action.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Update selection when search changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchQuery]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Tab") {
                e.preventDefault();
                onClose();
            }
            if (e.key === "Escape") {
                onClose();
            }

            // Navigation
            if (e.key === "ArrowDown" || (e.ctrlKey && e.key === "j")) {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredActions.length);
            }
            if (e.key === "ArrowUp" || (e.ctrlKey && e.key === "k")) {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
            }

            // Selection
            if (e.key === "Enter") {
                e.preventDefault();
                const action = filteredActions[selectedIndex];
                if (action) {
                    if (action.type === 'link' && action.href) {
                        onClose();
                        router.push(action.href);
                    } else if (action.type === 'button' && action.onClick && !action.disabled) {
                        action.onClick();
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, filteredActions, selectedIndex, router]);

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
                    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                        <motion.div
                            layoutId="action-menu-container"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            className="w-[400px] bg-[#1C1C1E] border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[80vh]"
                        >
                            {/* Header & Search */}
                            <div className="p-3 border-b border-white/5 flex flex-col gap-3">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-sm font-medium text-white/60">Actions</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] uppercase font-mono text-white/20 bg-white/5 px-2 py-1 rounded">Tab to close</span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Search actions..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Actions List */}
                            <div className="p-2 flex flex-col gap-1 overflow-y-auto">
                                {filteredActions.length > 0 ? (
                                    <>
                                        {filteredActions.map((action, index) => {
                                            const Icon = action.icon;
                                            const isSelected = index === selectedIndex;

                                            if (action.type === 'link') {
                                                return (
                                                    <Link
                                                        key={action.id}
                                                        href={action.href!}
                                                        onClick={onClose}
                                                        onMouseEnter={() => setSelectedIndex(index)}
                                                        className={clsx(
                                                            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all focus:outline-none group",
                                                            isSelected ? "bg-white/10" : "hover:bg-white/5"
                                                        )}
                                                    >
                                                        <div className={clsx(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                            isSelected ? "bg-white/10 text-white" : "bg-white/5 text-white/60 group-hover:bg-white/10 group-hover:text-white"
                                                        )}>
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <div className={clsx(
                                                            "text-sm font-medium transition-colors",
                                                            isSelected ? "text-white" : "text-white/80 group-hover:text-white"
                                                        )}>
                                                            {action.label}
                                                        </div>
                                                    </Link>
                                                );
                                            }

                                            return (
                                                <button
                                                    key={action.id}
                                                    onClick={action.onClick}
                                                    disabled={action.disabled}
                                                    onMouseEnter={() => setSelectedIndex(index)}
                                                    className={clsx(
                                                        "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all group focus:outline-none",
                                                        isSelected ? "bg-white/10" : "hover:bg-white/5",
                                                        action.disabled && "opacity-50 cursor-not-allowed"
                                                    )}
                                                >
                                                    <div className={clsx(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                        "bg-blue-500/10 text-blue-400",
                                                        isSelected ? "bg-blue-500/20" : "group-hover:bg-blue-500/20"
                                                    )}>
                                                        {action.loading ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Icon className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className={clsx(
                                                            "text-sm font-medium transition-colors",
                                                            isSelected ? "text-white" : "text-white group-hover:text-white"
                                                        )}>
                                                            {action.label}
                                                        </div>
                                                        {action.description && (
                                                            <div className={clsx(
                                                                "text-xs transition-colors",
                                                                isSelected ? "text-white/60" : "text-white/40 group-hover:text-white/60"
                                                            )}>
                                                                {action.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {action.shortcut && (
                                                        <div className="text-[10px] font-mono text-white/20">{action.shortcut}</div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </>
                                ) : (
                                    <div className="px-4 py-8 text-center text-white/20 text-sm">
                                        No actions found
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
