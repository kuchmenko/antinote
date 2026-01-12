"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, X, Loader2, Sparkles, FileText, Zap, Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { SearchResult } from "@/lib/services/search-service";
import NoteCard from "./NoteCard";

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    autoFocus?: boolean;
}

export default function SearchOverlay({ isOpen, onClose, autoFocus = false }: SearchOverlayProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Voice Search State
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);

    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Handle focus and reset state
    useEffect(() => {
        if (isOpen) {
            if (autoFocus) {
                // Short delay to ensure mount/animation start
                setTimeout(() => inputRef.current?.focus(), 50);
            }
        } else {
            setQuery("");
            setResults([]);
            setHasSearched(false);
        }
    }, [isOpen, autoFocus]);

    // Escape key to close
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    const performSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`/api/entries/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            setResults(data.results || []);
            setHasSearched(true);
        } catch (error) {
            console.error("Search error:", error);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleInputChange = (value: string) => {
        setQuery(value);

        // Debounce search
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            performSearch(value);
        }, 300);
    };

    // Voice Search Logic
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                chunksRef.current = [];
                stream.getTracks().forEach(track => track.stop());

                // Transcribe
                setIsSearching(true);
                try {
                    const formData = new FormData();
                    formData.append("file", blob, "voice_search.webm");
                    const res = await fetch("/api/transcribe", { method: "POST", body: formData });
                    const { transcript } = await res.json();

                    if (transcript) {
                        setQuery(transcript);
                        performSearch(transcript);
                    }
                } catch (err) {
                    console.error("Transcription failed", err);
                } finally {
                    setIsSearching(false);
                }
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Mic access denied", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const toggleRecording = () => {
        if (isRecording) stopRecording();
        else startRecording();
    };

    const getMatchTypeIcon = (matchType: SearchResult["matchType"]) => {
        switch (matchType) {
            case "semantic":
                return <Sparkles size={12} className="text-purple-400" />;
            case "lexical":
                return <FileText size={12} className="text-blue-400" />;
            case "hybrid":
                return <Zap size={12} className="text-amber-400" />;
        }
    };

    const getMatchTypeLabel = (matchType: SearchResult["matchType"]) => {
        switch (matchType) {
            case "semantic":
                return "Meaning match";
            case "lexical":
                return "Keyword match";
            case "hybrid":
                return "Best match";
        }
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100]"
            >
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />

                {/* Search Container */}
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="flex flex-col w-full max-w-3xl mx-auto h-[85vh] mt-[5vh] px-6 pointer-events-none"
                >
                    {/* Search Input Area */}
                    <div className="flex-none pointer-events-auto z-10 mb-6">
                        <div className="relative group shadow-2xl">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            <div className="relative flex items-center bg-[#111111] border border-white/10 rounded-2xl overflow-hidden shadow-inner">
                                <div className="flex items-center justify-center w-14 h-14">
                                    {isSearching ? (
                                        <Loader2 size={20} className="text-white/50 animate-spin" />
                                    ) : (
                                        <Search size={20} className="text-white/50" />
                                    )}
                                </div>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => handleInputChange(e.target.value)}
                                    placeholder={isRecording ? "Listening..." : "Search your thoughts..."}
                                    className="flex-1 h-14 bg-transparent text-white placeholder:text-white/30 focus:outline-none text-lg tracking-wide"
                                />
                                {query ? (
                                    <button
                                        onClick={() => {
                                            setQuery("");
                                            setResults([]);
                                            setHasSearched(false);
                                            inputRef.current?.focus();
                                        }}
                                        className="flex items-center justify-center w-14 h-14 text-white/30 hover:text-white/60 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={toggleRecording}
                                        className={clsx(
                                            "flex items-center justify-center w-14 h-14 transition-all duration-300",
                                            isRecording ? "text-red-400 animate-pulse bg-red-500/10" : "text-white/30 hover:text-white/60"
                                        )}
                                    >
                                        <Mic size={20} />
                                    </button>
                                )}
                            </div>
                        </div>
                        {/* Hints */}
                        <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-white/40">
                            <span className="flex items-center gap-1.5">
                                <Sparkles size={10} className="text-purple-400/70" />
                                Semantic search enabled
                            </span>
                            <span>·</span>
                            <span>
                                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/50 font-sans">Esc</kbd> to close
                            </span>
                        </div>
                    </div>

                    {/* Results Area */}
                    <div className="flex-1 min-h-0 pointer-events-auto">
                        <AnimatePresence mode="wait">
                            {hasSearched && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="h-full overflow-y-auto custom-scrollbar pr-2 pb-20"
                                >
                                    {results.length > 0 ? (
                                        <div className="grid gap-3">
                                            <div className="flex items-center justify-between px-2 mb-2 sticky top-0 bg-transparent backdrop-blur-sm py-2 z-10">
                                                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                                                    Top Results ({results.length})
                                                </span>
                                            </div>

                                            {results.map((result, index) => (
                                                <motion.div
                                                    key={result.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.03 }}
                                                    className="group relative flex flex-col gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl transition-all cursor-pointer"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-base text-white/90 leading-relaxed line-clamp-2 font-light">
                                                                {result.structuredData.content}
                                                            </p>
                                                            {result.structuredData.tags && result.structuredData.tags.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 mt-3">
                                                                    {result.structuredData.tags.map((tag, i) => (
                                                                        <span key={i} className="text-[10px] text-white/40 px-2 py-0.5 bg-white/5 rounded-full">
                                                                            #{tag}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Metadata Column */}
                                                        <div className="flex flex-col items-end gap-2 flex-none">
                                                            {/* Score Badge */}
                                                            <div className={clsx(
                                                                "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border",
                                                                result.matchType === 'semantic' ? "bg-purple-500/10 text-purple-300 border-purple-500/20" :
                                                                    result.matchType === 'hybrid' ? "bg-amber-500/10 text-amber-300 border-amber-500/20" :
                                                                        "bg-blue-500/10 text-blue-300 border-blue-500/20"
                                                            )}>
                                                                {getMatchTypeIcon(result.matchType)}
                                                                <span>{Math.round(result.score * 100)}%</span>
                                                            </div>
                                                            <span className="text-[10px] text-white/20">
                                                                {new Date(result.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex flex-col items-center justify-center h-64 text-white/30"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                                <Search size={24} className="opacity-30" />
                                            </div>
                                            <p className="text-sm font-medium">No matches found</p>
                                            <p className="text-xs text-white/20 mt-1">Try broadening your search terms</p>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
