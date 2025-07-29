-- Scale price-related columns to realistic Kenyan Shilling (KES) figures
-- Generated 2025-07-28 by Cascade AI
--
-- Earlier seed data used USD-like figures (e.g. 120.00) that are
-- unreasonably low once displayed as KES.  We correct this by scaling
-- any price / total that is below 1,000 by ×100.  This brings typical
-- room rates such as 120 → 12,000 KES, deluxe 220 → 22,000 KES, etc.
--
-- As these resources are demo data only, and no live transactions have
-- occurred yet, it is safe to update *initiated* or *pending* commerce
-- rows.  Paid / completed rows are left untouched.

DO $$
BEGIN
  -------------------------------------------------------------------
  -- 1. Resources table (primary source of pricing)
  -------------------------------------------------------------------
  UPDATE resources
     SET price = price * 100
   WHERE price < 1000;

  -------------------------------------------------------------------
  -- 2. Availability slots (mirror the resource base price)
  -------------------------------------------------------------------
  UPDATE availability
     SET base_price = base_price * 100
   WHERE base_price < 1000;

  -------------------------------------------------------------------
  -- 3. Bookings – only update those still PENDING
  -------------------------------------------------------------------
  UPDATE bookings
     SET price = price * 100
   WHERE status = 'pending' AND price < 1000;

  -------------------------------------------------------------------
  -- 4. Orders – only update those still INITIATED (awaiting payment)
  -------------------------------------------------------------------
  UPDATE orders
     SET total = total * 100
   WHERE status = 'initiated' AND total < 1000;
END;
$$;

-- No RLS changes required; updates executed as migration owner.
