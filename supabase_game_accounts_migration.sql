-- Game account listings and mystery inventory. Apply once to an existing project.
BEGIN;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_category_check CHECK (category IN ('tool','key','coiz','game_account')),
  ADD COLUMN IF NOT EXISTS account_sale_mode text,
  ADD COLUMN IF NOT EXISTS account_screenshots text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_account_sale_mode_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_account_sale_mode_check CHECK (
    (category = 'game_account' AND account_sale_mode IN ('single','mystery'))
    OR (category <> 'game_account' AND account_sale_mode IS NULL)
  );

CREATE TABLE IF NOT EXISTS public.product_game_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  inventory_type text NOT NULL CHECK (inventory_type IN ('single','mystery')),
  username text NOT NULL CHECK (char_length(username) BETWEEN 1 AND 240),
  password text NOT NULL CHECK (char_length(password) BETWEEN 1 AND 500),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','reserved','sold')),
  transaction_id uuid,
  sold_to text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reserved_at timestamptz,
  sold_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS product_game_accounts_single_product_idx
  ON public.product_game_accounts(product_id) WHERE inventory_type = 'single';
CREATE UNIQUE INDEX IF NOT EXISTS product_game_accounts_unique_username_idx
  ON public.product_game_accounts(product_id, inventory_type, lower(username));
CREATE INDEX IF NOT EXISTS product_game_accounts_available_idx
  ON public.product_game_accounts(product_id, inventory_type, created_at)
  WHERE status = 'available';
CREATE INDEX IF NOT EXISTS product_game_accounts_transaction_idx
  ON public.product_game_accounts(transaction_id) WHERE transaction_id IS NOT NULL;

