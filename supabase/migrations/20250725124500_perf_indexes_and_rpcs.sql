-- Performance indexes + confirm_booking RPC + enhanced cancel_booking
-- Generated 2025-07-25 12:45 UTC

/*
  1. Indexes for frequent look-ups
  2. confirm_booking() – sets status to confirmed, relies on trigger to reduce capacity
  3. Updated cancel_booking() – checks date, role, and restores capacity only for future stays
*/

-- 1. INDEXES -----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_availability_resource_start 
  ON availability(resource_id, start_ts);

CREATE INDEX IF NOT EXISTS idx_bookings_guest 
  ON bookings(guest_id);

CREATE INDEX IF NOT EXISTS idx_bookings_resource_start 
  ON bookings(resource_id, start_ts);

CREATE INDEX IF NOT EXISTS idx_orders_guest_created 
  ON orders(guest_id, created_at DESC);

-- 2. confirm_booking RPC -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_booking(i_booking_id UUID) 
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_allowed BOOLEAN;
BEGIN
  -- check permission: guest owns booking OR property manager of resource OR admin
  SELECT EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = i_booking_id
      AND (
        b.guest_id = auth.uid() OR
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' OR
        EXISTS (
          SELECT 1 FROM resources r
          JOIN property_managers pm ON pm.property_id = r.property_id
          WHERE r.id = b.resource_id AND pm.user_id = auth.uid()
        )
      )
  ) INTO v_allowed;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to confirm booking %', i_booking_id;
  END IF;

  -- update booking if still pending
  UPDATE bookings
  SET status = 'confirmed', updated_at = NOW()
  WHERE id = i_booking_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE NOTICE 'Booking not in pending state or already confirmed.';
  END IF;
  RETURN TRUE;
END; $$;

GRANT EXECUTE ON FUNCTION public.confirm_booking(UUID) TO authenticated;

-- 3. Enhanced cancel_booking -------------------------------------------------
DROP FUNCTION IF EXISTS public.cancel_booking(UUID);

CREATE FUNCTION public.cancel_booking(i_booking_id UUID) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_avail_id UUID;
  v_start_ts TIMESTAMPTZ;
  v_is_owner BOOLEAN;
  v_is_admin BOOLEAN;
  v_is_manager BOOLEAN;
BEGIN
  SELECT guest_id, availability_id, start_ts
  INTO  v_is_owner, v_avail_id, v_start_ts
  FROM bookings WHERE id = i_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  v_is_owner   := (SELECT guest_id FROM bookings WHERE id = i_booking_id) = auth.uid();
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

  -- restore capacity only if booking is in future
  IF v_avail_id IS NOT NULL AND v_start_ts > NOW() THEN
    UPDATE availability
    SET capacity = capacity + 1,
        status   = 'open'
    WHERE id = v_avail_id;
  END IF;
  RETURN TRUE;
END; $$;

GRANT EXECUTE ON FUNCTION public.cancel_booking(UUID) TO authenticated;
