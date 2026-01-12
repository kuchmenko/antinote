import { UserButton } from "@clerk/nextjs";
import ConnectTelegram from "@/components/ConnectTelegram";
import Link from "next/link";

export default function Navbar() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-start backdrop-blur-sm bg-black/10">
            <Link href="/" className="flex flex-col group">
                <h1 className="text-xl font-bold tracking-tighter text-white/90 group-hover:text-white transition-colors">Antinote</h1>
                <span className="text-[10px] text-white/30 uppercase tracking-widest">Personal Workspace</span>
            </Link>

            <div className="flex items-center gap-4">
                <Link
                    href="/history"
                    className="text-white/40 hover:text-white text-sm font-medium transition-colors"
                >
                    History
                </Link>
                <ConnectTelegram />
                <div className="p-1 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
                    <UserButton appearance={{
                        elements: {
                            avatarBox: "w-8 h-8"
                        }
                    }} />
                </div>
            </div>
        </header>
    );
}
