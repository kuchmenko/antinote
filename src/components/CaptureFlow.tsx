"use client";

import { useState } from "react";
import clsx from "clsx";
import VoiceRecorder from "./VoiceRecorder";
import HandwritingInput from "./HandwritingInput";

type CaptureMode = "voice" | "handwritten";

export default function CaptureFlow() {
    const [mode, setMode] = useState<CaptureMode>("handwritten");

    return (
        <div className="w-full">
            <div className="flex flex-col items-center gap-4 mb-8">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1 shadow-[0_0_30px_rgba(255,255,255,0.08)]">
                    {([
                        { value: "handwritten", label: "Handwritten" },
                        { value: "voice", label: "Voice" },
                    ] as const).map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setMode(option.value)}
                            className={clsx(
                                "px-5 py-2 rounded-full text-sm font-medium transition",
                                mode === option.value
                                    ? "bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.3)]"
                                    : "text-white/60 hover:text-white"
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-white/40 text-center max-w-md">
                    Choose the most ergonomic input for the moment. Antinote structures it instantly.
                </p>
            </div>

            <div className="w-full">
                {mode === "voice" ? <VoiceRecorder /> : <HandwritingInput />}
            </div>
        </div>
    );
}
