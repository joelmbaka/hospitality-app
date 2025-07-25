-- Disable RLS inside handle_stripe_event so updates succeed
-- Generated 2025-07-25 13:05 UTC

CREATE OR REPLACE FUNCTION public.handle_stripe_event(evt JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = off
AS $$
DECLARE
  v_type   TEXT := evt->>'type';
  v_object JSONB := evt->'data'->'object';
  v_intent TEXT := v_object->>'id';
  v_order  UUID  := (v_object->'metadata'->>'order_id')::uuid;
BEGIN
  IF v_order IS NULL THEN
    RAISE NOTICE 'Stripe event missing order_id metadata';
    RETURN FALSE;
  END IF;

  IF v_type = 'payment_intent.succeeded' THEN
    UPDATE orders
    SET status = 'paid',
        stripe_payment_intent_id = v_intent,
        updated_at = NOW()
    WHERE id = v_order;
  ELSIF v_type IN ('payment_intent.payment_failed', 'payment_intent.canceled') THEN
    UPDATE orders
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE id = v_order;
  ELSE
    RAISE NOTICE 'Unhandled stripe event %', v_type;
  END IF;
  RETURN TRUE;
END;
$$;
