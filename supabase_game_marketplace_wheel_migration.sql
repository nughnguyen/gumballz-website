-- Separate game-account marketplace and server-settled lucky wheel.
BEGIN;

CREATE TABLE IF NOT EXISTS public.game_account_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  offer_type text NOT NULL CHECK (offer_type IN ('mystery','individual','community')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  description text NOT NULL DEFAULT '',
  details text NOT NULL DEFAULT '',
  warranty_terms text NOT NULL DEFAULT '',
  risk_notice text NOT NULL DEFAULT '',
  refund_policy text NOT NULL DEFAULT '',
  is_featured boolean NOT NULL DEFAULT false,
  banner_image_url text,
  gallery_urls text[] NOT NULL DEFAULT '{}',
  price_vnd bigint NOT NULL CHECK (price_vnd >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.game_account_offers DROP CONSTRAINT IF EXISTS game_account_offers_offer_type_check;
ALTER TABLE public.game_account_offers ADD CONSTRAINT game_account_offers_offer_type_check CHECK (offer_type IN ('mystery','individual','community'));
ALTER TABLE public.game_account_offers ADD COLUMN IF NOT EXISTS warranty_terms text NOT NULL DEFAULT '';
ALTER TABLE public.game_account_offers ADD COLUMN IF NOT EXISTS risk_notice text NOT NULL DEFAULT '';
ALTER TABLE public.game_account_offers ADD COLUMN IF NOT EXISTS refund_policy text NOT NULL DEFAULT '';
ALTER TABLE public.game_account_offers ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS game_account_offers_active_type_idx ON public.game_account_offers(offer_type, created_at DESC) WHERE is_active;

CREATE TABLE IF NOT EXISTS public.game_account_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.game_account_offers(id) ON DELETE CASCADE,
  username text NOT NULL CHECK (char_length(username) BETWEEN 1 AND 240),
  password text NOT NULL CHECK (char_length(password) BETWEEN 1 AND 500),
  screenshots text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','reserved','sold')),
  transaction_id uuid,
  sold_to text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reserved_at timestamptz,
  sold_at timestamptz
);
CREATE INDEX IF NOT EXISTS game_account_inventory_available_idx ON public.game_account_inventory(offer_id, created_at) WHERE status='available';
CREATE INDEX IF NOT EXISTS game_account_inventory_transaction_idx ON public.game_account_inventory(transaction_id) WHERE transaction_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.game_account_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.game_account_offers(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE DEFAULT ('MB-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','reserved','sold')),
  transaction_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  sold_at timestamptz
);
CREATE INDEX IF NOT EXISTS game_account_packs_available_idx ON public.game_account_packs(offer_id,created_at) WHERE status='available';
CREATE INDEX IF NOT EXISTS game_account_packs_transaction_idx ON public.game_account_packs(transaction_id) WHERE transaction_id IS NOT NULL;

ALTER TABLE public.game_account_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_account_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_account_packs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.game_account_offers, public.game_account_inventory, public.game_account_packs FROM anon, authenticated;
GRANT ALL ON public.game_account_offers, public.game_account_inventory, public.game_account_packs TO service_role;
DROP POLICY IF EXISTS game_account_offers_service_role_all ON public.game_account_offers;
CREATE POLICY game_account_offers_service_role_all ON public.game_account_offers FOR ALL TO service_role USING(true) WITH CHECK(true);
DROP POLICY IF EXISTS game_account_inventory_service_role_all ON public.game_account_inventory;
CREATE POLICY game_account_inventory_service_role_all ON public.game_account_inventory FOR ALL TO service_role USING(true) WITH CHECK(true);
DROP POLICY IF EXISTS game_account_packs_service_role_all ON public.game_account_packs;
CREATE POLICY game_account_packs_service_role_all ON public.game_account_packs FOR ALL TO service_role USING(true) WITH CHECK(true);

