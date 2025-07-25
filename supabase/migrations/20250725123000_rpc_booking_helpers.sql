-- RPC helpers for bookings
-- Generated 2025-07-25

/*
  create_booking(resource_id, start_ts, end_ts) RETURNS UUID
    • Validates overlapping availability & capacity
    • Inserts bookings row (status pending) linked to availability slot
    • Returns booking id

  cancel_booking(booking_id) RETURNS BOOLEAN
    • Sets status cancelled if guest owns booking
    • Restores capacity on availability
*/

-- create_booking -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_booking(
  i_resource_id UUID,
  i_start_ts    TIMESTAMPTZ,
  i_end_ts      TIMESTAMPTZ
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  avail_id UUID;
  booking_id UUID;
BEGIN
  -- find open slot with capacity
  SELECT id INTO avail_id
  FROM availability
  WHERE resource_id = i_resource_id
    AND start_ts = i_start_ts
    AND end_ts   = i_end_ts
    AND status = 'open'
    AND capacity > 0
  LIMIT 1;

  IF avail_id IS NULL THEN
    RAISE EXCEPTION 'No availability for the specified slot.';
  END IF;

  -- insert booking (pending)
  INSERT INTO bookings(id, guest_id, resource_id, start_ts, end_ts, availability_id, price, status)
  VALUES (gen_random_uuid(), auth.uid(), i_resource_id, i_start_ts, i_end_ts, avail_id, 0, 'pending')
  RETURNING id INTO booking_id;

  RETURN booking_id;
END; $$;

GRANT EXECUTE ON FUNCTION public.create_booking(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO anon, authenticated;

-- cancel_booking -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_booking(i_booking_id UUID) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_avail_id UUID;
BEGIN
  -- ensure ownership
  IF NOT EXISTS (SELECT 1 FROM bookings WHERE id = i_booking_id AND guest_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not owner of booking';
  END IF;

  UPDATE bookings
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = i_booking_id
    AND status <> 'cancelled';

  -- restore capacity
  SELECT availability_id INTO v_avail_id FROM bookings WHERE id = i_booking_id;
  IF v_avail_id IS NOT NULL THEN
    UPDATE availability
    SET capacity = capacity + 1,
        status   = 'open'
    WHERE id = v_avail_id;
  END IF;
  RETURN TRUE;
END; $$;

GRANT EXECUTE ON FUNCTION public.cancel_booking(UUID) TO authenticated;
