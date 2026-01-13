export interface TranscriptionService {
    transcribe(audioBlob: Blob): Promise<string>;
}

import { z } from "zod";

export interface StructuredData {
    schemaVersion: 1;
    type: "task" | "idea" | "worry" | "plan" | "unknown";
    content: string;
    tags: string[];
    next_steps?: string[];
}

export const StructuredDataSchema = z.object({
    schemaVersion: z.literal(1),
    type: z.enum(["task", "idea", "worry", "plan", "unknown"]),
    content: z.string(),
    tags: z.array(z.string()),
    next_steps: z.array(z.string()).optional(),
});

export interface Loop {
    id: string;
    userId: string;
    sourceEntryId: string;
    type: "task" | "question" | "worry" | "plan";
    content: string;
    status: "open" | "done" | "snoozed";
    dueAt?: Date | null;
    snoozedUntil?: Date | null;
    createdAt: Date;
    doneAt?: Date | null;
    meta: LoopMeta;
}

export interface LoopMeta {
    hash: string;
    extractedFrom: "content" | "next_steps";
    confidence?: number;
    tags?: string[];
    origin?: "auto" | "manual";
}

export type LoopStatus = Loop["status"];
export type LoopType = Loop["type"];

export interface IntelligenceService {
    structure(transcript: string): Promise<StructuredData>;
    synthesize(transcripts: string[]): Promise<string>;
    createEmbedding(text: string): Promise<number[]>;
}

