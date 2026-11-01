-- Product discounts: apply once in Supabase SQL Editor.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_percent integer NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 90);

CREATE TABLE IF NOT EXISTS public.discount_vouchers (
  code text PRIMARY KEY CHECK (code = upper(code) AND code ~ '^[A-Z0-9_-]{3,32}$'),
  discount_percent integer NOT NULL CHECK (discount_percent BETWEEN 1 AND 90),
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit integer CHECK (usage_limit IS NULL OR usage_limit > 0),
  usage_count integer NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.discount_vouchers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.discount_vouchers FROM anon, authenticated;
GRANT ALL ON public.discount_vouchers TO service_role;
DROP POLICY IF EXISTS discount_vouchers_service_role_all ON public.discount_vouchers;
CREATE POLICY discount_vouchers_service_role_all ON public.discount_vouchers FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP FUNCTION IF EXISTS public.purchase_product_with_wallet(text, uuid);
CREATE OR REPLACE FUNCTION public.purchase_product_with_wallet(p_user_id text, p_product_id uuid, p_voucher_code text DEFAULT NULL)
RETURNS TABLE(purchase_transaction_id uuid, remaining_balance bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE product_row public.products%ROWTYPE; wallet_balance bigint; new_transaction_id uuid; order_code text; purchase_metadata jsonb; v_price bigint; v_base_price bigint; voucher_row public.discount_vouchers%ROWTYPE;
BEGIN
  SELECT * INTO product_row FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND OR NOT product_row.is_active THEN RAISE EXCEPTION 'product_unavailable'; END IF;
  v_base_price := round(product_row.price_vnd * (100 - coalesce(product_row.discount_percent, 0)) / 100);
  v_price := v_base_price;
  IF nullif(trim(p_voucher_code), '') IS NOT NULL THEN
    SELECT * INTO voucher_row FROM public.discount_vouchers WHERE code = upper(trim(p_voucher_code)) FOR UPDATE;
    IF NOT FOUND OR NOT voucher_row.is_active OR (voucher_row.starts_at IS NOT NULL AND voucher_row.starts_at > now()) OR (voucher_row.expires_at IS NOT NULL AND voucher_row.expires_at <= now()) OR (voucher_row.usage_limit IS NOT NULL AND voucher_row.usage_count >= voucher_row.usage_limit) OR (voucher_row.product_id IS NOT NULL AND voucher_row.product_id <> product_row.id) THEN RAISE EXCEPTION 'voucher_invalid'; END IF;
    v_price := round(v_base_price * (100 - voucher_row.discount_percent) / 100);
    UPDATE public.discount_vouchers SET usage_count = usage_count + 1 WHERE code = voucher_row.code;
  END IF;
  IF product_row.category = 'coiz' OR v_price <= 0 THEN RAISE EXCEPTION 'product_not_payable_by_wallet'; END IF;
  IF product_row.stock_count = 0 THEN RAISE EXCEPTION 'product_out_of_stock'; END IF;
  IF product_row.category NOT IN ('key','game_account') AND EXISTS (
    SELECT 1 FROM public.transactions AS transaction_row
    WHERE transaction_row.user_id = p_user_id AND transaction_row.status = 'success'
      AND transaction_row.metadata->>'type' = 'product'
      AND transaction_row.metadata->>'product_id' = product_row.id::text
  ) THEN RAISE EXCEPTION 'product_already_purchased'; END IF;

  INSERT INTO public.wallet_accounts (user_id, balance) VALUES (p_user_id, 0) ON CONFLICT (user_id) DO NOTHING;
  SELECT account.balance INTO wallet_balance FROM public.wallet_accounts AS account WHERE account.user_id = p_user_id FOR UPDATE;
  IF wallet_balance < v_price THEN RAISE EXCEPTION 'wallet_balance_insufficient'; END IF;

  order_code := 'GZ' || upper(substr(replace(pg_catalog.gen_random_uuid()::text, '-', ''), 1, 10));
  IF product_row.category = 'key' THEN
    purchase_metadata := jsonb_build_object('type','key','category','mod','duration_days',product_row.key_duration_days,'product_id',product_row.id,'product_title',product_row.title,'payment_method','wallet');
  ELSIF product_row.category = 'game_account' THEN
    purchase_metadata := jsonb_build_object('type','game_account','product_id',product_row.id,'product_title',product_row.title,'account_sale_mode',product_row.account_sale_mode,'payment_method','wallet');
  ELSE
    purchase_metadata := jsonb_build_object('type','product','product_id',product_row.id,'product_title',product_row.title,'payment_method','wallet');
  END IF;
  INSERT INTO public.transactions(user_id,amount,description,status,method,rewarded,metadata)
  VALUES(p_user_id,v_price,order_code,'success','Wallet',true,purchase_metadata)
  RETURNING id INTO new_transaction_id;
  INSERT INTO public.wallet_ledger(user_id,transaction_id,entry_type,amount,description)
  VALUES(p_user_id,new_transaction_id,'purchase',v_price,product_row.title);
  UPDATE public.wallet_accounts SET balance=balance-v_price,updated_at=now() WHERE user_id=p_user_id;
  IF product_row.stock_count IS NOT NULL AND product_row.category <> 'game_account' THEN
    UPDATE public.products SET stock_count=stock_count-1,updated_at=now() WHERE id=product_row.id;
  END IF;
  RETURN QUERY SELECT new_transaction_id,wallet_balance-v_price;
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_product_with_wallet(text,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_product_with_wallet(text,uuid,text) TO service_role;
