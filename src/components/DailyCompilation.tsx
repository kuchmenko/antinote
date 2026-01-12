"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
    CheckCircle2,
    Lightbulb,
    CalendarDays,
    FileText,
    Sparkles,
    ListTodo
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyCompilationProps {
    content: string;
    className?: string;
}

interface Section {
    title: string;
    content: string;
    type: 'summary' | 'tasks' | 'insights' | 'plan' | 'other';
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
                if (lowerTitle.includes('summary') || lowerTitle.includes('резюме')) type = 'summary';
                else if (lowerTitle.includes('task') || lowerTitle.includes('action') || lowerTitle.includes('задачи')) type = 'tasks';
                else if (lowerTitle.includes('insight') || lowerTitle.includes('idea') || lowerTitle.includes('инсайты')) type = 'insights';
                else if (lowerTitle.includes('plan') || lowerTitle.includes('tomorrow') || lowerTitle.includes('план')) type = 'plan';

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
                        title: 'Overview',
                        content: line + '\n',
                        type: 'summary'
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
        <div className={cn("w-full space-y-6", className)}>
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
            case 'summary': return <FileText className="w-5 h-5 text-blue-400" />;
            case 'tasks': return <ListTodo className="w-5 h-5 text-emerald-400" />;
            case 'insights': return <Lightbulb className="w-5 h-5 text-amber-400" />;
            case 'plan': return <CalendarDays className="w-5 h-5 text-purple-400" />;
            default: return <Sparkles className="w-5 h-5 text-gray-400" />;
        }
    };

    const getGradient = () => {
        switch (section.type) {
            case 'summary': return "from-blue-500/10 to-blue-500/5 border-blue-500/20";
            case 'tasks': return "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20";
            case 'insights': return "from-amber-500/10 to-amber-500/5 border-amber-500/20";
            case 'plan': return "from-purple-500/10 to-purple-500/5 border-purple-500/20";
            default: return "from-white/10 to-white/5 border-white/10";
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
                "rounded-2xl border p-6 backdrop-blur-sm bg-gradient-to-br",
                getGradient()
            )}
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    {getIcon()}
                </div>
                <h3 className="text-lg font-medium text-white/90">
                    {section.title}
                </h3>
            </div>

            <div className="prose prose-invert prose-sm max-w-none 
                prose-p:text-white/70 prose-p:leading-relaxed
                prose-li:text-white/70 prose-li:marker:text-white/30
                prose-strong:text-white/90 prose-strong:font-medium
                prose-headings:text-white/90"
            >
                <ReactMarkdown
                    components={{
                        // Custom checkbox rendering for tasks
                        input: (props) => {
                            if (props.type === 'checkbox') {
                                return (
                                    <input
                                        type="checkbox"
                                        checked={props.checked}
                                        readOnly
                                        className="mr-2 rounded border-white/30 bg-white/5 text-emerald-500 focus:ring-emerald-500/50"
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
