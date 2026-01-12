import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { entries } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { StructuredData } from "@/lib/services/types";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import AppBackground from "@/components/AppBackground";
import DailyFeed from "@/components/DailyFeed";
import { redirect } from "next/navigation";

export default async function TasksPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/");
    }

    // Fetch all entries that are tasks
    // Using raw SQL for JSONB query or fetching all and filtering
    // Drizzle's JSONB support is good, but for simplicity and type safety with the current setup:
    const data = await db
        .select({
            id: entries.id,
            userId: entries.userId,
            transcript: entries.transcript,
            structuredData: entries.structuredData,
            createdAt: entries.createdAt,
        })
        .from(entries)
        .where(eq(entries.userId, userId))
        .orderBy(desc(entries.createdAt));

    // Filter for tasks in application layer for now to avoid complex SQL casting issues if any
    const taskEntries = data
        .map(entry => ({
            id: entry.id,
            createdAt: entry.createdAt,
            structured: entry.structuredData as unknown as StructuredData,
        }))
        .filter(entry => entry.structured.type === "task");

    return (
        <main className="relative min-h-screen w-full overflow-hidden flex flex-col items-center bg-black">
            <AppBackground subtle />
            <Navbar />

            <div className="relative z-10 flex flex-col items-center w-full max-w-2xl px-6 pt-32 pb-20">
                <PageHeader
                    title="Tasks."
                    description="Things to get done."
                />

                <div className="w-full mt-12">
                    {/* We might want to pass a prop to DailyFeed to hide filters or pre-select 'task' */}
                    {/* For now, reusing DailyFeed but it has its own internal state for filters. 
                Ideally we should refactor DailyFeed to accept 'initialFilter' or 'hideFilters' 
                but for now let's just render it. The user can still see other types if they click filters, 
                but we are passing only task entries so filters won't show much else.
            */}
                    <DailyFeed entries={taskEntries} />
                </div>
            </div>
        </main>
    );
}
