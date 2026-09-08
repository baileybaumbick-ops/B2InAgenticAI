-- Secure Networking Tracker: contacts schema + Row-Level Security
--
-- Prerequisites (must already be done on this Neon branch before running this file):
--   1. Managed Better Auth enabled (creates the neon_auth schema + users_sync table)
--   2. Neon Data API enabled with auth_provider "neon_auth"
--      (the Data API layer is what provides the auth.user_id() SQL function used below)
--
-- Run with: npm run db:migrate  (see backend/scripts/migrate.js), or paste into the
-- Neon SQL Editor / `neon run_sql_transaction`.

BEGIN;

-- Native enum: makes an invalid priority structurally impossible at the DB layer,
-- independent of and in addition to the Express-level validation.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_priority') THEN
    CREATE TYPE contact_priority AS ENUM ('high', 'medium', 'low');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.contacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  company      text,
  role         text,
  where_met    text,
  notes        text,
  priority     contact_priority NOT NULL DEFAULT 'medium',
  user_id      text NOT NULL DEFAULT auth.user_id(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contacts_name_not_blank CHECK (btrim(name) <> '')
);

CREATE INDEX IF NOT EXISTS contacts_user_id_idx ON public.contacts (user_id);

-- Keep updated_at accurate on every edit (used for "last updated" sort/display).
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contacts_set_updated_at ON public.contacts;
CREATE TRIGGER contacts_set_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Row-Level Security: every policy restricts access to rows owned by the caller.
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contacts_select_own ON public.contacts;
CREATE POLICY contacts_select_own ON public.contacts
  FOR SELECT TO authenticated
  USING (auth.user_id() = user_id);

DROP POLICY IF EXISTS contacts_insert_own ON public.contacts;
CREATE POLICY contacts_insert_own ON public.contacts
  FOR INSERT TO authenticated
  WITH CHECK (auth.user_id() = user_id);

DROP POLICY IF EXISTS contacts_update_own ON public.contacts;
CREATE POLICY contacts_update_own ON public.contacts
  FOR UPDATE TO authenticated
  USING (auth.user_id() = user_id)
  WITH CHECK (auth.user_id() = user_id); -- blocks reassigning a row to another user

DROP POLICY IF EXISTS contacts_delete_own ON public.contacts;
CREATE POLICY contacts_delete_own ON public.contacts
  FOR DELETE TO authenticated
  USING (auth.user_id() = user_id);

-- Table privileges for the Data API's JWT-authenticated role (separate layer from RLS).
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;

COMMIT;
