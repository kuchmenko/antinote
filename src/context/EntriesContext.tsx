"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { StructuredData } from "@/lib/services/types";

export interface Entry {
    id: string;
    createdAt: Date;
    structured: StructuredData;
    pending?: boolean;
}

interface EntriesContextType {
    entries: Entry[];
    setEntries: (entries: Entry[]) => void;
    addEntry: (entry: Entry) => void;
    removeEntry: (id: string) => void;
    updateEntry: (id: string, updatedData: Partial<StructuredData>) => void;
}

const EntriesContext = createContext<EntriesContextType | undefined>(undefined);

export function EntriesProvider({ children }: { children: React.ReactNode }) {
    const [entries, setEntriesState] = useState<Entry[]>([]);

    const setEntries = useCallback((newEntries: Entry[]) => {
        setEntriesState(newEntries);
    }, []);

    const addEntry = useCallback((entry: Entry) => {
        setEntriesState((prev) => [entry, ...prev]);
    }, []);

    const removeEntry = useCallback((id: string) => {
        setEntriesState((prev) => prev.filter((e) => e.id !== id));
    }, []);

    const updateEntry = useCallback((id: string, updatedData: Partial<StructuredData>) => {
        setEntriesState((prev) =>
            prev.map((e) =>
                e.id === id ? { ...e, structured: { ...e.structured, ...updatedData } } : e
            )
        );
    }, []);

    return (
        <EntriesContext.Provider value={{ entries, setEntries, addEntry, removeEntry, updateEntry }}>
            {children}
        </EntriesContext.Provider>
    );
}

export function useEntries() {
    const context = useContext(EntriesContext);
    if (context === undefined) {
        throw new Error("useEntries must be used within an EntriesProvider");
    }
    return context;
}
