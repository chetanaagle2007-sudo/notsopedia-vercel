-- AI Workspace 2.0 — Supabase Migration
-- Tables: workspace_conversations, workspace_messages
-- Apply in: Supabase Dashboard → SQL Editor → New query → Paste → Run
-- Safe: uses IF NOT EXISTS and idempotent policy creation

-- ─── Conversations Table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workspace_conversations (
  id           TEXT        PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL DEFAULT 'New conversation',
  project_id   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for listing a user's conversations sorted by most recent
CREATE INDEX IF NOT EXISTS idx_workspace_conversations_user_updated
  ON workspace_conversations (user_id, updated_at DESC);

-- ─── Messages Table ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workspace_messages (
  id               TEXT        PRIMARY KEY,
  conversation_id  TEXT        NOT NULL REFERENCES workspace_conversations(id) ON DELETE CASCADE,
  role             TEXT        NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content          TEXT        NOT NULL,
  attachments      JSONB       DEFAULT '[]'::jsonb,
  is_error         BOOLEAN     NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for loading messages in a conversation in chronological order
CREATE INDEX IF NOT EXISTS idx_workspace_messages_conv_created
  ON workspace_messages (conversation_id, created_at ASC);

-- ─── Auto-update updated_at Trigger ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION workspace_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_workspace_conversations_updated_at ON workspace_conversations;
CREATE TRIGGER trg_workspace_conversations_updated_at
  BEFORE UPDATE ON workspace_conversations
  FOR EACH ROW
  EXECUTE FUNCTION workspace_update_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE workspace_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_messages       ENABLE ROW LEVEL SECURITY;

-- Conversations: users can only access their own
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workspace_conversations_owner_select' AND tablename = 'workspace_conversations') THEN
    CREATE POLICY "workspace_conversations_owner_select" ON workspace_conversations
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workspace_conversations_owner_insert' AND tablename = 'workspace_conversations') THEN
    CREATE POLICY "workspace_conversations_owner_insert" ON workspace_conversations
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workspace_conversations_owner_update' AND tablename = 'workspace_conversations') THEN
    CREATE POLICY "workspace_conversations_owner_update" ON workspace_conversations
      FOR UPDATE USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workspace_conversations_owner_delete' AND tablename = 'workspace_conversations') THEN
    CREATE POLICY "workspace_conversations_owner_delete" ON workspace_conversations
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Messages: users can only access messages in their own conversations
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workspace_messages_owner_select' AND tablename = 'workspace_messages') THEN
    CREATE POLICY "workspace_messages_owner_select" ON workspace_messages
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM workspace_conversations wc
          WHERE wc.id = workspace_messages.conversation_id
            AND wc.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workspace_messages_owner_insert' AND tablename = 'workspace_messages') THEN
    CREATE POLICY "workspace_messages_owner_insert" ON workspace_messages
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM workspace_conversations wc
          WHERE wc.id = workspace_messages.conversation_id
            AND wc.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workspace_messages_owner_update' AND tablename = 'workspace_messages') THEN
    CREATE POLICY "workspace_messages_owner_update" ON workspace_messages
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM workspace_conversations wc
          WHERE wc.id = workspace_messages.conversation_id
            AND wc.user_id = auth.uid()
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM workspace_conversations wc
          WHERE wc.id = workspace_messages.conversation_id
            AND wc.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workspace_messages_owner_delete' AND tablename = 'workspace_messages') THEN
    CREATE POLICY "workspace_messages_owner_delete" ON workspace_messages
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM workspace_conversations wc
          WHERE wc.id = workspace_messages.conversation_id
            AND wc.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ─── Grant to authenticated role ──────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON workspace_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON workspace_messages       TO authenticated;

-- ─── Verification Queries (run after migration to confirm) ────────────────────
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename LIKE 'workspace_%';
-- SELECT * FROM information_schema.tables WHERE table_name LIKE 'workspace_%';
