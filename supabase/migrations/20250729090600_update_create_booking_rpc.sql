-- Update create_booking RPC to set property_id and resource_id on orders
-- Generated 2025-07-29 by Cascade AI

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
  v_resource   RECORD;
BEGIN
  -- Verify availability slot exists
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

  -- Fetch resource for property lookup (cache once)
  SELECT id, property_id INTO v_resource FROM resources WHERE id = i_resource_id;

  -- Insert booking
  INSERT INTO bookings(id, guest_id, resource_id, start_ts, end_ts, availability_id, price, status)
  VALUES (gen_random_uuid(), auth.uid(), i_resource_id, i_start_ts, i_end_ts, v_avail.id, v_avail.base_price, 'pending')
  RETURNING id INTO v_booking_id;

  -- Insert order with direct property/resource reference
  INSERT INTO orders(id, guest_id, booking_id, property_id, resource_id, total, status)
  VALUES (gen_random_uuid(), auth.uid(), v_booking_id, v_resource.property_id, v_resource.id, v_avail.base_price, 'initiated')
  RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;

-- Grant execute back
GRANT EXECUTE ON FUNCTION public.create_booking(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO anon, authenticated;
