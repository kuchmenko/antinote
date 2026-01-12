import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { entries } from "@/db/schema";
import { desc, eq, gt, and } from "drizzle-orm";
import { StructuredData } from "@/lib/services/types";
import LandingPage from "@/components/home/LandingPage";
import Dashboard from "@/components/home/Dashboard";

export default async function Home() {
  const { userId } = await auth();
  const user = await currentUser();

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
          gt(entries.createdAt, twentyFourHoursAgo)
        )
      )
      .orderBy(desc(entries.createdAt));

    userEntries = data.map(entry => ({
      id: entry.id,
      createdAt: entry.createdAt,
      structured: entry.structuredData as unknown as StructuredData,
    }));

    return <Dashboard user={user} userEntries={userEntries} />;
  }

  return <LandingPage />;
}
