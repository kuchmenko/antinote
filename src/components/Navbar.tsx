"use client";

import { UserButton } from "@clerk/nextjs";

import SearchButton from "@/components/SearchButton";
import Link from "next/link";
import { useState, useEffect } from "react";
import ActionMenu from "@/components/ActionMenu";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActivity } from "@/context/ActivityContext";
import ActivityIndicator from "@/components/ActivityIndicator";
import { motion } from "framer-motion";

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { activity, setActivity } = useActivity();
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Tab") {
                e.preventDefault();
                setIsMenuOpen((prev) => !prev);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleCompile = async () => {
        setActivity("compiling");
        try {
            const today = new Date().toISOString().split("T")[0];
            const res = await fetch("/api/day/compile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date: today }),
            });
            const data = await res.json();
            if (data.compilation) {
                router.push("/compilations");
            }
        } catch (error) {
            console.error("Compile failed", error);
        } finally {
            setActivity("idle");
            setIsMenuOpen(false);
        }
    };

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-start backdrop-blur-sm bg-black/10 pointer-events-none">
                <div className="pointer-events-auto">
                    <Link href="/" className="flex flex-col group">
                        <h1 className="text-xl font-bold tracking-tighter text-white/90 group-hover:text-white transition-colors">Antinote</h1>
                        <span className="text-[10px] text-white/30 uppercase tracking-widest">Personal Workspace</span>
                    </Link>
                </div>

                <div className="flex items-center gap-4 pointer-events-auto">
                    <div className="relative">
                        <ActivityIndicator className="-inset-1.5" />
                        {!isMenuOpen && (
                            <motion.button
                                layoutId="action-menu-container"
                                onClick={() => setIsMenuOpen(true)}
                                className="relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group z-10"
                            >
                                <Menu className="w-4 h-4 text-white/60 group-hover:text-white" />
                                <span className="text-xs font-medium text-white/40 group-hover:text-white/60">Tab</span>
                            </motion.button>
                        )}
                    </div>

                    <SearchButton />
                    {/* History link moved to ActionMenu, but keeping it here for quick access if desired? 
                        User said "all entries like tasks, daily compilations it's side stuff that can be on other pages (also can be moved through action menu (tab))"
                        I'll remove History from here to clean up, as it's in ActionMenu.
                    */}


                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                        <div className="w-4 h-4 flex items-center justify-center">
                            <UserButton appearance={{
                                elements: {
                                    avatarBox: "w-4 h-4"
                                }
                            }} />
                        </div>
                        <span className="text-xs font-medium text-white/40 group-hover:text-white/60">Profile</span>
                    </div>
                </div>
            </header>

            <ActionMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onCompile={handleCompile}
                isCompiling={activity === "compiling"}
            />
        </>
    );
}

