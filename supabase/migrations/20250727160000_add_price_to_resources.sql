-- Add price column to resources table
-- Generated 2025-07-27

ALTER TABLE resources
ADD COLUMN price NUMERIC(10,2);

-- If you want to enforce prices for specific service types (e.g. rooms) only,
-- add a CHECK constraint instead of NOT NULL for flexibility, e.g:
-- ALTER TABLE resources ADD CONSTRAINT resources_price_check CHECK (
--   service_id IN (SELECT id FROM services WHERE name IN ('accommodation')) AND price IS NOT NULL
--   OR price IS NULL
-- );

-- No RLS changes needed.
