-- Run in Supabase SQL Editor before deploying the hardened API routes.
-- Service role is used only by server-side API code. Never expose it as NEXT_PUBLIC_*.
DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('mod_keys','roblox_keys','transactions','mod_configs','downloads')
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p.tablename); END LOOP;
END $$;

ALTER TABLE public.mod_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roblox_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mod_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.mod_keys, public.roblox_keys, public.transactions, public.mod_configs, public.downloads FROM anon, authenticated;
GRANT ALL ON public.mod_keys, public.roblox_keys, public.transactions, public.mod_configs, public.downloads TO service_role;

CREATE POLICY "Server service role only mod_keys" ON public.mod_keys FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Server service role only roblox_keys" ON public.roblox_keys FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Server service role only transactions" ON public.transactions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Server service role only mod_configs" ON public.mod_configs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Server service role only downloads" ON public.downloads FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Only intentionally public, active configuration data is readable from browsers.
GRANT SELECT ON public.mod_configs TO anon, authenticated;
CREATE POLICY "Public reads active config only" ON public.mod_configs FOR SELECT TO anon, authenticated USING (is_active = true);
