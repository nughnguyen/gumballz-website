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

DROP TRIGGER IF EXISTS wallet_accounts_set_updated_at ON public.wallet_accounts;
CREATE TRIGGER wallet_accounts_set_updated_at BEFORE UPDATE ON public.wallet_accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS transactions_credit_wallet_topup ON public.transactions;
CREATE TRIGGER transactions_credit_wallet_topup AFTER UPDATE OF status ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.credit_wallet_topup();

ALTER TABLE public.wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wallet_accounts, public.wallet_ledger FROM anon, authenticated;
GRANT ALL ON public.wallet_accounts, public.wallet_ledger TO service_role;
DROP POLICY IF EXISTS wallet_accounts_service_role_all ON public.wallet_accounts;
CREATE POLICY wallet_accounts_service_role_all ON public.wallet_accounts FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS wallet_ledger_service_role_all ON public.wallet_ledger;
CREATE POLICY wallet_ledger_service_role_all ON public.wallet_ledger FOR ALL TO service_role USING (true) WITH CHECK (true);
