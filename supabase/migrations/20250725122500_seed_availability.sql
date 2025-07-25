-- Seed availability for accommodation resources for next 90 days
-- Generated 2025-07-25

DO $$
DECLARE
  acc_service_id UUID;
BEGIN
  SELECT id INTO acc_service_id FROM services WHERE lower(name) = 'accommodation' LIMIT 1;
  IF acc_service_id IS NULL THEN
    RAISE NOTICE 'Accommodation service not found, skipping availability seeds.';
    RETURN;
  END IF;

  -- Insert daily slots (check-in 14:00, checkout next day 10:00) for 90 days ahead
  INSERT INTO availability (id, resource_id, start_ts, end_ts, capacity, base_price, status, created_at)
  SELECT gen_random_uuid(), r.id,
         gs::date + time '14:00',
         gs::date + time '10:00' + interval '1 day',
         1,
         COALESCE((r.specifications->>'base_price')::numeric, 15000),  -- fallback price
         'open',
         NOW()
  FROM resources r
  JOIN generate_series(current_date, current_date + interval '89 day', interval '1 day') AS gs ON TRUE
  LEFT JOIN availability a
    ON a.resource_id = r.id AND a.start_ts = gs::date + time '14:00'
  WHERE r.service_id = acc_service_id
    AND a.id IS NULL;
END $$;
