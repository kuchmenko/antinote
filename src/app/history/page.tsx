import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { entries } from "@/db/schema";
import { desc, eq, lte, and } from "drizzle-orm";
import { StructuredData } from "@/lib/services/types";
import DailyFeed from "@/components/DailyFeed";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import AppBackground from "@/components/AppBackground";

export default async function HistoryPage() {
    const { userId } = await auth();

    let userEntries: { id: string; createdAt: Date; structured: StructuredData }[] = [];

    if (userId) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const data = await db
            .select({
                id: entries.id,
                userId: entries.userId,
                transcript: entries.transcript,
                structuredData: entries.structuredData,
                createdAt: entries.createdAt,
            })
            .from(entries)
            .where(
                and(
                    eq(entries.userId, userId),
                    lte(entries.createdAt, twentyFourHoursAgo)
                )
            )
            .orderBy(desc(entries.createdAt));

        userEntries = data.map(entry => ({
            id: entry.id,
            createdAt: entry.createdAt,
            structured: entry.structuredData as unknown as StructuredData,
        }));
    }

    return (
        <main className="relative min-h-screen w-full overflow-hidden flex flex-col items-center bg-black">
            <AppBackground subtle />
            <Navbar />

            <div className="relative z-10 flex flex-col items-center w-full max-w-2xl px-6 pt-32 pb-20">
                <PageHeader
                    title="History"
                    description="Your collection of captured thoughts."
                >
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-white/30 hover:text-white transition-colors px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
                        data-interactive="true"
                    >
                        <ArrowLeft size={14} />
                        <span className="text-xs font-medium">Focus</span>
                    </Link>
                </PageHeader>

                <DailyFeed entries={userEntries} />
            </div>
        </main>
    );
}
