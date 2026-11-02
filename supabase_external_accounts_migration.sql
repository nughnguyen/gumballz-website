-- Shop-authored categories are the only category details exposed to customers.
CREATE TABLE IF NOT EXISTS public.external_game_account_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  cover_image_url text,
  source text NOT NULL CHECK (source IN ('tyseisei')),
  markup_vnd bigint NOT NULL DEFAULT 250000 CHECK (markup_vnd >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.external_game_account_categories
  ADD COLUMN IF NOT EXISTS game text NOT NULL DEFAULT 'free_fire';
ALTER TABLE public.external_game_account_categories ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.external_game_account_categories FROM anon, authenticated;
GRANT ALL ON public.external_game_account_categories TO service_role;
DROP POLICY IF EXISTS external_game_account_categories_service_role_all ON public.external_game_account_categories;
CREATE POLICY external_game_account_categories_service_role_all ON public.external_game_account_categories FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authorized external account listing mirror (public listing fields only).
CREATE TABLE IF NOT EXISTS public.external_game_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  source_account_id text NOT NULL,
  source_url text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  original_price_vnd bigint NOT NULL CHECK (original_price_vnd >= 0),
  markup_vnd bigint NOT NULL DEFAULT 250000 CHECK (markup_vnd >= 0),
  price_vnd bigint NOT NULL CHECK (price_vnd >= 0),
  price_tier text NOT NULL CHECK (price_tier IN ('under_2m','2m_7m','7m_15m','super')),
  is_active boolean NOT NULL DEFAULT true,
  admin_hidden boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','reserved','sold','unavailable')),
  sync_generation uuid NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  category_id uuid REFERENCES public.external_game_account_categories(id) ON DELETE SET NULL,
  UNIQUE (source, source_account_id)
);
ALTER TABLE public.external_game_accounts ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.external_game_account_categories(id) ON DELETE SET NULL;
ALTER TABLE public.external_game_accounts ADD COLUMN IF NOT EXISTS admin_hidden boolean NOT NULL DEFAULT false;
ALTER TABLE public.external_game_accounts DROP CONSTRAINT IF EXISTS external_game_accounts_source_source_account_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS external_game_accounts_category_source_account_uidx
  ON public.external_game_accounts (category_id, source, source_account_id);
CREATE INDEX IF NOT EXISTS external_game_accounts_active_tier_idx
  ON public.external_game_accounts (is_active, price_tier, price_vnd);
ALTER TABLE public.external_game_accounts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.external_game_accounts FROM anon, authenticated;
GRANT ALL ON public.external_game_accounts TO service_role;
DROP POLICY IF EXISTS external_game_accounts_service_role_all ON public.external_game_accounts;
CREATE POLICY external_game_accounts_service_role_all ON public.external_game_accounts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.create_external_game_account_order(
  p_user_id text, p_account_id uuid, p_payment_method text
)
RETURNS TABLE(transaction_id uuid, order_amount bigint, order_code text, remaining_balance bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE account_row public.external_game_accounts%ROWTYPE; balance_now bigint; new_transaction uuid; code text; order_status text;
BEGIN
  IF p_payment_method NOT IN ('wallet','banking') THEN RAISE EXCEPTION 'invalid_payment_method'; END IF;
  SELECT * INTO account_row FROM public.external_game_accounts WHERE id = p_account_id FOR UPDATE;
  IF NOT FOUND OR account_row.status <> 'active' OR NOT account_row.is_active THEN RAISE EXCEPTION 'external_account_unavailable'; END IF;
  IF p_payment_method = 'wallet' THEN
    INSERT INTO public.wallet_accounts(user_id,balance) VALUES(p_user_id,0) ON CONFLICT(user_id) DO NOTHING;
    SELECT balance INTO balance_now FROM public.wallet_accounts WHERE user_id=p_user_id FOR UPDATE;
    IF balance_now < account_row.price_vnd THEN RAISE EXCEPTION 'wallet_balance_insufficient'; END IF;
  END IF;
  code := 'GZ' || upper(substr(replace(pg_catalog.gen_random_uuid()::text,'-',''),1,10));
  order_status := CASE WHEN p_payment_method='wallet' THEN 'success' ELSE 'pending' END;
  INSERT INTO public.transactions(user_id,amount,description,status,method,rewarded,metadata)
  VALUES(p_user_id,account_row.price_vnd,code,order_status,CASE WHEN p_payment_method='wallet' THEN 'Wallet' ELSE 'Banking' END,p_payment_method='wallet',
    jsonb_build_object('type','external_game_account','product_title',account_row.title,'category_title',(SELECT title FROM public.external_game_account_categories WHERE id=account_row.category_id),'source_account_id',account_row.source_account_id,'source_url',account_row.source_url,'external_account_id',account_row.id,'fulfillment_status','pending','payment_method',p_payment_method))
  RETURNING id INTO new_transaction;
  IF p_payment_method='wallet' THEN
    INSERT INTO public.wallet_ledger(user_id,transaction_id,entry_type,amount,description) VALUES(p_user_id,new_transaction,'purchase',account_row.price_vnd,account_row.title);
    UPDATE public.wallet_accounts SET balance=balance-account_row.price_vnd,updated_at=now() WHERE user_id=p_user_id;
  END IF;
  UPDATE public.external_game_accounts SET status='reserved',is_active=false,updated_at=now() WHERE id=account_row.id;
  RETURN QUERY SELECT new_transaction,account_row.price_vnd,code,CASE WHEN p_payment_method='wallet' THEN balance_now-account_row.price_vnd ELSE NULL END;
END;
$$;
REVOKE ALL ON FUNCTION public.create_external_game_account_order(text,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_external_game_account_order(text,uuid,text) TO service_role;

CREATE OR REPLACE FUNCTION public.release_external_game_account_on_failure()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.status IN ('failed','cancelled') AND OLD.status IS DISTINCT FROM NEW.status
     AND NEW.metadata->>'type'='external_game_account'
     AND NEW.metadata->>'fulfillment_status'='pending' THEN
    UPDATE public.external_game_accounts
      SET status='active',is_active=true,updated_at=now()
      WHERE id=(NEW.metadata->>'external_account_id')::uuid AND status='reserved';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS transactions_release_external_account ON public.transactions;
CREATE TRIGGER transactions_release_external_account
  AFTER UPDATE OF status ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.release_external_game_account_on_failure();
