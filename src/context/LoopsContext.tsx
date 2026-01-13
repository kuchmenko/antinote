"use client";

import React, { createContext, useContext, useCallback } from "react";
import { Loop } from "@/lib/services/types";

interface LoopsContextType {
    loops: Loop[];
    addLoops: (loops: Loop[]) => void;
}

const LoopsContext = createContext<LoopsContextType | undefined>(undefined);

export function LoopsProvider({ children, initialLoops = [] }: {
    children: React.ReactNode;
    initialLoops?: Loop[];
}) {
    const [loops, setLoops] = React.useState<Loop[]>(initialLoops);

    const addLoops = useCallback((newLoops: Loop[]) => {
        setLoops(prev => [...newLoops, ...prev]);
    }, []);

    return (
        <LoopsContext.Provider value={{ loops, addLoops }}>
            {children}
        </LoopsContext.Provider>
    );
}

export function useLoops() {
    const context = useContext(LoopsContext);
    if (!context) {
        throw new Error("useLoops must be used within LoopsProvider");
    }
    return context;
}
