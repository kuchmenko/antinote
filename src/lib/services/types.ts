export interface TranscriptionService {
    transcribe(audioBlob: Blob): Promise<string>;
}

export interface StructuredData {
    type: "task" | "idea" | "worry" | "plan" | "unknown";
    content: string;
    tags: string[];
    next_steps?: string[];
}

export interface IntelligenceService {
    structure(transcript: string): Promise<StructuredData>;
    synthesize(transcripts: string[]): Promise<string>;
    createEmbedding(text: string): Promise<number[]>;
}

