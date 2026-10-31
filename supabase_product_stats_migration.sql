-- Product detail metrics. Run once in the Supabase SQL editor.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS view_count bigint NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  ADD COLUMN IF NOT EXISTS download_count bigint NOT NULL DEFAULT 0 CHECK (download_count >= 0);

CREATE OR REPLACE FUNCTION public.increment_product_view(p_product_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  UPDATE public.products SET view_count = view_count + 1 WHERE id = p_product_id AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.increment_product_download(p_product_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  UPDATE public.products SET download_count = download_count + 1 WHERE id = p_product_id;
$$;

REVOKE ALL ON FUNCTION public.increment_product_view(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_product_download(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_product_view(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_product_download(uuid) TO service_role;
