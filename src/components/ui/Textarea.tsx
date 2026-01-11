"use client";

import { forwardRef, TextareaHTMLAttributes } from "react";
import clsx from "clsx";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, error, ...props }, ref) => {
        return (
            <textarea
                ref={ref}
                className={clsx(
                    "w-full rounded-xl border bg-black/40 text-white/90 p-4 text-base leading-relaxed resize-none",
                    "placeholder:text-white/30 transition-all duration-200 ease-out",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black",
                    error
                        ? "border-red-500/50 focus:ring-red-500/30"
                        : "border-white/10 focus:border-white/20 focus:ring-white/20",
                    className
                )}
                {...props}
            />
        );
    }
);

Textarea.displayName = "Textarea";

export default Textarea;
