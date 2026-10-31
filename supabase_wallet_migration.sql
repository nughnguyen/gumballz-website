-- Add wallet top-ups to an existing GumballZ Hub schema.
-- Safe to re-run. This script does not delete tables or wallet data.

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
      UPDATE public.wallet_accounts
      SET balance = balance + NEW.amount, updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Charge the wallet and create a successful product transaction atomically.
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

  order_code := 'GZ' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
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

DROP TRIGGER IF EXISTS wallet_accounts_set_updated_at ON public.wallet_accounts;
CREATE TRIGGER wallet_accounts_set_updated_at BEFORE UPDATE ON public.wallet_accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS transactions_credit_wallet_topup ON public.transactions;
CREATE TRIGGER transactions_credit_wallet_topup AFTER UPDATE OF status ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.credit_wallet_topup();

ALTER TABLE public.wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wallet_accounts, public.wallet_ledger FROM anon, authenticated;
GRANT ALL ON public.wallet_accounts, public.wallet_ledger TO service_role;
REVOKE ALL ON FUNCTION public.purchase_product_with_wallet(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_product_with_wallet(text, uuid) TO service_role;
DROP POLICY IF EXISTS wallet_accounts_service_role_all ON public.wallet_accounts;
CREATE POLICY wallet_accounts_service_role_all ON public.wallet_accounts FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS wallet_ledger_service_role_all ON public.wallet_ledger;
CREATE POLICY wallet_ledger_service_role_all ON public.wallet_ledger FOR ALL TO service_role USING (true) WITH CHECK (true);
