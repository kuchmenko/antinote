CREATE TABLE IF NOT EXISTS loops (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    source_entry_id uuid NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('task', 'question', 'worry', 'plan')),
    content text NOT NULL,
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'snoozed')),
    due_at timestamp,
    snoozed_until timestamp,
    created_at timestamp NOT NULL DEFAULT now(),
    done_at timestamp,
    meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS loops_user_id_idx ON loops(user_id);
CREATE INDEX IF NOT EXISTS loops_source_entry_id_idx ON loops(source_entry_id);
CREATE INDEX IF NOT EXISTS loops_status_idx ON loops(status);
CREATE INDEX IF NOT EXISTS loops_type_idx ON loops(type);
CREATE INDEX IF NOT EXISTS loops_created_at_idx ON loops(created_at);
CREATE INDEX IF NOT EXISTS loops_user_status_snoozed_idx ON loops(user_id, status, snoozed_until);
