import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import NeuralOrb from "@/components/NeuralOrb";

export default function LandingPage() {
    return (
        <main className="relative min-h-screen w-full overflow-hidden flex flex-col items-center">
            {/* Aurora Background Layer - Stronger for Guests */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[130px] animate-pulse-glow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[130px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
            </div>

            {/* 3D Neural Orb - Center Stage for Guests */}
            <NeuralOrb />

            {/* Auth Header */}
            <div className="absolute top-6 right-6 z-50">
                <SignInButton mode="modal">
                    <button className="px-5 py-2.5 rounded-full bg-white text-black font-medium text-sm hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        Sign In
                    </button>
                </SignInButton>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen w-full max-w-4xl px-6">
                <div className="flex flex-col items-center text-center space-y-8">
                    <div className="inline-flex items-center px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                        <span className="text-xs font-medium text-white/60 tracking-wide uppercase">System Online</span>
                    </div>

                    <h1 className="text-8xl md:text-9xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 drop-shadow-sm">
                        Antinote
                    </h1>

                    <p className="text-2xl md:text-3xl text-white/70 max-w-2xl font-light leading-relaxed">
                        Capture at the speed of thought. <br />
                        Transform <span className="text-white font-medium">voice</span> and <span className="text-white font-medium">handwriting</span> into structured knowledge instantly.
                    </p>

                    <div className="flex flex-col items-center gap-6 mt-8">
                        <SignInButton mode="modal">
                            <button className="group relative px-8 py-4 rounded-full bg-white text-black text-lg font-semibold tracking-wide hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.4)] overflow-hidden">
                                <span className="relative z-10">Initialize Session</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            </button>
                        </SignInButton>

                        <p className="text-xs text-white/30 uppercase tracking-widest">
                            Advanced Neural Interface
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
