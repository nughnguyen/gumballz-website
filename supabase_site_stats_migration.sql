-- Run once in the Supabase SQL Editor to enable the footer visit counters.
CREATE TABLE IF NOT EXISTS public.site_visit_sessions (
  visitor_id uuid PRIMARY KEY,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_visit_sessions_last_seen_idx
  ON public.site_visit_sessions (last_seen_at);

ALTER TABLE public.site_visit_sessions ENABLE ROW LEVEL SECURITY;

-- The application reads and updates this table only with the server service key.
-- No public policies are added.
