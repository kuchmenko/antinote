import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { entries } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { StructuredData } from "@/lib/services/types";
import DailyFeed from "@/components/DailyFeed";
import NeuralOrb from "@/components/NeuralOrb";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function HistoryPage() {
    const { userId } = await auth();

    let userEntries: { id: string; createdAt: Date; structured: StructuredData }[] = [];

    if (userId) {
        const data = await db
            .select()
            .from(entries)
            .where(eq(entries.userId, userId))
            .orderBy(desc(entries.createdAt));

        userEntries = data.map(entry => ({
            id: entry.id,
            createdAt: entry.createdAt,
            structured: entry.structuredData as unknown as StructuredData,
        }));
    }

    return (
        <main className="relative min-h-screen w-full overflow-hidden flex flex-col items-center">
            {/* Aurora Background Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] animate-pulse-glow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
            </div>

            {/* 3D Neural Orb */}
            <NeuralOrb />

            <div className="relative z-10 flex flex-col items-center w-full max-w-3xl px-6 pt-12 pb-20">
                <div className="w-full flex items-center justify-between mb-12">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white/5"
                        data-interactive="true"
                    >
                        <ArrowLeft size={18} />
                        <span className="text-sm font-medium">Back to Focus</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-white">All Entries</h1>
                    <div className="w-24" /> {/* Spacer for centering */}
                </div>

                <DailyFeed entries={userEntries} />
            </div>
        </main>
    );
}
