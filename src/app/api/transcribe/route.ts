import { NextResponse } from "next/server";
import { MockTranscriptionService } from "@/lib/services/transcription";
import { OpenAITranscriptionService } from "@/lib/services/openai-transcription";

const getService = () => {
    if (process.env.OPENAI_API_KEY) {
        return new OpenAITranscriptionService();
    }
    return new MockTranscriptionService();
};

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as Blob;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const service = getService();
        const transcript = await service.transcribe(file);

        return NextResponse.json({ transcript });
    } catch (error) {
        console.error("Transcription error:", error);
        return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
    }
}
