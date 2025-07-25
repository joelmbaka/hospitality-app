-- Adjust capacity CHECK to allow zero before seeding bookings
-- Generated 2025-07-25 (placed before sample bookings migration to ensure order)

ALTER TABLE availability
DROP CONSTRAINT IF EXISTS availability_capacity_check;

ALTER TABLE availability
ADD CONSTRAINT availability_capacity_check CHECK (capacity >= 0);
