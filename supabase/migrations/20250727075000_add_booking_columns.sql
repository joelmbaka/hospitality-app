-- Add missing columns to bookings table to support multiple booking contexts
-- Generated 2025-07-27 (cascade AI)

-- 1. Add booking_type column
ALTER TABLE bookings
  ADD COLUMN booking_type TEXT NOT NULL DEFAULT 'room'
    CHECK (booking_type IN ('room', 'meal', 'event'));

-- 2. Add guests column (number of guests / pax)
ALTER TABLE bookings
  ADD COLUMN guests INTEGER NOT NULL DEFAULT 1 CHECK (guests > 0);

-- 3. Optional convenience index for quick look-ups by booking_type
CREATE INDEX IF NOT EXISTS bookings_booking_type_idx ON bookings (booking_type);

-- No RLS policy changes required – existing policies remain valid.
