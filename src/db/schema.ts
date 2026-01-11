import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const entries = pgTable("entries", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(), // Clerk ID
    rawAudioUrl: text("raw_audio_url"),
    transcript: text("transcript").notNull(),
    structuredData: jsonb("structured_data").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
export type TelegramUser = typeof telegramUsers.$inferSelect;
export type NewTelegramUser = typeof telegramUsers.$inferInsert;
export type ConnectToken = typeof connectTokens.$inferSelect;
export type NewConnectToken = typeof connectTokens.$inferInsert;
