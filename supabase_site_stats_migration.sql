-- Run once in the Supabase SQL Editor to enable the footer visit counters.
CREATE TABLE IF NOT EXISTS public.site_visit_sessions (
  visitor_id uuid PRIMARY KEY,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_visit_sessions_last_seen_idx
  ON public.site_visit_sessions (last_seen_at);

ALTER TABLE public.site_visit_sessions ENABLE ROW LEVEL SECURITY;

-- Keep the lifetime total separate from the short-lived online sessions.
CREATE TABLE IF NOT EXISTS public.site_visit_totals (
  id smallint PRIMARY KEY CHECK (id = 1),
  total_visits bigint NOT NULL DEFAULT 0
);

INSERT INTO public.site_visit_totals (id, total_visits)
SELECT 1, count(*)
FROM public.site_visit_sessions
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.site_visit_totals ENABLE ROW LEVEL SECURITY;

-- Atomically refresh a session and increment the lifetime total only for a new ID.
CREATE OR REPLACE FUNCTION public.record_site_visit(p_visitor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  inserted_rows integer;
BEGIN
  INSERT INTO public.site_visit_sessions (visitor_id, last_seen_at)
  VALUES (p_visitor_id, now())
  ON CONFLICT (visitor_id) DO NOTHING;

  GET DIAGNOSTICS inserted_rows = ROW_COUNT;

  IF inserted_rows = 1 THEN
    INSERT INTO public.site_visit_totals (id, total_visits)
    VALUES (1, 1)
    ON CONFLICT (id) DO UPDATE
      SET total_visits = public.site_visit_totals.total_visits + 1;
  ELSE
    UPDATE public.site_visit_sessions
    SET last_seen_at = now()
    WHERE visitor_id = p_visitor_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.record_site_visit(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_site_visit(uuid) TO service_role;

-- The application reads and updates this table only with the server service key.
-- No public policies are added.
