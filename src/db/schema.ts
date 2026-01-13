import { pgTable, uuid, text, jsonb, timestamp, customType, index, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Custom type for ULID (sortable string IDs)
// ULID is 26-char string like "01H2...3ZK" that's sortable by generation time
const ulid = customType<{
    data: string;
    driverData: string;
}>({
    dataType() {
        return "text";
    },
    toDriver(value: string): string {
        return value;
    },
    fromDriver(value: string): string {
        return value;
    },
});

// Custom type for pgvector (1536 dimensions)
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

// ============================================================================
// LEGACY TABLES (for backward compatibility during migration)
// ============================================================================

export const entries = pgTable("entries", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
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
    userId: text("user_id").notNull(),
    telegramChatId: text("telegram_chat_id").notNull().unique(),
    username: text("username"),
    firstName: text("first_name"),
    connectedAt: timestamp("connected_at").defaultNow().notNull(),
});

export const connectTokens = pgTable("connect_tokens", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const compilations = pgTable("compilations", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    date: text("date").notNull(),
    compiledAt: timestamp("compiled_at").defaultNow().notNull(),
    content: text("content").notNull(),
    relatedEntryIds: jsonb("related_entry_ids").notNull(),
}, (table) => [
    index("compilations_user_id_date_idx").on(table.userId, table.date),
]);

export const loops = pgTable("loops", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    sourceEntryId: uuid("source_entry_id").notNull().references(() => entries.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["task", "question", "worry", "plan"] }).notNull(),
    content: text("content").notNull(),
    status: text("status", { enum: ["open", "done", "snoozed"] }).notNull().default("open"),
    dueAt: timestamp("due_at"),
    snoozedUntil: timestamp("snoozed_until"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    doneAt: timestamp("done_at"),
    meta: jsonb("meta").notNull().default({}),
}, (table) => [
    index("loops_user_id_idx").on(table.userId),
    index("loops_source_entry_id_idx").on(table.sourceEntryId),
    index("loops_status_idx").on(table.status),
    index("loops_type_idx").on(table.type),
    index("loops_created_at_idx").on(table.createdAt),
    index("loops_user_status_snoozed_idx").on(table.userId, table.status, table.snoozedUntil),
]);

// ============================================================================
// PHASE 0 TABLES (new canonical data model)
// ============================================================================

export const sources = pgTable("sources", {
    id: ulid("id").primaryKey(),
    type: text("type", { enum: ["voice", "web_clip", "paste", "upload", "integration"] }).notNull(),
    storageKey: text("storage_key").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    userId: text("user_id").notNull(),
}, (table) => [
    index("sources_user_id_idx").on(table.userId),
    index("sources_type_idx").on(table.type),
    index("sources_created_at_idx").on(table.createdAt),
]);

export const moments = pgTable("moments", {
    id: ulid("id").primaryKey(),
    sourceId: ulid("source_id").notNull().references(() => sources.id, { onDelete: "cascade" }),
    startMs: integer("start_ms").notNull(),
    endMs: integer("end_ms").notNull(),
    transcriptText: text("transcript_text").notNull(),
    flags: jsonb("flags"), // highlight, speaker_diarized, etc.
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("moments_source_id_idx").on(table.sourceId),
]);

