"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type ActivityType = "idle" | "recording" | "transcribing" | "compiling";

interface ActivityContextType {
    activity: ActivityType;
    setActivity: (activity: ActivityType) => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export function ActivityProvider({ children }: { children: React.ReactNode }) {
    const [activity, setActivity] = useState<ActivityType>("idle");

    return (
        <ActivityContext.Provider value={{ activity, setActivity }}>
            {children}
        </ActivityContext.Provider>
    );
}

export function useActivity() {
    const context = useContext(ActivityContext);
    if (context === undefined) {
        throw new Error("useActivity must be used within an ActivityProvider");
    }
    return context;
}
