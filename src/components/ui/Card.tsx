import { forwardRef, HTMLAttributes } from "react";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "elevated" | "subtle";
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = "default", children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={clsx(
                    "rounded-2xl transition-all duration-300",
                    variant === "default" && "bg-white/[0.03] border border-white/10 backdrop-blur-md",
                    variant === "elevated" && "bg-white/[0.05] border border-white/15 backdrop-blur-lg shadow-[0_20px_40px_rgba(0,0,0,0.4)]",
                    variant === "subtle" && "bg-white/[0.02] border border-white/5",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = "Card";

export default Card;
