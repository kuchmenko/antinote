import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const entries = pgTable("entries", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(), // Clerk ID
    rawAudioUrl: text("raw_audio_url"),
    transcript: text("transcript").notNull(),
    structuredData: jsonb("structured_data").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
