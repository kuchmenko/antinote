import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { CheckCircle2, Lightbulb, AlertCircle, Calendar, Sparkles } from "lucide-react";
import clsx from "clsx";
import { StructuredData } from "@/lib/services/types";
import { MouseEvent } from "react";

interface NoteCardProps {
    data: StructuredData;
}

const iconMap = {
    task: CheckCircle2,
    idea: Lightbulb,
    worry: AlertCircle,
    plan: Calendar,
    unknown: Sparkles,
};

const typeStyles = {
    task: {
        gradient: "from-emerald-500/20 to-emerald-900/5",
        border: "border-emerald-500/30",
        icon: "text-emerald-400 bg-emerald-500/10",
        glow: "shadow-[0_0_30px_rgba(16,185,129,0.1)]",
    },
    idea: {
        gradient: "from-amber-500/20 to-amber-900/5",
        border: "border-amber-500/30",
        icon: "text-amber-400 bg-amber-500/10",
        glow: "shadow-[0_0_30px_rgba(245,158,11,0.1)]",
    },
    worry: {
        gradient: "from-red-500/20 to-red-900/5",
        border: "border-red-500/30",
        icon: "text-red-400 bg-red-500/10",
        glow: "shadow-[0_0_30px_rgba(239,68,68,0.1)]",
    },
    plan: {
        gradient: "from-blue-500/20 to-blue-900/5",
        border: "border-blue-500/30",
        icon: "text-blue-400 bg-blue-500/10",
        glow: "shadow-[0_0_30px_rgba(59,130,246,0.1)]",
    },
    unknown: {
        gradient: "from-gray-500/20 to-gray-900/5",
        border: "border-gray-500/30",
        icon: "text-gray-400 bg-gray-500/10",
        glow: "shadow-[0_0_30px_rgba(156,163,175,0.1)]",
    },
};

export default function NoteCard({ data }: NoteCardProps) {
    const Icon = iconMap[data.type] || Sparkles;
    const styles = typeStyles[data.type] || typeStyles.unknown;

    // 3D Tilt Logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["7deg", "-7deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-7deg", "7deg"]);

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
                "relative w-full max-w-[550px] p-8 rounded-3xl transition-all duration-300",
                "bg-black/40 backdrop-blur-xl border perspective-1000",
                styles.border,
                styles.glow
            )}
        >
            {/* Dynamic Gradient Background */}
            <div
                className={clsx("absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none rounded-3xl", styles.gradient)}
                style={{ transform: "translateZ(-20px)" }}
            />

            {/* Noise Texture */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none rounded-3xl" />

            <div className="relative z-10" style={{ transform: "translateZ(20px)" }}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className={clsx("flex items-center justify-center w-10 h-10 rounded-2xl", styles.icon)}>
                            <Icon size={20} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">{data.type}</span>
                    </div>
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    </div>
                </div>

                <p className="text-xl md:text-2xl font-light leading-relaxed text-white/90 mb-8 font-sans">
                    {data.content}
                </p>

                <div className="flex flex-wrap gap-2 mb-8">
                    {data.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-medium uppercase tracking-wider px-3 py-1.5 rounded-full bg-white/5 text-white/60 border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                            #{tag}
                        </span>
                    ))}
                </div>

                {data.next_steps && data.next_steps.length > 0 && (
                    <div className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/5 p-5">
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <p className="text-[10px] font-bold text-white/40 mb-3 uppercase tracking-widest">Action Items</p>
                        <ul className="space-y-3">
                            {data.next_steps.map((step, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-white/80 group">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-white/60 transition-colors" />
                                    <span className="group-hover:text-white transition-colors">{step}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
