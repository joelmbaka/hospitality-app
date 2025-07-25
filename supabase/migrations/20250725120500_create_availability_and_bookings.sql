-- Create availability and bookings core tables for resources
-- Generated 2025-07-25

/*
 This migration adds booking capability:
 1. availability: time-bound capacity & pricing for each resource
 2. bookings: reservations made by guests, referencing availability + resource
 3. triggers / functions for automatic timestamp updates and basic capacity enforcement
 4. row-level security policies for guests, property managers and admins
*/

-- Enable extension for GiST btree support
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1. AVAILABILITY -------------------------------------------------------------
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  start_ts TIMESTAMPTZ NOT NULL,
  end_ts   TIMESTAMPTZ NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0) DEFAULT 1,
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','held','blocked','booked','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Avoid overlapping slots for same resource
ALTER TABLE availability
  ADD CONSTRAINT no_availability_overlap EXCLUDE USING gist (
    resource_id WITH =,
    tstzrange(start_ts, end_ts) WITH &&
  );

-- Ensure start < end
ALTER TABLE availability ADD CONSTRAINT availability_start_before_end CHECK (start_ts < end_ts);

-- Enable RLS
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- Public (guests) can view only open slots
CREATE POLICY "Public can view open availability"
  ON availability FOR SELECT USING (status = 'open');

-- Property managers can manage slots for their property resources
CREATE POLICY "Property managers manage availability" ON availability
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM resources r
      JOIN property_managers pm ON pm.property_id = r.property_id
      WHERE r.id = availability.resource_id
        AND pm.user_id = auth.uid()
    )
  );

-- Admin full access
CREATE POLICY "Admins manage availability" ON availability
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 2. BOOKINGS ---------------------------------------------------------------
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  start_ts TIMESTAMPTZ NOT NULL,
  end_ts   TIMESTAMPTZ NOT NULL,
  availability_id UUID REFERENCES availability(id) ON DELETE SET NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

ALTER TABLE bookings ADD CONSTRAINT booking_start_before_end CHECK (start_ts < end_ts);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Guests see their own bookings
CREATE POLICY "Guests view own bookings" ON bookings
  FOR SELECT USING (guest_id = auth.uid());

-- Guests manage their pending/cancelled bookings
CREATE POLICY "Guests manage own bookings" ON bookings
  FOR UPDATE USING (guest_id = auth.uid()) WITH CHECK (guest_id = auth.uid());

-- Property managers see bookings for their resources
CREATE POLICY "Managers view bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM resources r
      JOIN property_managers pm ON pm.property_id = r.property_id
      WHERE r.id = bookings.resource_id
        AND pm.user_id = auth.uid()
    )
  );

-- Admins full access
CREATE POLICY "Admins manage bookings" ON bookings
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 3. Triggers ----------------------------------------------------------------
-- Re-use update_modified() function from global_functions migration
CREATE TRIGGER availability_modtime
BEFORE UPDATE ON availability
FOR EACH ROW EXECUTE FUNCTION update_modified();

CREATE TRIGGER bookings_modtime
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_modified();

-- Capacity decrement after booking confirmation
CREATE OR REPLACE FUNCTION handle_booking_confirm() RETURNS TRIGGER AS $$
BEGIN
  -- Only run on status change to confirmed
  IF NEW.status = 'confirmed' AND OLD.status <> 'confirmed' THEN
    UPDATE availability
    SET capacity = capacity - 1,
        status   = CASE WHEN capacity - 1 <= 0 THEN 'booked' ELSE status END
    WHERE id = NEW.availability_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_confirm_trigger
AFTER UPDATE ON bookings
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION handle_booking_confirm();

-- 4. Convenience view --------------------------------------------------------
CREATE OR REPLACE VIEW v_available_slots AS
SELECT a.*
FROM availability a
WHERE a.status = 'open' AND a.capacity > 0;
