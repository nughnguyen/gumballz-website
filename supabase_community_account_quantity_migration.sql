-- Remove the fixed 50-account ceiling for community-account purchases.
-- The API still validates requested quantity against the available encrypted account pool
-- and preserves the existing transaction amount ceiling.
DO $migration$
DECLARE
  function_definition text;
  updated_definition text;
BEGIN
  SELECT pg_catalog.pg_get_functiondef(
    'public.reserve_deliver_offer_account()'::regprocedure
  ) INTO function_definition;
  updated_definition := pg_catalog.regexp_replace(
    function_definition,
    $pattern$requested_quantity\s*<\s*1\s+OR\s+requested_quantity\s*>\s*50$pattern$,
    'requested_quantity < 1'
  );
  IF updated_definition = function_definition AND function_definition ~ 'requested_quantity\s*>\s*50' THEN
    RAISE EXCEPTION 'Could not update reserve_deliver_offer_account quantity limit';
  END IF;
  IF updated_definition <> function_definition THEN
    EXECUTE updated_definition;
  END IF;

  SELECT pg_catalog.pg_get_functiondef(
    'public.buy_game_account_offer_with_wallet(text,uuid,uuid,integer)'::regprocedure
  ) INTO function_definition;
  updated_definition := pg_catalog.regexp_replace(
    function_definition,
    $pattern$p_quantity\s*<\s*1\s+OR\s+p_quantity\s*>\s*50\s+OR$pattern$,
    'p_quantity < 1 OR'
  );
  IF updated_definition = function_definition AND function_definition ~ 'p_quantity\s*>\s*50' THEN
    RAISE EXCEPTION 'Could not update wallet purchase quantity limit';
  END IF;
  IF updated_definition <> function_definition THEN
    EXECUTE updated_definition;
  END IF;
END;
$migration$;
