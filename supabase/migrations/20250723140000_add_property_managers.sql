-- Step 1: Create property_managers table
CREATE TABLE property_managers (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, property_id)
);

-- Add comments
COMMENT ON TABLE property_managers IS 'Assignment of managers to properties';
COMMENT ON COLUMN property_managers.user_id IS 'References profiles.id';

-- Step 2: Enable RLS for property_managers
ALTER TABLE property_managers ENABLE ROW LEVEL SECURITY;

-- Policy: Property managers can view their own assignments
CREATE POLICY "Property managers can view their assignments"
ON property_managers
FOR SELECT USING (user_id = auth.uid());

-- Policy: Admins can manage all property manager assignments
CREATE POLICY "Admins can manage property assignments"
ON property_managers FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Step 3: Update properties table policies
DROP POLICY IF EXISTS "Property managers can manage properties" ON properties;
CREATE POLICY "Property managers can manage properties"
ON properties
FOR ALL USING (
  EXISTS (SELECT 1 FROM property_managers 
          WHERE property_id = properties.id 
          AND user_id = auth.uid())
);

-- Step 4: (service_types table removed; policies obsolete)
-- service_types table dropped - no policy needed
-- legacy policy removed


-- Add indexes for performance
CREATE INDEX idx_property_managers_user_id ON property_managers(user_id);
CREATE INDEX idx_property_managers_property_id ON property_managers(property_id);

-- Create indexes
CREATE INDEX idx_pmanagers_user ON property_managers(user_id);
CREATE INDEX idx_pmanagers_property ON property_managers(property_id);

-- Add timestamp automation
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_property_managers_modtime
BEFORE UPDATE ON property_managers
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER property_managers_modtime
BEFORE UPDATE ON property_managers
FOR EACH ROW EXECUTE FUNCTION update_modified();

-- legacy service_types update policy removed
