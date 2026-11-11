-- Let users hide their own activity history without deleting purchase records
-- used to verify downloads, payment status, or account deliveries.
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS hidden_from_history boolean NOT NULL DEFAULT false;

ALTER TABLE public.wallet_ledger
  ADD COLUMN IF NOT EXISTS hidden_from_history boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS transactions_user_visible_history_idx
  ON public.transactions (user_id, created_at DESC)
  WHERE user_id IS NOT NULL AND hidden_from_history = false;

CREATE INDEX IF NOT EXISTS wallet_ledger_user_visible_history_idx
  ON public.wallet_ledger (user_id, created_at DESC)
  WHERE hidden_from_history = false;
