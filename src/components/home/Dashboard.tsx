import UnifiedCapture from "@/components/UnifiedCapture";
import DailyFeed from "@/components/DailyFeed";
import SynthesisButton from "@/components/SynthesisButton";
import Link from "next/link";
import { StructuredData } from "@/lib/services/types";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import AppBackground from "@/components/AppBackground";

interface DashboardProps {
    user: any;
    userEntries: { id: string; createdAt: Date; structured: StructuredData }[];
}

export default function Dashboard({ user, userEntries }: DashboardProps) {
    const hour = new Date().getHours();
    let timeGreeting = "Good evening";
    if (hour < 5) timeGreeting = "Late night";
    else if (hour < 12) timeGreeting = "Good morning";
    else if (hour < 18) timeGreeting = "Good afternoon";

    const firstName = user?.firstName;
    const greeting = firstName ? `${timeGreeting}, ${firstName}` : timeGreeting;

    return (
        <main className="relative min-h-screen w-full overflow-hidden flex flex-col items-center bg-black">
            <AppBackground subtle />
            <Navbar />

            <div className="relative z-10 flex flex-col items-center w-full max-w-2xl px-6 pt-32 pb-20">
                <PageHeader
                    title={`${greeting}.`}
                    description="What's on your mind?"
                />

                {/* Capture Area */}
                <div className="w-full mb-16">
                    <UnifiedCapture />
                </div>

                <div className="w-full h-px bg-white/10 mb-8" />

                {/* Feed Section */}
                <div className="w-full">
                    <div className="flex justify-between items-baseline mb-6">
                        <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">Recent Thoughts</h3>
                        <Link
                            href="/history"
                            className="text-xs text-white/30 hover:text-white transition-colors"
                        >
                            View History →
                        </Link>
                    </div>
                    <DailyFeed entries={userEntries} />
                </div>

                <SynthesisButton />
            </div>
        </main>
    );
}
