-- Seed sample bookings and orders for demo/testing
-- Generated 2025-07-25

DO $$
DECLARE
  v_guest_id UUID;
  v_booking_id UUID;
  v_order_id UUID;
  avail_row RECORD;
  menu_item_id UUID;
BEGIN
  -- 1. Ensure at least one guest profile exists --------------------------------
  SELECT id INTO v_guest_id FROM profiles WHERE role = 'guest' LIMIT 1;
  IF v_guest_id IS NULL THEN
    v_guest_id := gen_random_uuid();
    INSERT INTO profiles (id, role, full_name)
    VALUES (v_guest_id, 'guest', 'Sample Guest');
  END IF;

  -- 2. Pick two open availability slots ---------------------------------------
  FOR avail_row IN
    SELECT a.*
    FROM availability a
    WHERE a.status = 'open'
    ORDER BY a.start_ts
    LIMIT 2
  LOOP
    -- 2a. Insert booking (confirmed via trigger path) -------------------------
    INSERT INTO bookings (id, guest_id, resource_id, start_ts, end_ts, availability_id, price, status)
    VALUES (gen_random_uuid(), v_guest_id, avail_row.resource_id, avail_row.start_ts, avail_row.end_ts, avail_row.id, avail_row.base_price, 'pending')
    RETURNING id INTO v_booking_id;

    -- Confirm booking to trigger capacity decrement
    UPDATE bookings SET status = 'confirmed' WHERE id = v_booking_id;

    -- 3. Create order linked to booking ---------------------------------------
    INSERT INTO orders (id, guest_id, booking_id, total, status, stripe_client_secret)
    VALUES (gen_random_uuid(), v_guest_id, v_booking_id, 0, 'paid', 'test_secret')
    RETURNING id INTO v_order_id;

    -- 3a. Pick first meal item to add to order --------------------------------
    SELECT id INTO menu_item_id FROM meal_items ORDER BY name LIMIT 1;
    IF menu_item_id IS NOT NULL THEN
      INSERT INTO order_items (order_id, meal_item_id, quantity, price)
      SELECT v_order_id, mi.id, 2, mi.price*2
      FROM meal_items mi
      WHERE mi.id = menu_item_id;

      -- Update order total
      UPDATE orders SET total = (SELECT SUM(price) FROM order_items oi WHERE oi.order_id = v_order_id)
      WHERE id = v_order_id;
    END IF;
  END LOOP;
END $$;
