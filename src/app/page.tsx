import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { entries } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { StructuredData } from "@/lib/services/types";
import LandingPage from "@/components/home/LandingPage";
import Dashboard from "@/components/home/Dashboard";

export default async function Home() {
  const { userId } = await auth();
  const user = await currentUser();

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

    return <Dashboard user={user} userEntries={userEntries} />;
  }

  return <LandingPage />;
}
