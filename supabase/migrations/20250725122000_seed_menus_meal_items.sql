-- Fixed seed for menus & meal_items (handles missing unique constraint)
-- Generated 2025-07-25

DO $$
DECLARE
  dining_service_id UUID;
BEGIN
  -- get or create 'Dining' service
  SELECT id INTO dining_service_id FROM services WHERE lower(name) = 'dining' LIMIT 1;
  IF dining_service_id IS NULL THEN
    INSERT INTO services (id, name, description)
    VALUES (gen_random_uuid(), 'Dining', 'Food & beverage services')
    RETURNING id INTO dining_service_id;
  END IF;

  -- insert Dinner menu for each dining resource
  INSERT INTO menus (id, resource_id, name, description, created_at)
  SELECT gen_random_uuid(), r.id, 'Dinner', 'Evening à-la-carte menu', NOW()
  FROM resources r
  WHERE r.service_id = dining_service_id
    AND NOT EXISTS (
      SELECT 1 FROM menus m WHERE m.resource_id = r.id AND m.name = 'Dinner'
    );

  -- insert sample meal items into each Dinner menu
  INSERT INTO meal_items (id, menu_id, name, description, price, category, created_at)
  SELECT gen_random_uuid(), m.id, x.name, x.description, x.price, x.category, NOW()
  FROM menus m
  JOIN (
    VALUES
      ('Samaki wa Kupaka', 'Char-grilled coconut fish', 1200::numeric, 'Main'),
      ('Ugali na Sukuma',   'Maize meal with collard greens', 500::numeric, 'Side'),
      ('Kachumbari',        'Tomato & onion salad', 300::numeric, 'Side'),
      ('Tropical Juice',    'Fresh fruit blend', 350::numeric, 'Drink')
  ) AS x(name, description, price, category) ON TRUE
  WHERE m.name = 'Dinner'
    AND NOT EXISTS (
      SELECT 1 FROM meal_items mi
      WHERE mi.menu_id = m.id AND mi.name = x.name
    );
END $$;
