-- Digital tool catalog. Apply once in the Supabase SQL editor.
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  demo_url TEXT,
  download_url TEXT NOT NULL,
  price_vnd INTEGER NOT NULL CHECK (price_vnd >= 0),
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.products FROM anon, authenticated;
GRANT ALL ON public.products TO service_role;
DROP POLICY IF EXISTS "Server manages products" ON public.products;
CREATE POLICY "Server manages products" ON public.products FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS products_active_created_idx ON public.products(is_active, created_at DESC);
