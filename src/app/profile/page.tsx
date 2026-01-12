"use client";

import Navbar from "@/components/Navbar";
import ConnectTelegram from "@/components/ConnectTelegram";
import { UserButton, useUser } from "@clerk/nextjs";

export default function ProfilePage() {
    const { user } = useUser();

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white/20">
            <Navbar />

            <main className="pt-32 px-6 max-w-3xl mx-auto pb-20">
                <div className="flex flex-col gap-12">
                    {/* Header */}
                    <div className="flex items-center gap-6">
                        <div className="p-1 rounded-full bg-white/5 border border-white/10">
                            <UserButton
                                appearance={{
                                    elements: {
                                        avatarBox: "w-20 h-20"
                                    }
                                }}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl font-bold tracking-tight text-white">
                                {user?.fullName || user?.username || "User Profile"}
                            </h1>
                            <p className="text-white/40 text-sm">
                                Manage your account and integrations
                            </p>
                        </div>
                    </div>

                    {/* Integrations Section */}
                    <section className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2 border-b border-white/5 pb-4">
                            <h2 className="text-lg font-medium text-white/80">Integrations</h2>
                            <p className="text-sm text-white/40">Connect external services to enhance your workflow</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <ConnectTelegram />
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
