-- Fix cancel_booking RPC: correct variable types
-- Generated 2025-07-25 12:50 UTC

DROP FUNCTION IF EXISTS public.cancel_booking(UUID);

CREATE FUNCTION public.cancel_booking(i_booking_id UUID) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_guest_id  UUID;
  v_avail_id  UUID;
  v_start_ts  TIMESTAMPTZ;
  v_is_owner  BOOLEAN;
  v_is_admin  BOOLEAN;
  v_is_manager BOOLEAN;
BEGIN
  SELECT guest_id, availability_id, start_ts
  INTO  v_guest_id, v_avail_id, v_start_ts
  FROM bookings WHERE id = i_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  v_is_owner   := (v_guest_id = auth.uid());
  v_is_admin   := (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin';
  v_is_manager := EXISTS (
      SELECT 1 FROM bookings b
      JOIN resources r ON r.id = b.resource_id
      JOIN property_managers pm ON pm.property_id = r.property_id
      WHERE b.id = i_booking_id AND pm.user_id = auth.uid()
  );

  IF NOT (v_is_owner OR v_is_admin OR v_is_manager) THEN
    RAISE EXCEPTION 'Not authorized to cancel booking';
  END IF;

  -- perform cancel only if not already cancelled
  UPDATE bookings 
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = i_booking_id AND status <> 'cancelled';

  -- restore capacity only if booking is in future and slot exists
  IF v_avail_id IS NOT NULL AND v_start_ts > NOW() THEN
    UPDATE availability
    SET capacity = capacity + 1,
        status   = 'open'
    WHERE id = v_avail_id;
  END IF;
  RETURN TRUE;
END; $$;

GRANT EXECUTE ON FUNCTION public.cancel_booking(UUID) TO authenticated;
