import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { loops } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import AppBackground from "@/components/AppBackground";
import LoopsFeed, { SerializedLoop } from "@/components/LoopsFeed";
import { redirect } from "next/navigation";

export default async function TasksPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/");
    }

    // Fetch all loops for the user
    const userLoops = await db
        .select()
        .from(loops)
        .where(eq(loops.userId, userId))
        .orderBy(desc(loops.createdAt));

    // Serialize dates to strings for Client Component
    const formattedLoops: SerializedLoop[] = userLoops.map(l => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
        dueAt: l.dueAt ? l.dueAt.toISOString() : null,
        snoozedUntil: l.snoozedUntil ? l.snoozedUntil.toISOString() : null,
        doneAt: l.doneAt ? l.doneAt.toISOString() : null,
        meta: l.meta as any,
    }));

    return (
        <main className="relative min-h-screen w-full overflow-hidden flex flex-col items-center bg-black">
            <AppBackground subtle />
            <Navbar />

            <div className="relative z-10 flex flex-col items-center w-full max-w-2xl px-6 pt-32 pb-20">
                <PageHeader
                    title="Loops."
                    description="Open cycles to close."
                />

                <div className="w-full mt-12">
                    <LoopsFeed loops={formattedLoops} />
                </div>
            </div>
        </main>
    );
}