CREATE TABLE IF NOT EXISTS public.game_account_category_notices (
  offer_type text PRIMARY KEY CHECK (offer_type IN ('mystery','individual','community')),
  title text NOT NULL DEFAULT 'Thông báo trước khi mua',
  body text NOT NULL DEFAULT '',
  is_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.game_account_category_notices(offer_type) VALUES ('mystery'),('individual'),('community') ON CONFLICT (offer_type) DO NOTHING;
ALTER TABLE public.game_account_category_notices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.game_account_category_notices FROM anon, authenticated;
GRANT ALL ON public.game_account_category_notices TO service_role;
DROP POLICY IF EXISTS game_account_category_notices_service_role_all ON public.game_account_category_notices;
CREATE POLICY game_account_category_notices_service_role_all ON public.game_account_category_notices FOR ALL TO service_role USING(true) WITH CHECK(true);

CREATE OR REPLACE FUNCTION public.reserve_deliver_offer_account()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  offer_uuid uuid;
  offer_row public.game_account_offers%ROWTYPE;
  account_row public.game_account_inventory%ROWTYPE;
  pack_row public.game_account_packs%ROWTYPE;
  requested_pack text;
  requested_id text;
  requested_quantity integer;
  processed integer := 0;
  reserved_ids jsonb := '[]'::jsonb;
  deliveries jsonb := '[]'::jsonb;
BEGIN
  IF NEW.metadata->>'type' IS DISTINCT FROM 'game_account_offer_purchase'
     OR NEW.status NOT IN ('pending','success')
     OR (TG_OP='UPDATE' AND OLD.status='success') THEN RETURN NEW; END IF;
  IF (NEW.metadata->>'offer_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN RAISE EXCEPTION 'invalid_game_account_offer'; END IF;
  offer_uuid := (NEW.metadata->>'offer_id')::uuid;
  SELECT * INTO offer_row FROM public.game_account_offers WHERE id=offer_uuid AND is_active FOR UPDATE;
  IF offer_row.id IS NULL THEN RAISE EXCEPTION 'game_account_offer_unavailable'; END IF;
  requested_quantity := CASE WHEN offer_row.offer_type='community' THEN coalesce((NEW.metadata->>'quantity')::integer,1) ELSE 1 END;
  IF requested_quantity<1 OR requested_quantity>50 THEN RAISE EXCEPTION 'invalid_game_account_quantity'; END IF;

  IF offer_row.offer_type='community' THEN
    IF TG_OP='UPDATE' AND jsonb_typeof(NEW.metadata->'reserved_game_account_ids')='array' THEN
      FOR requested_id IN SELECT jsonb_array_elements_text(NEW.metadata->'reserved_game_account_ids') LOOP
        SELECT * INTO account_row FROM public.game_account_inventory WHERE id=requested_id::uuid AND offer_id=offer_uuid AND status='reserved' AND transaction_id=NEW.id FOR UPDATE;
        IF account_row.id IS NULL THEN RAISE EXCEPTION 'game_account_reservation_lost'; END IF;
        UPDATE public.game_account_inventory SET status='sold',sold_to=NEW.user_id,reserved_at=NULL,sold_at=now() WHERE id=account_row.id RETURNING * INTO account_row;
        deliveries:=deliveries||jsonb_build_array(jsonb_build_object('username',account_row.username,'password',account_row.password));
        processed:=processed+1;
      END LOOP;
      IF processed<>requested_quantity THEN RAISE EXCEPTION 'game_account_reservation_lost'; END IF;
    ELSE
      FOR account_row IN SELECT * FROM public.game_account_inventory WHERE offer_id=offer_uuid AND status='available' ORDER BY random() LIMIT requested_quantity FOR UPDATE SKIP LOCKED LOOP
        UPDATE public.game_account_inventory SET status=CASE WHEN NEW.status='success' THEN 'sold' ELSE 'reserved' END,transaction_id=NEW.id,sold_to=CASE WHEN NEW.status='success' THEN NEW.user_id ELSE NULL END,reserved_at=CASE WHEN NEW.status='pending' THEN now() ELSE NULL END,sold_at=CASE WHEN NEW.status='success' THEN now() ELSE NULL END WHERE id=account_row.id RETURNING * INTO account_row;
        reserved_ids:=reserved_ids||jsonb_build_array(account_row.id);
        IF NEW.status='success' THEN deliveries:=deliveries||jsonb_build_array(jsonb_build_object('username',account_row.username,'password',account_row.password)); END IF;
        processed:=processed+1;
      END LOOP;
      IF processed<>requested_quantity THEN RAISE EXCEPTION 'game_account_inventory_out_of_stock'; END IF;
      NEW.metadata:=NEW.metadata||jsonb_build_object('reserved_game_account_ids',reserved_ids,'quantity',requested_quantity);
    END IF;
    IF NEW.status='success' THEN NEW.metadata:=NEW.metadata||jsonb_build_object('game_account_deliveries',deliveries,'offer_title',offer_row.title,'offer_type','community'); END IF;
    RETURN NEW;
  END IF;

  IF offer_row.offer_type='mystery' THEN
    requested_pack:=NEW.metadata->>'pack_id';
    IF requested_pack ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      SELECT * INTO pack_row FROM public.game_account_packs WHERE id=requested_pack::uuid AND offer_id=offer_uuid AND status=CASE WHEN NEW.status='success' AND TG_OP='UPDATE' THEN 'reserved' ELSE 'available' END AND (transaction_id IS NULL OR transaction_id=NEW.id) FOR UPDATE;
    ELSE
      SELECT * INTO pack_row FROM public.game_account_packs WHERE offer_id=offer_uuid AND status='available' ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED;
    END IF;
    IF pack_row.id IS NULL THEN RAISE EXCEPTION 'game_account_pack_out_of_stock'; END IF;
  ELSIF NEW.metadata ? 'pack_id' THEN RAISE EXCEPTION 'individual_offer_has_no_pack_code';
  END IF;

  IF NEW.metadata->>'reserved_game_account_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT * INTO account_row FROM public.game_account_inventory WHERE id=(NEW.metadata->>'reserved_game_account_id')::uuid AND offer_id=offer_uuid AND status='reserved' AND transaction_id=NEW.id FOR UPDATE;
  END IF;
  IF account_row.id IS NULL THEN
    SELECT * INTO account_row FROM public.game_account_inventory WHERE offer_id=offer_uuid AND status='available' ORDER BY random() LIMIT 1 FOR UPDATE SKIP LOCKED;
    IF account_row.id IS NULL THEN RAISE EXCEPTION 'game_account_inventory_out_of_stock'; END IF;
    UPDATE public.game_account_inventory SET status=CASE WHEN NEW.status='success' THEN 'sold' ELSE 'reserved' END,transaction_id=NEW.id,sold_to=CASE WHEN NEW.status='success' THEN NEW.user_id ELSE NULL END,reserved_at=CASE WHEN NEW.status='pending' THEN now() ELSE NULL END,sold_at=CASE WHEN NEW.status='success' THEN now() ELSE NULL END WHERE id=account_row.id RETURNING * INTO account_row;
  ELSIF NEW.status='success' THEN
    UPDATE public.game_account_inventory SET status='sold',sold_to=NEW.user_id,reserved_at=NULL,sold_at=now() WHERE id=account_row.id RETURNING * INTO account_row;
  END IF;
  IF pack_row.id IS NOT NULL THEN
    UPDATE public.game_account_packs SET status=CASE WHEN NEW.status='success' THEN 'sold' ELSE 'reserved' END,transaction_id=NEW.id,sold_at=CASE WHEN NEW.status='success' THEN now() ELSE NULL END WHERE id=pack_row.id RETURNING * INTO pack_row;
    NEW.metadata:=NEW.metadata||jsonb_build_object('pack_id',pack_row.id,'pack_code',pack_row.code);
  END IF;
  NEW.metadata:=NEW.metadata||jsonb_build_object('reserved_game_account_id',account_row.id,'offer_title',offer_row.title,'offer_type',offer_row.offer_type);
  IF NEW.status='success' THEN NEW.metadata:=NEW.metadata||jsonb_build_object('game_account_delivery',jsonb_build_object('username',account_row.username,'password',account_row.password,'delivered_at',now())); END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS transactions_reserve_offer_account ON public.transactions;
CREATE TRIGGER transactions_reserve_offer_account BEFORE INSERT OR UPDATE OF status,metadata ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.reserve_deliver_offer_account();

CREATE OR REPLACE FUNCTION public.release_offer_account_reservation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF OLD.status IN ('pending','expired') AND NEW.status IN ('failed','late_payment','ignored_code_not_found') THEN
    UPDATE public.game_account_inventory SET status='available',transaction_id=NULL,reserved_at=NULL WHERE transaction_id=NEW.id AND status='reserved';
    UPDATE public.game_account_packs SET status='available',transaction_id=NULL WHERE transaction_id=NEW.id AND status='reserved';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS transactions_release_offer_account ON public.transactions;
CREATE TRIGGER transactions_release_offer_account AFTER UPDATE OF status ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.release_offer_account_reservation();
CREATE OR REPLACE FUNCTION public.release_deleted_offer_account_reservation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF OLD.status<>'success' THEN
    UPDATE public.game_account_inventory SET status='available',transaction_id=NULL,reserved_at=NULL WHERE transaction_id=OLD.id AND status='reserved';
    UPDATE public.game_account_packs SET status='available',transaction_id=NULL WHERE transaction_id=OLD.id AND status='reserved';
  END IF;
  RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS transactions_release_deleted_offer_account ON public.transactions;
CREATE TRIGGER transactions_release_deleted_offer_account AFTER DELETE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.release_deleted_offer_account_reservation();

DROP FUNCTION IF EXISTS public.buy_game_account_offer_with_wallet(text,uuid,uuid);
CREATE OR REPLACE FUNCTION public.buy_game_account_offer_with_wallet(p_user_id text,p_offer_id uuid,p_pack_id uuid DEFAULT NULL,p_quantity integer DEFAULT 1)
RETURNS TABLE(purchase_transaction_id uuid,remaining_balance bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE offer_row public.game_account_offers%ROWTYPE; balance_now bigint; new_transaction_id uuid; metadata_json jsonb; order_code text; total_amount bigint;
BEGIN
  SELECT * INTO offer_row FROM public.game_account_offers WHERE id=p_offer_id AND is_active FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'game_account_offer_unavailable'; END IF;
  IF p_quantity<1 OR p_quantity>50 OR (offer_row.offer_type<>'community' AND p_quantity<>1) THEN RAISE EXCEPTION 'invalid_game_account_quantity'; END IF;
  total_amount:=offer_row.price_vnd*p_quantity;
  IF total_amount>100000000 THEN RAISE EXCEPTION 'game_account_amount_too_large'; END IF;
  INSERT INTO public.wallet_accounts(user_id,balance) VALUES(p_user_id,0) ON CONFLICT(user_id) DO NOTHING;
  SELECT balance INTO balance_now FROM public.wallet_accounts WHERE user_id=p_user_id FOR UPDATE;
  IF balance_now<total_amount THEN RAISE EXCEPTION 'wallet_balance_insufficient'; END IF;
  IF offer_row.offer_type='mystery' THEN metadata_json:=jsonb_build_object('type','game_account_offer_purchase','offer_id',p_offer_id,'pack_id',p_pack_id,'offer_title',offer_row.title,'offer_type','mystery');
  ELSIF offer_row.offer_type='community' THEN metadata_json:=jsonb_build_object('type','game_account_offer_purchase','offer_id',p_offer_id,'quantity',p_quantity,'offer_title',offer_row.title,'offer_type','community');
  ELSE metadata_json:=jsonb_build_object('type','game_account_offer_purchase','offer_id',p_offer_id,'offer_title',offer_row.title,'offer_type','individual'); END IF;
  order_code:='GZ'||upper(substr(replace(pg_catalog.gen_random_uuid()::text,'-',''),1,10));
  INSERT INTO public.transactions(user_id,amount,description,status,method,rewarded,metadata) VALUES(p_user_id,total_amount,order_code,'success','Wallet',true,metadata_json) RETURNING id INTO new_transaction_id;
  IF total_amount>0 THEN
    INSERT INTO public.wallet_ledger(user_id,transaction_id,entry_type,amount,description) VALUES(p_user_id,new_transaction_id,'purchase',total_amount,offer_row.title||CASE WHEN p_quantity>1 THEN ' ? '||p_quantity ELSE '' END);
    UPDATE public.wallet_accounts SET balance=balance-total_amount,updated_at=now() WHERE user_id=p_user_id;
  END IF;
  RETURN QUERY SELECT new_transaction_id,balance_now-total_amount;
END;
$$;
REVOKE ALL ON FUNCTION public.buy_game_account_offer_with_wallet(text,uuid,uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.buy_game_account_offer_with_wallet(text,uuid,uuid,integer) TO service_role;

CREATE TABLE IF NOT EXISTS public.lucky_wheel_config (
  id boolean PRIMARY KEY DEFAULT true CHECK(id),
  is_enabled boolean NOT NULL DEFAULT false,
  spin_cost_vnd bigint NOT NULL DEFAULT 0 CHECK(spin_cost_vnd>=0),
  segments jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(segments)='array'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.lucky_wheel_config(id) VALUES(true) ON CONFLICT(id) DO NOTHING;
CREATE TABLE IF NOT EXISTS public.lucky_wheel_spins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text NOT NULL, prize_type text NOT NULL CHECK(prize_type IN ('wallet','account')),
  prize_label text NOT NULL, prize_amount bigint, offer_id uuid REFERENCES public.game_account_offers(id), transaction_id uuid REFERENCES public.transactions(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lucky_wheel_spins_user_created_idx ON public.lucky_wheel_spins(user_id,created_at DESC);
ALTER TABLE public.lucky_wheel_config ENABLE ROW LEVEL SECURITY; ALTER TABLE public.lucky_wheel_spins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lucky_wheel_config,public.lucky_wheel_spins FROM anon,authenticated; GRANT ALL ON public.lucky_wheel_config,public.lucky_wheel_spins TO service_role;
DROP POLICY IF EXISTS lucky_wheel_config_service_role_all ON public.lucky_wheel_config;
CREATE POLICY lucky_wheel_config_service_role_all ON public.lucky_wheel_config FOR ALL TO service_role USING(true) WITH CHECK(true);
DROP POLICY IF EXISTS lucky_wheel_spins_service_role_all ON public.lucky_wheel_spins;
CREATE POLICY lucky_wheel_spins_service_role_all ON public.lucky_wheel_spins FOR ALL TO service_role USING(true) WITH CHECK(true);

CREATE OR REPLACE FUNCTION public.spin_lucky_wheel(p_user_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE config_row public.lucky_wheel_config%ROWTYPE; wallet_balance bigint; total_weight numeric:=0; ticket numeric; running numeric:=0; segment jsonb; selected jsonb; selected_index integer; cost_transaction uuid; prize_transaction uuid; remaining bigint; offer_uuid uuid; result_label text; result_type text; result_amount bigint;
BEGIN
  SELECT * INTO config_row FROM public.lucky_wheel_config WHERE id=true FOR UPDATE;
  IF NOT FOUND OR NOT config_row.is_enabled THEN RAISE EXCEPTION 'lucky_wheel_disabled'; END IF;
  IF jsonb_array_length(config_row.segments)<2 THEN RAISE EXCEPTION 'lucky_wheel_not_configured'; END IF;
  INSERT INTO public.wallet_accounts(user_id,balance) VALUES(p_user_id,0) ON CONFLICT(user_id) DO NOTHING;
  SELECT balance INTO wallet_balance FROM public.wallet_accounts WHERE user_id=p_user_id FOR UPDATE;
  IF wallet_balance<config_row.spin_cost_vnd THEN RAISE EXCEPTION 'wallet_balance_insufficient'; END IF;
  FOR segment IN SELECT value FROM jsonb_array_elements(config_row.segments) LOOP
    IF coalesce((segment->>'weight')::numeric,0)>0 AND ((segment->>'type'='wallet' AND coalesce((segment->>'amount')::bigint,0)>0) OR (segment->>'type'='account' AND EXISTS(SELECT 1 FROM public.game_account_inventory i JOIN public.game_account_offers o ON o.id=i.offer_id WHERE i.offer_id=(segment->>'offer_id')::uuid AND i.status='available' AND o.is_active AND o.offer_type='individual'))) THEN total_weight:=total_weight+coalesce((segment->>'weight')::numeric,0); END IF;
  END LOOP;
  IF total_weight<=0 THEN RAISE EXCEPTION 'lucky_wheel_no_prizes'; END IF;
  ticket:=random()*total_weight;
  FOR segment, selected_index IN SELECT value, (ordinality-1)::integer FROM jsonb_array_elements(config_row.segments) WITH ORDINALITY AS entry(value,ordinality) LOOP
    IF coalesce((segment->>'weight')::numeric,0)>0 AND ((segment->>'type'='wallet' AND coalesce((segment->>'amount')::bigint,0)>0) OR (segment->>'type'='account' AND EXISTS(SELECT 1 FROM public.game_account_inventory i JOIN public.game_account_offers o ON o.id=i.offer_id WHERE i.offer_id=(segment->>'offer_id')::uuid AND i.status='available' AND o.is_active AND o.offer_type='individual'))) THEN
      running:=running+coalesce((segment->>'weight')::numeric,0); IF ticket<=running THEN selected:=segment; EXIT; END IF;
    END IF;
  END LOOP;
  IF selected IS NULL THEN RAISE EXCEPTION 'lucky_wheel_no_prizes'; END IF;
  result_label:=left(coalesce(selected->>'label','Phần thưởng'),100);
  IF config_row.spin_cost_vnd>0 THEN
    INSERT INTO public.transactions(user_id,amount,description,status,method,rewarded,metadata) VALUES(p_user_id,config_row.spin_cost_vnd,'Lucky wheel spin','success','Wallet',true,jsonb_build_object('type','lucky_wheel_spin_fee','prize_label',result_label)) RETURNING id INTO cost_transaction;
    INSERT INTO public.wallet_ledger(user_id,transaction_id,entry_type,amount,description) VALUES(p_user_id,cost_transaction,'purchase',config_row.spin_cost_vnd,'Lượt quay may mắn');
    UPDATE public.wallet_accounts SET balance=balance-config_row.spin_cost_vnd,updated_at=now() WHERE user_id=p_user_id;
  END IF;
  remaining:=wallet_balance-config_row.spin_cost_vnd;
  IF selected->>'type'='wallet' THEN
    result_type:='wallet'; result_amount:=(selected->>'amount')::bigint;
    UPDATE public.wallet_accounts SET balance=balance+result_amount,updated_at=now() WHERE user_id=p_user_id;
    INSERT INTO public.transactions(user_id,amount,description,status,method,rewarded,metadata) VALUES(p_user_id,0,'Lucky wheel prize','success','Wallet',true,jsonb_build_object('type','lucky_wheel_prize','prize_type','wallet','prize_amount',result_amount,'prize_label',result_label)) RETURNING id INTO prize_transaction;
    INSERT INTO public.wallet_ledger(user_id,transaction_id,entry_type,amount,description) VALUES(p_user_id,prize_transaction,'adjustment',result_amount,result_label);
    remaining:=remaining+result_amount;
  ELSE
    result_type:='account'; offer_uuid:=(selected->>'offer_id')::uuid;
    INSERT INTO public.transactions(user_id,amount,description,status,method,rewarded,metadata) VALUES(p_user_id,0,'Lucky wheel account prize','success','Wallet',true,jsonb_build_object('type','game_account_offer_purchase','offer_id',offer_uuid,'offer_type','individual','source','lucky_wheel','offer_title',result_label)) RETURNING id INTO prize_transaction;
  END IF;
  INSERT INTO public.lucky_wheel_spins(user_id,prize_type,prize_label,prize_amount,offer_id,transaction_id) VALUES(p_user_id,result_type,result_label,result_amount,offer_uuid,prize_transaction);
  RETURN jsonb_build_object('success',true,'prize_type',result_type,'prize_label',result_label,'prize_amount',result_amount,'prize_index',selected_index,'transaction_id',prize_transaction,'balance',remaining);
END;
$$;
REVOKE ALL ON FUNCTION public.spin_lucky_wheel(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.spin_lucky_wheel(text) TO service_role;
REVOKE ALL ON FUNCTION public.reserve_deliver_offer_account() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.release_offer_account_reservation() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.release_deleted_offer_account_reservation() FROM PUBLIC,anon,authenticated;

COMMIT;

