import { TranscriptionService } from "./types";

export class MockTranscriptionService implements TranscriptionService {
    async transcribe(audioBlob: Blob): Promise<string> {
        console.log(`[MockTranscription] Transcribing ${audioBlob.size} bytes...`);

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        return "This is a simulated transcript. I need to buy groceries and finish the project presentation by Friday.";
    }
}
