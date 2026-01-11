"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={clsx(
                    "relative inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 ease-out",
                    "focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-black",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
                    // Variants
                    variant === "primary" && "bg-white text-black hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]",
                    variant === "secondary" && "bg-white/10 text-white border border-white/10 hover:bg-white/20 hover:border-white/20",
                    variant === "ghost" && "bg-transparent text-white/60 hover:text-white hover:bg-white/5",
                    variant === "danger" && "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30",
                    // Sizes
                    size === "sm" && "px-3 py-1.5 text-xs",
                    size === "md" && "px-5 py-2.5 text-sm",
                    size === "lg" && "px-8 py-3.5 text-base",
                    className
                )}
                data-interactive="true"
                {...props}
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Loading...
                    </span>
                ) : (
                    children
                )}
            </button>
        );
    }
);

Button.displayName = "Button";

export default Button;
