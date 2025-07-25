-- Commerce layer: menus, meal items, orders
-- Generated 2025-07-25

/*
  Adds dining / ordering capability:
  1. menus          : lists available food & drink per resource (e.g., restaurant)
  2. meal_items     : individual dishes/beverages under a menu
  3. orders         : placed by guests, optionally linked to a booking
  4. order_items    : line items within an order
  Includes RLS policies and timestamp triggers.
*/

-- 0. Prerequisites -----------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS btree_gist; -- safe if already installed

-- 1. MENUS -------------------------------------------------------------------
CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

-- Public can view menus
CREATE POLICY "Menus are viewable by everyone" ON menus FOR SELECT USING (true);

-- Property managers manage their menus
CREATE POLICY "Managers manage menus" ON menus
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM resources r
      JOIN property_managers pm ON pm.property_id = r.property_id
      WHERE r.id = menus.resource_id AND pm.user_id = auth.uid()
    )
  );

-- Admin full access
CREATE POLICY "Admins manage menus" ON menus
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Trigger
CREATE TRIGGER menus_modtime
BEFORE UPDATE ON menus
FOR EACH ROW EXECUTE FUNCTION update_modified();

-- 2. MEAL ITEMS --------------------------------------------------------------
CREATE TABLE meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  category TEXT,
  tags TEXT[],
  specifications JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;

-- Public view
CREATE POLICY "Meal items viewable by everyone" ON meal_items FOR SELECT USING (true);

-- Managers manage their meal items (through menu->resource)
CREATE POLICY "Managers manage meal items" ON meal_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM menus m
      JOIN resources r ON r.id = m.resource_id
      JOIN property_managers pm ON pm.property_id = r.property_id
      WHERE m.id = meal_items.menu_id AND pm.user_id = auth.uid()
    )
  );

-- Admin full access
CREATE POLICY "Admins manage meal items" ON meal_items
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Trigger
CREATE TRIGGER meal_items_modtime
BEFORE UPDATE ON meal_items
FOR EACH ROW EXECUTE FUNCTION update_modified();

-- 3. ORDERS ------------------------------------------------------------------
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated','pending','paid','completed','cancelled','refunded')),
  stripe_client_secret TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Guests manage/view own orders
CREATE POLICY "Guests manage own orders" ON orders
  FOR ALL USING (guest_id = auth.uid());

-- Admin full access
CREATE POLICY "Admins manage orders" ON orders
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Trigger
CREATE TRIGGER orders_modtime
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_modified();

-- 4. ORDER ITEMS -------------------------------------------------------------
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  meal_item_id UUID NOT NULL REFERENCES meal_items(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00
);

-- Index for lookups
CREATE INDEX idx_order_items_order ON order_items(order_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Inherit order RLS via join
CREATE POLICY "Access order items via orders" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND (
        o.guest_id = auth.uid() OR
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
      )
    )
  );

-- Trigger not needed (no updated_at) but can be added later
