import VoiceRecorder from "@/components/VoiceRecorder";
import DailyFeed from "@/components/DailyFeed";
import SynthesisButton from "@/components/SynthesisButton";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import NeuralOrb from "@/components/NeuralOrb";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { entries } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { StructuredData } from "@/lib/services/types";
import Link from "next/link";

export default async function Home() {
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

      {/* Auth Header */}
      <div className="absolute top-6 right-6 z-50">
        <SignedIn>
          <div className="p-1 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
            <UserButton appearance={{
              elements: {
                avatarBox: "w-8 h-8"
              }
            }} />
          </div>
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-5 py-2.5 rounded-full bg-white text-black font-medium text-sm hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-3xl px-6 pt-32 pb-20">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-24 space-y-6">
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-4">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
            <span className="text-xs font-medium text-white/60 tracking-wide uppercase">System Online</span>
          </div>

          <h1 className="text-7xl md:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 drop-shadow-sm">
            Antinote
          </h1>

          <p className="text-xl md:text-2xl text-white/60 max-w-lg font-light leading-relaxed mb-8">
            Your second brain, <span className="text-white font-normal">voice-first</span>.
            <br />
            Speak your mind, we handle the rest.
          </p>

          <Link
            href="/history"
            className="text-sm text-white/40 hover:text-white transition-colors border-b border-transparent hover:border-white/40 pb-0.5"
            data-interactive="true"
          >
            View All Entries
          </Link>
        </div>

        {/* Main Interaction Area */}
        <div className="w-full mb-24">
          <SignedIn>
            <VoiceRecorder />
          </SignedIn>

          <SignedOut>
            <div className="w-full h-[300px] flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
              <p className="text-white/40 text-lg font-light mb-6">Authenticate to access neural interface</p>
              <SignInButton mode="modal">
                <button className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 hover:border-white/20">
                  Initialize Session
                </button>
              </SignInButton>
            </div>
          </SignedOut>
        </div>

        {/* Feed Section */}
        <SignedIn>
          <DailyFeed entries={userEntries} />
          <SynthesisButton />
        </SignedIn>
      </div>
    </main>
  );
}
