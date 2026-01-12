"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import SearchOverlay from "./SearchOverlay";

export default function SearchButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [shouldAutoFocus, setShouldAutoFocus] = useState(false);

    // "/" to toggle search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

            if (e.key === "/" && !isInput && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                setShouldAutoFocus(true);
                setIsOpen(prev => !prev);
            }

            // Keep Cmd+K as alternative
            if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.code === "KeyK")) {
                e.preventDefault();
                setShouldAutoFocus(true);
                setIsOpen(prev => !prev);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleClick = () => {
        setShouldAutoFocus(false); // No auto-focus on click
        setIsOpen(true);
    };

    return (
        <>
            <button
                onClick={handleClick}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/40 hover:text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all group"
                data-interactive="true"
            >
                <Search size={14} />
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-white/5 rounded text-white/30 group-hover:text-white/50">
                    /
                </kbd>
            </button>
            <SearchOverlay
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                autoFocus={shouldAutoFocus}
            />
        </>
    );
}
