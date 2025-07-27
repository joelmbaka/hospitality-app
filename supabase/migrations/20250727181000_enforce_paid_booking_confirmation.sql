-- Auto-confirm bookings when the related order is paid
-- Generated 2025-07-27 by Cascade AI

-- 1. Trigger function ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_order_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when status just became 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    IF NEW.booking_id IS NOT NULL THEN
      -- Confirm the linked booking (if still pending)
      UPDATE bookings
      SET status      = 'confirmed',
          updated_at  = NOW()
      WHERE id = NEW.booking_id
        AND status <> 'confirmed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Trigger -----------------------------------------------------------------
DROP TRIGGER IF EXISTS order_paid_trigger ON orders;
CREATE TRIGGER order_paid_trigger
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_paid();

-- 3. Back-fill safety: confirm any historical bookings whose order is already paid
UPDATE bookings b
SET status = 'confirmed',
    updated_at = NOW()
FROM orders o
WHERE o.booking_id = b.id
  AND o.status = 'paid'
  AND b.status <> 'confirmed';
