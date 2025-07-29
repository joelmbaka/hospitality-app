-- Add property_id and resource_id columns to orders for direct traceability
-- Generated 2025-07-29 by Cascade AI

-- 1. Schema changes -----------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resource_id UUID REFERENCES resources(id) ON DELETE SET NULL;

-- 2. Back-fill existing rows where possible (best-effort) ----------------------
UPDATE orders o
SET property_id = r.property_id,
    resource_id = b.resource_id
FROM bookings b
JOIN resources r ON r.id = b.resource_id
WHERE o.booking_id = b.id
  AND (o.property_id IS NULL OR o.resource_id IS NULL);

-- 3. Row-level security for property managers ---------------------------------
DROP POLICY IF EXISTS "Managers view orders for their properties" ON orders;
CREATE POLICY "Managers view orders for their properties" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM property_managers pm
      WHERE pm.property_id = orders.property_id
        AND pm.user_id = auth.uid()
    )
  );

-- (Guests and admins policies already exist and remain unchanged)
