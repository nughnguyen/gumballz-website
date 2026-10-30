-- Shared API rate limits for an existing GumballZ Hub database.
-- Safe to re-run; stores keyed IP hashes only and does not delete application data.
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  bucket_key text PRIMARY KEY CHECK (bucket_key ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz NOT NULL,
  hits integer NOT NULL CHECK (hits > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS api_rate_limits_window_idx ON public.api_rate_limits (window_started_at);

CREATE OR REPLACE FUNCTION public.consume_api_rate_limit(
  p_bucket_key text,
  p_window_start timestamptz,
  p_limit integer
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  was_allowed boolean;
BEGIN
  IF p_limit < 1 OR p_bucket_key !~ '^[a-f0-9]{64}$' THEN RETURN false; END IF;
  INSERT INTO public.api_rate_limits (bucket_key, window_started_at, hits)
  VALUES (p_bucket_key, p_window_start, 1)
  ON CONFLICT (bucket_key) DO UPDATE
  SET window_started_at = CASE
        WHEN public.api_rate_limits.window_started_at < EXCLUDED.window_started_at THEN EXCLUDED.window_started_at
        ELSE public.api_rate_limits.window_started_at END,
      hits = CASE
        WHEN public.api_rate_limits.window_started_at < EXCLUDED.window_started_at THEN 1
        ELSE public.api_rate_limits.hits + 1 END,
      updated_at = now()
  WHERE public.api_rate_limits.window_started_at < EXCLUDED.window_started_at
     OR public.api_rate_limits.hits < p_limit
  RETURNING true INTO was_allowed;
  RETURN COALESCE(was_allowed, false);
END;
$$;

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.api_rate_limits FROM anon, authenticated;
GRANT ALL ON public.api_rate_limits TO service_role;
REVOKE ALL ON FUNCTION public.consume_api_rate_limit(text, timestamptz, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_api_rate_limit(text, timestamptz, integer) TO service_role;
DROP POLICY IF EXISTS api_rate_limits_service_role_all ON public.api_rate_limits;
CREATE POLICY api_rate_limits_service_role_all ON public.api_rate_limits FOR ALL TO service_role USING (true) WITH CHECK (true);
