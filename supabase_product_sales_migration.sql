-- Track completed product purchases, not download clicks. Run once in Supabase SQL Editor.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sales_count bigint NOT NULL DEFAULT 0 CHECK (sales_count >= 0);

-- Backfill historical successful product and product-key purchases. Safe to rerun.
UPDATE public.products AS product
SET sales_count = (
  SELECT count(*)::bigint
  FROM public.transactions AS transaction_row
  WHERE transaction_row.status = 'success'
    AND transaction_row.metadata->>'type' IN ('product', 'key')
    AND transaction_row.metadata->>'product_id' = product.id::text
);

CREATE OR REPLACE FUNCTION public.track_product_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  was_already_successful boolean := false;
  product_id text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    was_already_successful := OLD.status = 'success';
  END IF;

  IF NEW.status <> 'success'
     OR was_already_successful
     OR NEW.metadata->>'type' NOT IN ('product', 'key') THEN
    RETURN NEW;
  END IF;

  product_id := NEW.metadata->>'product_id';
  IF product_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    UPDATE public.products
    SET sales_count = sales_count + 1
    WHERE id = product_id::uuid;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS transactions_track_product_sale ON public.transactions;
CREATE TRIGGER transactions_track_product_sale
AFTER INSERT OR UPDATE OF status, metadata ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.track_product_sale();
