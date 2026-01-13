-- Phase 0: Foundation Migration
-- This migration adds the canonical data model tables for Momentum Brain.
-- Existing tables (entries, telegram_users, connect_tokens, compilations) are kept
-- for backward compatibility and will be phased out later.

-- Create sources table (where inputs come from)
CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('voice', 'web_clip', 'paste', 'upload', 'integration')),
    storage_key TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS sources_user_id_idx ON sources(user_id);
CREATE INDEX IF NOT EXISTS sources_type_idx ON sources(type);
CREATE INDEX IF NOT EXISTS sources_created_at_idx ON sources(created_at);

-- Create moments table (timestamped segments of sources)
CREATE TABLE IF NOT EXISTS moments (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    start_ms INTEGER NOT NULL,
    end_ms INTEGER NOT NULL,
    transcript_text TEXT NOT NULL,
    flags JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS moments_source_id_idx ON moments(source_id);

-- Create atoms table (smallest meaningful units)
CREATE TABLE IF NOT EXISTS atoms (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('decision', 'action', 'claim', 'question', 'insight', 'risk')),
    content TEXT NOT NULL,
    provenance JSONB NOT NULL, -- [{ moment_id, offset_ms, source_excerpt }]
    entity_links JSONB NOT NULL, -- array of entity IDs
    thread_links JSONB NOT NULL, -- array of thread IDs
    status JSONB, -- per-type fields
    created_by TEXT NOT NULL CHECK (created_by IN ('ai', 'manual')) DEFAULT 'ai',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id TEXT NOT NULL,
    embedding vector(1536)
);

CREATE INDEX IF NOT EXISTS atoms_user_id_idx ON atoms(user_id);
CREATE INDEX IF NOT EXISTS atoms_type_idx ON atoms(type);
CREATE INDEX IF NOT EXISTS atoms_thread_links_idx ON atoms USING GIN(thread_links);
CREATE INDEX IF NOT EXISTS atoms_created_at_idx ON atoms(created_at);

-- Create entities table (people, projects, orgs, etc.)
CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('person', 'org', 'project', 'tool', 'topic', 'custom')),
    canonical_name TEXT NOT NULL,
    aliases JSONB NOT NULL, -- array of strings
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS entities_user_id_idx ON entities(user_id);
CREATE INDEX IF NOT EXISTS entities_type_idx ON entities(type);
CREATE INDEX IF NOT EXISTS entities_canonical_name_idx ON entities(canonical_name);

-- Create threads table (project/topic timelines)
CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    default_entity_ids JSONB NOT NULL, -- array of entity IDs
    last_viewed_at TIMESTAMPTZ,
    last_snapshot_id TEXT REFERENCES snapshots(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS threads_user_id_idx ON threads(user_id);
CREATE INDEX IF NOT EXISTS threads_default_entity_ids_idx ON threads USING GIN(default_entity_ids);
CREATE INDEX IF NOT EXISTS threads_updated_at_idx ON threads(updated_at);

-- Create thread_events table (event-sourcing light)
CREATE TABLE IF NOT EXISTS thread_events (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('atom_linked', 'atom_updated', 'task_state_changed', 'snapshot_created', 'contradiction_resolved')),
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS thread_events_thread_id_idx ON thread_events(thread_id);
CREATE INDEX IF NOT EXISTS thread_events_created_at_idx ON thread_events(created_at);

-- Create snapshots table (versioned thread states)
CREATE TABLE IF NOT EXISTS snapshots (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    summary_md TEXT NOT NULL,
    citations JSONB NOT NULL, -- array of atom IDs
    created_by TEXT NOT NULL CHECK (created_by IN ('ai', 'manual')) DEFAULT 'ai',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS snapshots_thread_id_idx ON snapshots(thread_id);
CREATE INDEX IF NOT EXISTS snapshots_version_idx ON snapshots(thread_id, version);

-- Create contradictions table
CREATE TABLE IF NOT EXISTS contradictions (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    atom_a_id TEXT NOT NULL REFERENCES atoms(id) ON DELETE CASCADE,
    atom_b_id TEXT NOT NULL REFERENCES atoms(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('direct', 'scope', 'time', 'assumption')),
    status TEXT NOT NULL CHECK (status IN ('open', 'resolved')) DEFAULT 'open',
    resolution_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    user_id TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS contradictions_thread_id_idx ON contradictions(thread_id);
CREATE INDEX IF NOT EXISTS contradictions_status_idx ON contradictions(status);
CREATE INDEX IF NOT EXISTS contradictions_atom_ids_idx ON contradictions(atom_a_id, atom_b_id);

-- Create followups table (tasks, message drafts, agendas)
CREATE TABLE IF NOT EXISTS followups (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('task', 'message_draft', 'agenda')),
    linked_atom_ids JSONB NOT NULL, -- array of atom IDs
    content_md TEXT,
    structured_json JSONB, -- for tasks: { owner, due_date, dependencies }
    state TEXT NOT NULL CHECK (state IN ('proposed', 'accepted', 'sent', 'done')) DEFAULT 'proposed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS followups_user_id_idx ON followups(user_id);
CREATE INDEX IF NOT EXISTS followups_state_idx ON followups(state);
CREATE INDEX IF NOT EXISTS followups_type_idx ON followups(type);
