-- Apply after the wallet and products tables exist. Safe to re-run.
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

REVOKE ALL ON FUNCTION public.purchase_product_with_wallet(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_product_with_wallet(text, uuid) TO service_role;
REVOKE ALL ON FUNCTION public.purchase_key_with_wallet(text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_key_with_wallet(text, text, integer) TO service_role;
