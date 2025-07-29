-- Align availability.base_price to match the updated resources.price values
-- Generated 2025-07-28 by Cascade AI

DO $$
BEGIN
  -------------------------------------------------------------------
  -- 1. Sync base_price with resources.price where different
  -------------------------------------------------------------------
  UPDATE availability AS a
     SET base_price = r.price
    FROM resources r
   WHERE r.id = a.resource_id
     AND r.price <> a.base_price;

  -------------------------------------------------------------------
  -- 2. Update any still-pending bookings whose stored price
  --    no longer matches the associated resource price.
  -------------------------------------------------------------------
  UPDATE bookings AS b
     SET price = r.price
    FROM availability a
         JOIN resources r ON r.id = a.resource_id
   WHERE b.availability_id = a.id
     AND b.status = 'pending'
     AND b.price <> r.price;

  -------------------------------------------------------------------
  -- 3. Update any initiated orders to keep totals consistent
  --    with the corrected booking / resource price.
  -------------------------------------------------------------------
  UPDATE orders AS o
     SET total = r.price
    FROM bookings b
         JOIN availability a ON a.id = b.availability_id
         JOIN resources   r ON r.id = a.resource_id
   WHERE o.booking_id = b.id
     AND o.status = 'initiated'
     AND o.total <> r.price;
END;
$$;
