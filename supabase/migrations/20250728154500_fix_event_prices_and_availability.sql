-- Correct event resource prices that remained in 1–2k range and seed one open
-- availability slot for each so the Events booking flow can operate.
-- Generated 2025-07-28 by Cascade AI

-- Fix event resource prices and ensure availability slots
-- Cascade 2025-07-28

-- 1. Scale low event prices to realistic KES values
UPDATE resources SET price = price * 100
WHERE id IN ('e64a7b05-13e9-4689-9d9a-a2cb649eb8fe', -- Grand Ballroom
              'aeba0fa3-da70-44fd-b755-a7a943ea41e9'); -- Beach Gazebo

-- 2. Bring availability.base_price in sync
UPDATE availability a
   SET base_price = r.price
  FROM resources r
 WHERE r.id = a.resource_id
   AND a.resource_id IN ('e64a7b05-13e9-4689-9d9a-a2cb649eb8fe',
                         'aeba0fa3-da70-44fd-b755-a7a943ea41e9')
   AND a.base_price <> r.price;

-- 3. Insert one future open slot for any event resource lacking availability
INSERT INTO availability (id, resource_id, start_ts, end_ts, capacity, base_price, status)
SELECT gen_random_uuid(), r.id,
       date_trunc('day', now() + INTERVAL '7 days') + INTERVAL '08:00',
       date_trunc('day', now() + INTERVAL '7 days') + INTERVAL '18:00',
       10, r.price, 'open'
FROM resources r
LEFT JOIN availability a ON a.resource_id = r.id AND a.status = 'open' AND a.start_ts > now()
WHERE r.id IN ('e64a7b05-13e9-4689-9d9a-a2cb649eb8fe',
               'aeba0fa3-da70-44fd-b755-a7a943ea41e9',
               '2078913b-d70a-4471-9d79-2b2578c8dced')
  AND a.id IS NULL;

-- end of migration
/*
DECLARE
  v_now  TIMESTAMPTZ := now();
  v_id   UUID;
BEGIN
  -- ------------------------------------------------------------------
  -- 1. Bring event prices into realistic KES range
  -- ------------------------------------------------------------------
  UPDATE resources SET price = price * 100
  WHERE id IN ('e64a7b05-13e9-4689-9d9a-a2cb649eb8fe',  -- Grand Ballroom 1500 → 150 000
                'aeba0fa3-da70-44fd-b755-a7a943ea41e9')  -- Beach Gazebo 1000 → 100 000;

  -- ------------------------------------------------------------------
  -- 2. Sync existing availability.base_price with new prices, if rows exist
  -- ------------------------------------------------------------------
  UPDATE availability a
     SET base_price = r.price
    FROM resources r
   WHERE r.id = a.resource_id
     AND a.resource_id IN ('e64a7b05-13e9-4689-9d9a-a2cb649eb8fe',
                           'aeba0fa3-da70-44fd-b755-a7a943ea41e9')
     AND a.base_price <> r.price;

  -- ------------------------------------------------------------------
  -- 3. Insert one future availability slot per event if none exist
  --    (so the mobile app finds an "open" row)
  -- ------------------------------------------------------------------
  FOR v_id IN SELECT id FROM resources WHERE id IN (
      'e64a7b05-13e9-4689-9d9a-a2cb649eb8fe',
      'aeba0fa3-da70-44fd-b755-a7a943ea41e9',
      '2078913b-d70a-4471-9d79-2b2578c8dced')
  LOOP
    IF NOT EXISTS (SELECT 1 FROM availability WHERE resource_id = v_id AND status = 'open' AND start_ts > v_now) THEN
      INSERT INTO availability(id, resource_id, start_ts, end_ts, capacity, base_price, status)
      VALUES (gen_random_uuid(),
              v_id,
              date_trunc('day', v_now + INTERVAL '7 days') + INTERVAL '08:00',
              date_trunc('day', v_now + INTERVAL '7 days') + INTERVAL '18:00',
              10,
              (SELECT price FROM resources WHERE id = v_id),
              'open');
    END IF;
  END LOOP;
END;
$$;
*/
