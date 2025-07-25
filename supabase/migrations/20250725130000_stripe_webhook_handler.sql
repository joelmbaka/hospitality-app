-- Stripe webhook support: orders table tweak + JSON handler function
-- Generated 2025-07-25 13:00 UTC

-- 1. Column for payment intent id -------------------------------------------
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- 2. Handler function --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_stripe_event(evt JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 3. Grant execute to service_role (edge functions)
GRANT EXECUTE ON FUNCTION public.handle_stripe_event(JSONB) TO service_role;
