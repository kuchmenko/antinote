"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
    CheckCircle2,
    Lightbulb,
    Compass,
    BookOpen,
    Sparkles,
    ListTodo,
    Quote
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyCompilationProps {
    content: string;
    className?: string;
}

interface Section {
    title: string;
    content: string;
    type: 'narrative' | 'wisdom' | 'sparks' | 'focus' | 'other';
}

export default function DailyCompilation({ content, className }: DailyCompilationProps) {
    const sections = useMemo(() => {
        const lines = content.split('\n');
        const result: Section[] = [];
        let currentSection: Section | null = null;

        lines.forEach(line => {
            if (line.startsWith('## ')) {
                if (currentSection) {
                    result.push(currentSection);
                }
                const title = line.replace('## ', '').trim();
                let type: Section['type'] = 'other';

                const lowerTitle = title.toLowerCase();
                if (lowerTitle.includes('narrative') || lowerTitle.includes('story') || lowerTitle.includes('reflection')) type = 'narrative';
                else if (lowerTitle.includes('wisdom') || lowerTitle.includes('action') || lowerTitle.includes('tasks')) type = 'wisdom';
                else if (lowerTitle.includes('spark') || lowerTitle.includes('insight') || lowerTitle.includes('idea')) type = 'sparks';
                else if (lowerTitle.includes('focus') || lowerTitle.includes('tomorrow') || lowerTitle.includes('plan')) type = 'focus';

                currentSection = {
                    title,
                    content: '',
                    type
                };
            } else {
                if (currentSection) {
                    currentSection.content += line + '\n';
                } else if (line.trim()) {
                    // Content before first header
                    currentSection = {
                        title: 'The Narrative',
                        content: line + '\n',
                        type: 'narrative'
                    };
                }
            }
        });

        if (currentSection) {
            result.push(currentSection);
        }

        return result;
    }, [content]);

    return (
        <div className={cn("w-full space-y-8", className)}>
            {sections.map((section, index) => (
                <SectionCard
                    key={index}
                    section={section}
                    index={index}
                />
            ))}
        </div>
    );
}

function SectionCard({ section, index }: { section: Section; index: number }) {
    const getIcon = () => {
        switch (section.type) {
            case 'narrative': return <BookOpen className="w-5 h-5 text-rose-300" />;
            case 'wisdom': return <CheckCircle2 className="w-5 h-5 text-amber-300" />;
            case 'sparks': return <Sparkles className="w-5 h-5 text-violet-300" />;
            case 'focus': return <Compass className="w-5 h-5 text-emerald-300" />;
            default: return <Quote className="w-5 h-5 text-white/40" />;
        }
    };

    const getStyles = () => {
        switch (section.type) {
            case 'narrative': return {
                container: "bg-gradient-to-br from-rose-900/10 to-transparent border-rose-500/10",
                title: "text-rose-200/90 font-serif tracking-wide",
                prose: "prose-p:font-serif prose-p:text-lg prose-p:text-rose-100/80 prose-p:leading-loose italic"
            };
            case 'wisdom': return {
                container: "bg-gradient-to-br from-amber-900/10 to-transparent border-amber-500/10",
                title: "text-amber-200/90 tracking-wide uppercase text-sm font-semibold",
                prose: "prose-li:text-amber-100/80 prose-li:marker:text-amber-500/50"
            };
            case 'sparks': return {
                container: "bg-gradient-to-br from-violet-900/10 to-transparent border-violet-500/10",
                title: "text-violet-200/90 tracking-wide uppercase text-sm font-semibold",
                prose: "prose-li:text-violet-100/80 prose-li:marker:text-violet-500/50"
            };
            case 'focus': return {
                container: "bg-gradient-to-br from-emerald-900/10 to-transparent border-emerald-500/10",
                title: "text-emerald-200/90 tracking-wide uppercase text-sm font-semibold",
                prose: "prose-p:text-emerald-100/80 prose-p:font-medium"
            };
            default: return {
                container: "bg-white/5 border-white/10",
                title: "text-white/80",
                prose: "prose-p:text-white/70"
            };
        }
    };

    const styles = getStyles();

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15, duration: 0.6, ease: "easeOut" }}
            className={cn(
                "rounded-3xl border p-8 backdrop-blur-md relative overflow-hidden group",
                styles.container
            )}
        >
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 shadow-inner">
                    {getIcon()}
                </div>
                <h3 className={cn("text-lg", styles.title)}>
                    {section.title}
                </h3>
            </div>

            <div className={cn(
                "prose prose-invert max-w-none relative z-10",
                "prose-headings:text-white/90 prose-headings:font-medium",
                "prose-strong:text-white/90 prose-strong:font-semibold",
                "prose-a:text-white/90 prose-a:underline-offset-4 hover:prose-a:text-white",
                styles.prose
            )}>
                <ReactMarkdown
                    components={{
                        input: (props) => {
                            if (props.type === 'checkbox') {
                                return (
                                    <input
                                        type="checkbox"
                                        checked={props.checked}
                                        readOnly
                                        className="mr-3 w-4 h-4 rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500/50 focus:ring-offset-0 cursor-default"
                                    />
                                );
                            }
                            return <input {...props} />;
                        }
                    }}
                >
                    {section.content}
                </ReactMarkdown>
            </div>
        </motion.div>
    );
}