ALTER TABLE public.product_game_accounts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.product_game_accounts FROM anon, authenticated;
GRANT ALL ON public.product_game_accounts TO service_role;
DROP POLICY IF EXISTS product_game_accounts_service_role_all ON public.product_game_accounts;
CREATE POLICY product_game_accounts_service_role_all ON public.product_game_accounts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public screenshots contain account previews only, never login credentials.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('game-account-screenshots', 'game-account-screenshots', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.sync_game_account_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  affected_product_id uuid;
BEGIN
  affected_product_id := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE public.products AS product
  SET stock_count = (
    SELECT count(*)::integer FROM public.product_game_accounts AS account
    WHERE account.product_id = affected_product_id AND account.status = 'available'
  ), updated_at = now()
  WHERE product.id = affected_product_id AND product.category = 'game_account';
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS product_game_accounts_sync_stock ON public.product_game_accounts;
CREATE TRIGGER product_game_accounts_sync_stock
AFTER INSERT OR UPDATE OF status OR DELETE ON public.product_game_accounts
FOR EACH ROW EXECUTE FUNCTION public.sync_game_account_stock();

-- Reserve inventory when a pending checkout is created, deliver credentials only on success.
CREATE OR REPLACE FUNCTION public.reserve_and_deliver_game_account()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  product_id_text text;
  product_uuid uuid;
  sale_mode text;
  account_row public.product_game_accounts%ROWTYPE;
  account_id_text text;
  should_deliver boolean := false;
BEGIN
  IF NEW.metadata->>'type' IS DISTINCT FROM 'game_account'
     OR NEW.status NOT IN ('pending','success')
     OR (TG_OP = 'UPDATE' AND OLD.status = 'success') THEN
    RETURN NEW;
  END IF;

  product_id_text := NEW.metadata->>'product_id';
  IF product_id_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'invalid_game_account_product';
  END IF;
  product_uuid := product_id_text::uuid;

  SELECT product.account_sale_mode INTO sale_mode
  FROM public.products AS product
  WHERE product.id = product_uuid AND product.category = 'game_account' AND product.is_active;
  IF sale_mode IS NULL THEN RAISE EXCEPTION 'game_account_unavailable'; END IF;

  account_id_text := NEW.metadata->>'reserved_game_account_id';
  IF account_id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT * INTO account_row FROM public.product_game_accounts AS account
    WHERE account.id = account_id_text::uuid AND account.product_id = product_uuid
      AND account.inventory_type = sale_mode AND account.status = 'reserved'
      AND account.transaction_id = NEW.id
    FOR UPDATE;
  END IF;

  IF account_row.id IS NULL THEN
    SELECT * INTO account_row FROM public.product_game_accounts AS account
    WHERE account.product_id = product_uuid AND account.inventory_type = sale_mode AND account.status = 'available'
    ORDER BY CASE WHEN sale_mode = 'mystery' THEN random() ELSE 0 END, account.created_at
    LIMIT 1 FOR UPDATE SKIP LOCKED;
    IF account_row.id IS NULL THEN RAISE EXCEPTION 'game_account_out_of_stock'; END IF;

    UPDATE public.product_game_accounts
    SET status = CASE WHEN NEW.status = 'success' THEN 'sold' ELSE 'reserved' END,
        transaction_id = NEW.id,
        sold_to = CASE WHEN NEW.status = 'success' THEN NEW.user_id ELSE NULL END,
        reserved_at = CASE WHEN NEW.status = 'pending' THEN now() ELSE NULL END,
        sold_at = CASE WHEN NEW.status = 'success' THEN now() ELSE NULL END
    WHERE id = account_row.id
    RETURNING * INTO account_row;
  ELSIF NEW.status = 'success' THEN
    UPDATE public.product_game_accounts
    SET status = 'sold', sold_to = NEW.user_id, sold_at = now(), reserved_at = NULL
    WHERE id = account_row.id
    RETURNING * INTO account_row;
  END IF;

  NEW.metadata := NEW.metadata || jsonb_build_object('reserved_game_account_id', account_row.id);
  IF NEW.status = 'success' THEN
    NEW.metadata := NEW.metadata || jsonb_build_object(
      'game_account_delivery', jsonb_build_object(
        'username', account_row.username,
        'password', account_row.password,
        'delivered_at', now()
      )
    );
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS transactions_reserve_game_account ON public.transactions;
CREATE TRIGGER transactions_reserve_game_account
BEFORE INSERT OR UPDATE OF status, metadata ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.reserve_and_deliver_game_account();

CREATE OR REPLACE FUNCTION public.release_game_account_reservation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF OLD.status IN ('pending','expired') AND NEW.status IN ('failed','late_payment','ignored_code_not_found') THEN
    UPDATE public.product_game_accounts
    SET status = 'available', transaction_id = NULL, reserved_at = NULL
    WHERE transaction_id = NEW.id AND status = 'reserved';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS transactions_release_game_account ON public.transactions;
CREATE TRIGGER transactions_release_game_account
AFTER UPDATE OF status ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.release_game_account_reservation();

CREATE OR REPLACE FUNCTION public.release_deleted_game_account_reservation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF OLD.status <> 'success' THEN
    UPDATE public.product_game_accounts
    SET status = 'available', transaction_id = NULL, reserved_at = NULL
    WHERE transaction_id = OLD.id AND status = 'reserved';
  END IF;
  RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS transactions_release_deleted_game_account ON public.transactions;
CREATE TRIGGER transactions_release_deleted_game_account
AFTER DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.release_deleted_game_account_reservation();

CREATE OR REPLACE FUNCTION public.track_product_sale()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE was_already_successful boolean := false; product_id text;
BEGIN
  IF TG_OP = 'UPDATE' THEN was_already_successful := OLD.status = 'success'; END IF;
  IF NEW.status <> 'success' OR was_already_successful OR NEW.metadata->>'type' NOT IN ('product','key','game_account') THEN RETURN NEW; END IF;
  product_id := NEW.metadata->>'product_id';
  IF product_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    UPDATE public.products SET sales_count = sales_count + 1 WHERE id = product_id::uuid;
  END IF;
  RETURN NEW;
END;
$$;

-- Wallet purchases use the same one-time/repeat-purchase rules as the API.
CREATE OR REPLACE FUNCTION public.purchase_product_with_wallet(p_user_id text, p_product_id uuid)
RETURNS TABLE(purchase_transaction_id uuid, remaining_balance bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE product_row public.products%ROWTYPE; wallet_balance bigint; new_transaction_id uuid; order_code text; purchase_metadata jsonb;
BEGIN
  SELECT * INTO product_row FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND OR NOT product_row.is_active THEN RAISE EXCEPTION 'product_unavailable'; END IF;
  IF product_row.category = 'coiz' OR product_row.price_vnd <= 0 THEN RAISE EXCEPTION 'product_not_payable_by_wallet'; END IF;
  IF product_row.stock_count = 0 THEN RAISE EXCEPTION 'product_out_of_stock'; END IF;
  IF product_row.category NOT IN ('key','game_account') AND EXISTS (
    SELECT 1 FROM public.transactions AS transaction_row
    WHERE transaction_row.user_id = p_user_id AND transaction_row.status = 'success'
      AND transaction_row.metadata->>'type' = 'product'
      AND transaction_row.metadata->>'product_id' = product_row.id::text
  ) THEN RAISE EXCEPTION 'product_already_purchased'; END IF;

  INSERT INTO public.wallet_accounts (user_id, balance) VALUES (p_user_id, 0) ON CONFLICT (user_id) DO NOTHING;
  SELECT account.balance INTO wallet_balance FROM public.wallet_accounts AS account WHERE account.user_id = p_user_id FOR UPDATE;
  IF wallet_balance < product_row.price_vnd THEN RAISE EXCEPTION 'wallet_balance_insufficient'; END IF;

  order_code := 'GZ' || upper(substr(replace(pg_catalog.gen_random_uuid()::text, '-', ''), 1, 10));
  IF product_row.category = 'key' THEN
    purchase_metadata := jsonb_build_object('type','key','category','mod','duration_days',product_row.key_duration_days,'product_id',product_row.id,'product_title',product_row.title,'payment_method','wallet');
  ELSIF product_row.category = 'game_account' THEN
    purchase_metadata := jsonb_build_object('type','game_account','product_id',product_row.id,'product_title',product_row.title,'account_sale_mode',product_row.account_sale_mode,'payment_method','wallet');
  ELSE
    purchase_metadata := jsonb_build_object('type','product','product_id',product_row.id,'product_title',product_row.title,'payment_method','wallet');
  END IF;
  INSERT INTO public.transactions(user_id,amount,description,status,method,rewarded,metadata)
  VALUES(p_user_id,product_row.price_vnd,order_code,'success','Wallet',true,purchase_metadata)
  RETURNING id INTO new_transaction_id;
  INSERT INTO public.wallet_ledger(user_id,transaction_id,entry_type,amount,description)
  VALUES(p_user_id,new_transaction_id,'purchase',product_row.price_vnd,product_row.title);
  UPDATE public.wallet_accounts SET balance=balance-product_row.price_vnd,updated_at=now() WHERE user_id=p_user_id;
  IF product_row.stock_count IS NOT NULL AND product_row.category <> 'game_account' THEN
    UPDATE public.products SET stock_count=stock_count-1,updated_at=now() WHERE id=product_row.id;
  END IF;
  RETURN QUERY SELECT new_transaction_id,wallet_balance-product_row.price_vnd;
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_product_with_wallet(text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_product_with_wallet(text,uuid) TO service_role;
REVOKE ALL ON FUNCTION public.reserve_and_deliver_game_account() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_game_account_stock() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_game_account_reservation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_deleted_game_account_reservation() FROM PUBLIC, anon, authenticated;

COMMIT;
