import { StructuredData } from "./services/types";

export interface FeedEntry {
    id: string;
    createdAt: Date;
    structured: StructuredData;
}

export const MOCK_FEED: FeedEntry[] = [
    {
        id: "1",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        structured: {
            schemaVersion: 1,
            type: "idea",
            content: "A voice-first OS that automatically structures your day based on random thoughts.",
            tags: ["startup", "product", "voice-ui"],
            next_steps: ["Sketch UI", "Define MVP features"]
        }
    },
    {
        id: "2",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
        structured: {
            schemaVersion: 1,
            type: "task",
            content: "Buy groceries for week: milk, eggs, spinach, and chicken breast.",
            tags: ["personal", "shopping"],
            next_steps: ["Go to Trader Joe's"]
        }
    },
    {
        id: "3",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        structured: {
            schemaVersion: 1,
            type: "worry",
            content: "I'm worried about deadline for Q3 report. I haven't started data analysis yet.",
            tags: ["work", "anxiety"],
            next_steps: ["Schedule 2h deep work block", "Email Sarah for data"]
        }
    },
    {
        id: "4",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26), // 1 day ago
        structured: {
            schemaVersion: 1,
            type: "plan",
            content: "Weekend trip to mountains. Need to pack hiking gear and book cabin.",
            tags: ["travel", "leisure"],
            next_steps: ["Check Airbnb", "Pack boots"]
        }
    }
    ];
