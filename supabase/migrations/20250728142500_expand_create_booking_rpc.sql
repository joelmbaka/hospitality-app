-- Expand create_booking RPC to create an order atomically and return the new order_id
-- Generated 2025-07-28 by Cascade AI

-- 1. Ensure guests can insert their own bookings
DROP POLICY IF EXISTS "Guests create bookings" ON bookings;
CREATE POLICY "Guests create bookings" ON bookings
  FOR INSERT WITH CHECK (guest_id = auth.uid());

-- 2. Replace create_booking to also insert an order and return its id
CREATE OR REPLACE FUNCTION public.create_booking(
  i_resource_id UUID,
  i_start_ts    TIMESTAMPTZ,
  i_end_ts      TIMESTAMPTZ
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avail      RECORD;
  v_booking_id UUID;
  v_order_id   UUID;
BEGIN
  -- Fetch an open availability slot (capacity > 0)
  SELECT * INTO v_avail
  FROM availability
  WHERE resource_id = i_resource_id
    AND start_ts = i_start_ts
    AND end_ts   = i_end_ts
    AND status   = 'open'
    AND capacity > 0
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No availability for the specified slot.';
  END IF;

  -- Insert booking (status pending)
  INSERT INTO bookings(id, guest_id, resource_id, start_ts, end_ts, availability_id, price, status)
  VALUES (gen_random_uuid(), auth.uid(), i_resource_id, i_start_ts, i_end_ts, v_avail.id, v_avail.base_price, 'pending')
  RETURNING id INTO v_booking_id;

  -- Insert order linked to booking (status initiated)
  INSERT INTO orders(id, guest_id, booking_id, total, status)
  VALUES (gen_random_uuid(), auth.uid(), v_booking_id, v_avail.base_price, 'initiated')
  RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;

-- Grant execute back to anon & authenticated
GRANT EXECUTE ON FUNCTION public.create_booking(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO anon, authenticated;
