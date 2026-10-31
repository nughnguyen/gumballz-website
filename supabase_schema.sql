-- GumballZ Hub: clean-install schema for a new empty Supabase project.
-- Run this file once in Supabase SQL Editor after removing old project tables.
-- This file contains no DROP statements and never removes existing data.
-- Keep SUPABASE_SERVICE_KEY / SUPABASE_SERVICE_ROLE_KEY on the server only.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Orders include guest bank transfers, Minecraft plugin orders and account purchases.
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  amount integer NOT NULL CHECK (amount >= 0),
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed','expired','late_payment','ignored_code_not_found')),
  method text,
  transaction_id text,
  rewarded boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS transactions_description_idx ON public.transactions (description);
CREATE INDEX IF NOT EXISTS transactions_status_created_idx ON public.transactions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS transactions_provider_id_idx ON public.transactions (transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS transactions_user_created_idx ON public.transactions (user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS transactions_metadata_type_idx ON public.transactions ((metadata->>'type'));

-- Stable SePay event IDs make webhook retries and concurrent deliveries idempotent.
CREATE TABLE IF NOT EXISTS public.sepay_webhook_events (
  event_id text PRIMARY KEY,
  status text NOT NULL CHECK (status IN ('processing','processed')),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Per-user wallet balance and auditable top-up ledger.
CREATE TABLE IF NOT EXISTS public.wallet_accounts (
  user_id text PRIMARY KEY,
  balance bigint NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.wallet_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.wallet_accounts(user_id),
  transaction_id uuid NOT NULL UNIQUE REFERENCES public.transactions(id),
  entry_type text NOT NULL CHECK (entry_type IN ('topup','purchase','refund','adjustment')),
  amount bigint NOT NULL CHECK (amount > 0),
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wallet_ledger_user_created_idx ON public.wallet_ledger (user_id, created_at DESC);

-- Shared persistent rate-limit buckets for public and account APIs.
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
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  was_allowed boolean;
BEGIN
  IF p_limit < 1 OR p_bucket_key !~ '^[a-f0-9]{64}$' THEN
    RETURN false;
  END IF;

  INSERT INTO public.api_rate_limits (bucket_key, window_started_at, hits)
  VALUES (p_bucket_key, p_window_start, 1)
  ON CONFLICT (bucket_key) DO UPDATE
  SET window_started_at = CASE
        WHEN public.api_rate_limits.window_started_at < EXCLUDED.window_started_at THEN EXCLUDED.window_started_at
        ELSE public.api_rate_limits.window_started_at
      END,
      hits = CASE
        WHEN public.api_rate_limits.window_started_at < EXCLUDED.window_started_at THEN 1
        ELSE public.api_rate_limits.hits + 1
      END,
      updated_at = now()
  WHERE public.api_rate_limits.window_started_at < EXCLUDED.window_started_at
     OR public.api_rate_limits.hits < p_limit
  RETURNING true INTO was_allowed;

  RETURN COALESCE(was_allowed, false);
END;
$$;

-- Credit wallet top-ups once, only after a pending transaction becomes successful.
CREATE OR REPLACE FUNCTION public.credit_wallet_topup()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  inserted_rows integer;
BEGIN
  IF NEW.status = 'success'
     AND OLD.status IS DISTINCT FROM 'success'
     AND NEW.metadata->>'type' = 'wallet_topup'
     AND NEW.user_id IS NOT NULL
     AND NEW.amount > 0 THEN
    INSERT INTO public.wallet_accounts (user_id, balance)
    VALUES (NEW.user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.wallet_ledger (user_id, transaction_id, entry_type, amount, description)
    VALUES (NEW.user_id, NEW.id, 'topup', NEW.amount, NEW.description)
    ON CONFLICT (transaction_id) DO NOTHING;
    GET DIAGNOSTICS inserted_rows = ROW_COUNT;

    IF inserted_rows = 1 THEN
      INSERT INTO public.wallet_accounts (user_id, balance)
      VALUES (NEW.user_id, NEW.amount)
      ON CONFLICT (user_id) DO UPDATE
      SET balance = public.wallet_accounts.balance + EXCLUDED.balance,
          updated_at = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Mod Menu license keys and device bindings.
CREATE TABLE IF NOT EXISTS public.mod_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_value text NOT NULL UNIQUE,
  key_type text NOT NULL CHECK (upper(key_type) IN ('FREE','PREMIUM')),
  created_date date,
  duration_days integer CHECK (duration_days IS NULL OR duration_days > 0),
  expires_at timestamptz NOT NULL,
  price_vnd integer CHECK (price_vnd IS NULL OR price_vnd >= 0),
  short_link text,
  destination_url text,
  is_active boolean NOT NULL DEFAULT false,
  usage_count integer NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  last_used_at timestamptz,
  last_verified_at timestamptz,
  device_id text,
  device_bound_at timestamptz,
  max_devices integer NOT NULL DEFAULT 1 CHECK (max_devices BETWEEN 1 AND 20),
  verification_token text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mod_keys_type_created_date_idx ON public.mod_keys (key_type, created_date);
CREATE INDEX IF NOT EXISTS mod_keys_active_expiry_idx ON public.mod_keys (is_active, expires_at);
CREATE INDEX IF NOT EXISTS mod_keys_device_idx ON public.mod_keys (device_id) WHERE device_id IS NOT NULL;

-- Roblox keys keep provider and HWID state in metadata for backwards compatibility.
CREATE TABLE IF NOT EXISTS public.roblox_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_value text NOT NULL UNIQUE,
  key_type text NOT NULL CHECK (lower(key_type) IN ('free','premium')),
  category text NOT NULL DEFAULT 'roblox',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_used boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object')
);
CREATE INDEX IF NOT EXISTS roblox_keys_expiry_idx ON public.roblox_keys (expires_at);

-- Downloadable tool, license-key offer, or Coiz listing. NULL stock_count means unlimited.
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category text NOT NULL DEFAULT 'tool' CHECK (category IN ('tool','key','coiz')),
  description text NOT NULL DEFAULT '',
  cover_image_url text,
  demo_url text,
  download_url text,
  price_vnd integer NOT NULL DEFAULT 0 CHECK (price_vnd >= 0),
  key_duration_days integer CHECK (key_duration_days IS NULL OR key_duration_days > 0),
  stock_count integer CHECK (stock_count IS NULL OR stock_count >= 0),
  tags text[] NOT NULL DEFAULT '{}',
  highlights jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(highlights) = 'array'),
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  view_count bigint NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  download_count bigint NOT NULL DEFAULT 0 CHECK (download_count >= 0),
  sales_count bigint NOT NULL DEFAULT 0 CHECK (sales_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (category <> 'key' OR key_duration_days IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS products_catalog_idx ON public.products (is_active, category, created_at DESC);
CREATE INDEX IF NOT EXISTS products_featured_idx ON public.products (is_active, is_featured DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS products_tags_idx ON public.products USING gin (tags);

CREATE OR REPLACE FUNCTION public.track_product_sale()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  was_already_successful boolean := false;
  product_id text;
BEGIN
  IF TG_OP = 'UPDATE' THEN was_already_successful := OLD.status = 'success'; END IF;
  IF NEW.status <> 'success' OR was_already_successful OR NEW.metadata->>'type' NOT IN ('product', 'key') THEN RETURN NEW; END IF;
  product_id := NEW.metadata->>'product_id';
  IF product_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    UPDATE public.products SET sales_count = sales_count + 1 WHERE id = product_id::uuid;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS transactions_track_product_sale ON public.transactions;
CREATE TRIGGER transactions_track_product_sale AFTER INSERT OR UPDATE OF status, metadata ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.track_product_sale();

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

-- Atomically charge wallet balance and record a successful product purchase.
CREATE OR REPLACE FUNCTION public.purchase_product_with_wallet(
  p_user_id text,
  p_product_id uuid
)
RETURNS TABLE(purchase_transaction_id uuid, remaining_balance bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  product_row public.products%ROWTYPE;
  wallet_balance bigint;
  new_transaction_id uuid;
  order_code text;
  purchase_metadata jsonb;
BEGIN
  SELECT * INTO product_row
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND OR NOT product_row.is_active THEN
    RAISE EXCEPTION 'product_unavailable';
  END IF;
  IF product_row.category = 'coiz' OR product_row.price_vnd <= 0 THEN
    RAISE EXCEPTION 'product_not_payable_by_wallet';
  END IF;
  IF product_row.stock_count = 0 THEN
    RAISE EXCEPTION 'product_out_of_stock';
  END IF;

  INSERT INTO public.wallet_accounts (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT account.balance INTO wallet_balance
  FROM public.wallet_accounts AS account
  WHERE account.user_id = p_user_id
  FOR UPDATE;

  IF wallet_balance < product_row.price_vnd THEN
    RAISE EXCEPTION 'wallet_balance_insufficient';
  END IF;

  order_code := 'GZ' || upper(substr(replace(pg_catalog.gen_random_uuid()::text, '-', ''), 1, 10));
  IF product_row.category = 'key' THEN
    purchase_metadata := jsonb_build_object(
      'type', 'key',
      'category', 'mod',
      'duration_days', product_row.key_duration_days,
      'product_id', product_row.id,
      'product_title', product_row.title,
      'payment_method', 'wallet'
    );
  ELSE
    purchase_metadata := jsonb_build_object(
      'type', 'product',
      'product_id', product_row.id,
      'product_title', product_row.title,
      'payment_method', 'wallet'
    );
  END IF;

  INSERT INTO public.transactions (
    user_id, amount, description, status, method, rewarded, metadata
  ) VALUES (
    p_user_id, product_row.price_vnd, order_code, 'success', 'Wallet', true, purchase_metadata
  )
  RETURNING id INTO new_transaction_id;

  INSERT INTO public.wallet_ledger (user_id, transaction_id, entry_type, amount, description)
  VALUES (p_user_id, new_transaction_id, 'purchase', product_row.price_vnd, product_row.title);

  UPDATE public.wallet_accounts
  SET balance = balance - product_row.price_vnd, updated_at = now()
  WHERE user_id = p_user_id;

  IF product_row.stock_count IS NOT NULL THEN
    UPDATE public.products
    SET stock_count = stock_count - 1, updated_at = now()
    WHERE id = product_row.id;
  END IF;

  RETURN QUERY SELECT new_transaction_id, wallet_balance - product_row.price_vnd;
END;
$$;

-- Purchase a premium key package directly from the wallet.
CREATE OR REPLACE FUNCTION public.purchase_key_with_wallet(
  p_user_id text,
  p_category text,
  p_duration_days integer
)
RETURNS TABLE(purchase_transaction_id uuid, remaining_balance bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  package_price integer;
  wallet_balance bigint;
  new_transaction_id uuid;
  order_code text;
BEGIN
  IF p_category IS NULL OR p_category NOT IN ('mod', 'roblox') THEN
    RAISE EXCEPTION 'invalid_key_category';
  END IF;

  package_price := CASE p_duration_days
    WHEN 1 THEN 2000
    WHEN 7 THEN 12000
    WHEN 30 THEN 50000
    WHEN 365 THEN 500000
    ELSE NULL
  END;
  IF package_price IS NULL THEN
    RAISE EXCEPTION 'invalid_key_package';
  END IF;

  INSERT INTO public.wallet_accounts (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT account.balance INTO wallet_balance
  FROM public.wallet_accounts AS account
  WHERE account.user_id = p_user_id
  FOR UPDATE;

  IF wallet_balance < package_price THEN
    RAISE EXCEPTION 'wallet_balance_insufficient';
  END IF;

  order_code := 'KEY' || upper(substr(replace(pg_catalog.gen_random_uuid()::text, '-', ''), 1, 12));
  INSERT INTO public.transactions (
    user_id, amount, description, status, method, rewarded, metadata
  ) VALUES (
    p_user_id,
    package_price,
    order_code,
    'success',
    'Wallet',
    true,
    jsonb_build_object(
      'type', 'key',
      'category', p_category,
      'duration_days', p_duration_days,
      'payment_method', 'wallet'
    )
  )
  RETURNING id INTO new_transaction_id;

  INSERT INTO public.wallet_ledger (user_id, transaction_id, entry_type, amount, description)
  VALUES (p_user_id, new_transaction_id, 'purchase', package_price, 'Premium key');

  UPDATE public.wallet_accounts
  SET balance = balance - package_price, updated_at = now()
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT new_transaction_id, wallet_balance - package_price;
END;
$$;

-- Public remote configuration is read through the server API; writes remain private.
CREATE TABLE IF NOT EXISTS public.mod_configs (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  config_name text NOT NULL UNIQUE,
  config_data text NOT NULL,
  version_code integer NOT NULL DEFAULT 1 CHECK (version_code > 0),
  is_active boolean NOT NULL DEFAULT false,
  last_modified_by text NOT NULL DEFAULT 'System',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Private file URLs are selected only by server-side routes.
CREATE TABLE IF NOT EXISTS public.downloads (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  title text NOT NULL,
  description text,
  image_url text,
  download_url text NOT NULL,
  version text,
  file_size text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS downloads_active_created_idx ON public.downloads (is_active, created_at DESC);

DROP TRIGGER IF EXISTS transactions_set_updated_at ON public.transactions;
CREATE TRIGGER transactions_set_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS mod_keys_set_updated_at ON public.mod_keys;
CREATE TRIGGER mod_keys_set_updated_at BEFORE UPDATE ON public.mod_keys FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;
CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS mod_configs_set_updated_at ON public.mod_configs;
CREATE TRIGGER mod_configs_set_updated_at BEFORE UPDATE ON public.mod_configs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS downloads_set_updated_at ON public.downloads;
CREATE TRIGGER downloads_set_updated_at BEFORE UPDATE ON public.downloads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS wallet_accounts_set_updated_at ON public.wallet_accounts;
CREATE TRIGGER wallet_accounts_set_updated_at BEFORE UPDATE ON public.wallet_accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS transactions_credit_wallet_topup ON public.transactions;
CREATE TRIGGER transactions_credit_wallet_topup AFTER UPDATE OF status ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.credit_wallet_topup();

-- Private by default. APIs authenticate users/admins, then use server-only service role.
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sepay_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mod_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roblox_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mod_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.transactions, public.sepay_webhook_events, public.mod_keys, public.roblox_keys, public.products, public.mod_configs, public.downloads, public.wallet_accounts, public.wallet_ledger, public.api_rate_limits FROM anon, authenticated;
GRANT ALL ON public.transactions, public.sepay_webhook_events, public.mod_keys, public.roblox_keys, public.products, public.mod_configs, public.downloads, public.wallet_accounts, public.wallet_ledger, public.api_rate_limits TO service_role;
REVOKE ALL ON FUNCTION public.purchase_product_with_wallet(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_product_with_wallet(text, uuid) TO service_role;
REVOKE ALL ON FUNCTION public.purchase_key_with_wallet(text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_key_with_wallet(text, text, integer) TO service_role;
REVOKE ALL ON FUNCTION public.consume_api_rate_limit(text, timestamptz, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_api_rate_limit(text, timestamptz, integer) TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

CREATE POLICY transactions_service_role_all ON public.transactions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY sepay_webhook_events_service_role_all ON public.sepay_webhook_events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY mod_keys_service_role_all ON public.mod_keys FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY roblox_keys_service_role_all ON public.roblox_keys FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY products_service_role_all ON public.products FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY mod_configs_service_role_all ON public.mod_configs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY downloads_service_role_all ON public.downloads FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY wallet_accounts_service_role_all ON public.wallet_accounts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY wallet_ledger_service_role_all ON public.wallet_ledger FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY api_rate_limits_service_role_all ON public.api_rate_limits FOR ALL TO service_role USING (true) WITH CHECK (true);

-- The API uses service role for active config reads; no table access is exposed to browsers.


-- ============================================================================
-- GAME ACCOUNT SALES AND INVENTORY
-- ============================================================================
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

