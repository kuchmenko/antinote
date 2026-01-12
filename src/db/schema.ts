import { pgTable, uuid, text, jsonb, timestamp, customType, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Custom type for pgvector
const vector = customType<{ data: number[]; driverData: string }>({
    dataType() {
        return "vector(1536)";
    },
    toDriver(value: number[]): string {
        return `[${value.join(",")}]`;
    },
    fromDriver(value: string): number[] {
        return JSON.parse(value.replace(/^\[/, "[").replace(/\]$/, "]"));
    },
});

export const entries = pgTable("entries", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(), // Clerk ID
    rawAudioUrl: text("raw_audio_url"),
    transcript: text("transcript").notNull(),
    structuredData: jsonb("structured_data").notNull(),
    embedding: vector("embedding"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("entries_user_id_idx").on(table.userId),
]);

export const telegramUsers = pgTable("telegram_users", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(), // Clerk ID
    telegramChatId: text("telegram_chat_id").notNull().unique(),
    username: text("username"),
    firstName: text("first_name"),
    connectedAt: timestamp("connected_at").defaultNow().notNull(),
});

export const connectTokens = pgTable("connect_tokens", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(), // Clerk ID
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const compilations = pgTable("compilations", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(), // Clerk ID
    date: text("date").notNull(), // YYYY-MM-DD
    compiledAt: timestamp("compiled_at").defaultNow().notNull(),
    content: text("content").notNull(), // Markdown summary
    relatedEntryIds: jsonb("related_entry_ids").notNull(), // Array of UUIDs
}, (table) => [
    index("compilations_user_id_date_idx").on(table.userId, table.date),
]);

export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
export type TelegramUser = typeof telegramUsers.$inferSelect;
export type NewTelegramUser = typeof telegramUsers.$inferInsert;
export type ConnectToken = typeof connectTokens.$inferSelect;
export type NewConnectToken = typeof connectTokens.$inferInsert;
export type Compilation = typeof compilations.$inferSelect;
export type NewCompilation = typeof compilations.$inferInsert;