export const atoms = pgTable("atoms", {
    id: ulid("id").primaryKey(),
    type: text("type", { enum: ["decision", "action", "claim", "question", "insight", "risk"] }).notNull(),
    content: text("content").notNull(),
    provenance: jsonb("provenance").notNull(), // [{ moment_id, offset_ms, source_excerpt }]
    entityLinks: jsonb("entity_links").notNull().$type<string[]>(),
    threadLinks: jsonb("thread_links").notNull().$type<string[]>(),
    status: jsonb("status"), // per-type fields
    createdBy: text("created_by", { enum: ["ai", "manual"] }).notNull().default("ai"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    userId: text("user_id").notNull(),
    embedding: vector("embedding"),
}, (table) => [
    index("atoms_user_id_idx").on(table.userId),
    index("atoms_type_idx").on(table.type),
    index("atoms_thread_links_idx").on(table.threadLinks),
    index("atoms_created_at_idx").on(table.createdAt),
]);

export const entities = pgTable("entities", {
    id: ulid("id").primaryKey(),
    type: text("type", { enum: ["person", "org", "project", "tool", "topic", "custom"] }).notNull(),
    canonicalName: text("canonical_name").notNull(),
    aliases: jsonb("aliases").notNull().$type<string[]>(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    userId: text("user_id").notNull(),
}, (table) => [
    index("entities_user_id_idx").on(table.userId),
    index("entities_type_idx").on(table.type),
    index("entities_canonical_name_idx").on(table.canonicalName),
]);

export const threads = pgTable("threads", {
    id: ulid("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    defaultEntityIds: jsonb("default_entity_ids").notNull().$type<string[]>(),
    lastViewedAt: timestamp("last_viewed_at"),
    lastSnapshotId: ulid("last_snapshot_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    userId: text("user_id").notNull(),
}, (table) => [
    index("threads_user_id_idx").on(table.userId),
    index("threads_updated_at_idx").on(table.updatedAt),
]);

export const threadEvents = pgTable("thread_events", {
    id: ulid("id").primaryKey(),
    threadId: ulid("thread_id").notNull().references(() => threads.id, { onDelete: "cascade" }),
    eventType: text("event_type", {
        enum: ["atom_linked", "atom_updated", "task_state_changed", "snapshot_created", "contradiction_resolved"]
    }).notNull(),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("thread_events_thread_id_idx").on(table.threadId),
    index("thread_events_created_at_idx").on(table.createdAt),
]);

export const snapshots = pgTable("snapshots", {
    id: ulid("id").primaryKey(),
    threadId: ulid("thread_id").notNull().references(() => threads.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    summaryMd: text("summary_md").notNull(),
    citations: jsonb("citations").notNull().$type<string[]>(),
    createdBy: text("created_by", { enum: ["ai", "manual"] }).notNull().default("ai"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("snapshots_thread_id_idx").on(table.threadId),
    index("snapshots_version_idx").on(table.threadId, sql`version`),
]);

export const contradictions = pgTable("contradictions", {
    id: ulid("id").primaryKey(),
    threadId: ulid("thread_id").notNull().references(() => threads.id, { onDelete: "cascade" }),
    atomAId: ulid("atom_a_id").notNull().references(() => atoms.id, { onDelete: "cascade" }),
    atomBId: ulid("atom_b_id").notNull().references(() => atoms.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["direct", "scope", "time", "assumption"] }).notNull(),
    status: text("status", { enum: ["open", "resolved"] }).notNull().default("open"),
    resolutionNote: text("resolution_note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at"),
    userId: text("user_id").notNull(),
}, (table) => [
    index("contradictions_thread_id_idx").on(table.threadId),
    index("contradictions_status_idx").on(table.status),
    index("contradictions_atom_ids_idx").on(table.atomAId, table.atomBId),
]);

export const followups = pgTable("followups", {
    id: ulid("id").primaryKey(),
    type: text("type", { enum: ["task", "message_draft", "agenda"] }).notNull(),
    linkedAtomIds: jsonb("linked_atom_ids").notNull().$type<string[]>(),
    contentMd: text("content_md"),
    structuredJson: jsonb("structured_json"), // for tasks: { owner, due_date, dependencies }
    state: text("state", { enum: ["proposed", "accepted", "sent", "done"] }).notNull().default("proposed"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    userId: text("user_id").notNull(),
}, (table) => [
    index("followups_user_id_idx").on(table.userId),
    index("followups_state_idx").on(table.state),
    index("followups_type_idx").on(table.type),
]);

// ============================================================================
// TYPES
// ============================================================================

export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
export type TelegramUser = typeof telegramUsers.$inferSelect;
export type NewTelegramUser = typeof telegramUsers.$inferInsert;
export type ConnectToken = typeof connectTokens.$inferSelect;
export type NewConnectToken = typeof connectTokens.$inferInsert;
export type Compilation = typeof compilations.$inferSelect;
export type NewCompilation = typeof compilations.$inferInsert;

export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
export type Moment = typeof moments.$inferSelect;
export type NewMoment = typeof moments.$inferInsert;
export type Atom = typeof atoms.$inferSelect;
export type NewAtom = typeof atoms.$inferInsert;
export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;
export type Thread = typeof threads.$inferSelect;
export type NewThread = typeof threads.$inferInsert;
export type ThreadEvent = typeof threadEvents.$inferSelect;
export type NewThreadEvent = typeof threadEvents.$inferInsert;
export type Snapshot = typeof snapshots.$inferSelect;
export type NewSnapshot = typeof snapshots.$inferInsert;
export type Contradiction = typeof contradictions.$inferSelect;
export type NewContradiction = typeof contradictions.$inferInsert;
export type Followup = typeof followups.$inferSelect;
export type NewFollowup = typeof followups.$inferInsert;
