"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, AlertCircle, Info } from "lucide-react";
import clsx from "clsx";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "success") => {
        const id = Math.random().toString(36).substring(7);
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const getIcon = (type: ToastType) => {
        switch (type) {
            case "success":
                return <Check size={16} className="text-emerald-400" />;
            case "error":
                return <AlertCircle size={16} className="text-red-400" />;
            case "info":
                return <Info size={16} className="text-blue-400" />;
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className={clsx(
                                "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl",
                                "bg-zinc-900/95 backdrop-blur-xl border shadow-2xl",
                                toast.type === "success" && "border-emerald-500/20",
                                toast.type === "error" && "border-red-500/20",
                                toast.type === "info" && "border-blue-500/20"
                            )}
                        >
                            <div className={clsx(
                                "flex items-center justify-center w-6 h-6 rounded-full",
                                toast.type === "success" && "bg-emerald-500/10",
                                toast.type === "error" && "bg-red-500/10",
                                toast.type === "info" && "bg-blue-500/10"
                            )}>
                                {getIcon(toast.type)}
                            </div>

                            <span className="text-sm text-white/90 font-medium">{toast.message}</span>

                            <button
                                onClick={() => dismissToast(toast.id)}
                                className="ml-2 p-1 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X size={14} className="text-white/40" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}
