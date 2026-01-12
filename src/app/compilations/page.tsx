import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { compilations } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import AppBackground from "@/components/AppBackground";
import DailyCompilation from "@/components/DailyCompilation";
import { redirect } from "next/navigation";

export default async function CompilationsPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/");
    }

    const userCompilations = await db
        .select()
        .from(compilations)
        .where(eq(compilations.userId, userId))
        .orderBy(desc(compilations.date));

    return (
        <main className="relative min-h-screen w-full overflow-hidden flex flex-col items-center bg-black">
            <AppBackground subtle />
            <Navbar />

            <div className="relative z-10 flex flex-col items-center w-full max-w-2xl px-6 pt-32 pb-20">
                <PageHeader
                    title="Compilations."
                    description="Daily summaries of your thoughts."
                />

                <div className="w-full mt-12 space-y-12">
                    {userCompilations.length > 0 ? (
                        userCompilations.map((compilation) => (
                            <div key={compilation.id} className="w-full">
                                <div className="flex items-baseline gap-4 mb-4">
                                    <h2 className="text-xl font-medium text-white">
                                        {new Date(compilation.date).toLocaleDateString(undefined, {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </h2>
                                    <span className="text-xs font-mono text-white/30">
                                        {new Date(compilation.compiledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <DailyCompilation content={compilation.content} />
                            </div>
                        ))
                    ) : (
                        <div className="text-white/20 text-center font-mono">
                            No compilations yet.
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
