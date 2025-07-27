-- Seed realistic price values for existing resources
-- Generated 2025-07-27

DO $$
BEGIN
  -- Accommodation (rooms & suites)
  UPDATE resources SET price = 120.00 WHERE id = 'a80c751a-9296-48d0-8fd1-370b09a7f653'; -- Standard Room
  UPDATE resources SET price = 220.00 WHERE id = 'dcfe20bc-982e-4fd2-b9cf-af2c20731bbc'; -- Deluxe Room (ocean-view)
  UPDATE resources SET price = 800.00 WHERE id = 'cb01c46b-8786-4d89-987d-7de37c696009'; -- Beachfront Villa
  UPDATE resources SET price = 200.00 WHERE id = '95440e15-ead5-4d62-8ff6-fff410a94141'; -- Deluxe Room (sea-facing)
  UPDATE resources SET price = 350.00 WHERE id = '85d84ab9-baa8-44a7-9b91-93d2e3354f58'; -- Family Suite
  UPDATE resources SET price = 180.00 WHERE id = 'e0396b08-c30b-44e4-9fe0-000cc5358e31'; -- Swahili Suite

  -- Dining venues (approx. avg. spend per guest)
  UPDATE resources SET price = 8.00  WHERE id = '7f41469e-6323-46e9-b14f-38b128b405e3';  -- Pool Bar
  UPDATE resources SET price = 75.00 WHERE id = '97a2c8ce-1e21-45f4-87cb-161e1633e4d1'; -- Fine-Dining Restaurant
  UPDATE resources SET price = 40.00 WHERE id = '6a6338f1-02b6-4440-8908-31dd50c141bf'; -- Rooftop Lounge
  UPDATE resources SET price = 30.00 WHERE id = '689f2888-6dcd-419b-a02f-6b3dbc360721'; -- Garden Restaurant

  -- Event spaces (venue hire per day)
  UPDATE resources SET price = 1500.00 WHERE id = 'e64a7b05-13e9-4689-9d9a-a2cb649eb8fe'; -- Grand Ballroom
  UPDATE resources SET price = 900.00  WHERE id = '2078913b-d70a-4471-9d79-2b2578c8dced'; -- Conference Hall
  UPDATE resources SET price = 1000.00 WHERE id = 'aeba0fa3-da70-44fd-b755-a7a943ea41e9'; -- Beach Gazebo

  -- Fallback: assign a reasonable default if any remaining resources lack price
  UPDATE resources SET price = 100.00
  WHERE price IS NULL;
END;
$$;

-- Note: prices are stored as NUMERIC(10,2) so they retain cents precision.
