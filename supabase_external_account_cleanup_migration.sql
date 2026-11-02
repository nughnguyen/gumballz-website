-- Allow admins to hide sold source accounts without letting catalog sync re-list them.
ALTER TABLE public.external_game_accounts
  ADD COLUMN IF NOT EXISTS admin_hidden boolean NOT NULL DEFAULT false;
