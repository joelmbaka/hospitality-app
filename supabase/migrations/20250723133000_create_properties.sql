-- Create properties table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hotel', 'restaurant', 'venue', 'resort', 'lodging')),
  description TEXT,
  location TEXT,
  address JSONB NOT NULL,
  contact_info JSONB,
  operational_hours JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Add comments for documentation
COMMENT ON TABLE properties IS 'Physical locations offering hospitality services';
COMMENT ON COLUMN properties.location IS 'Geospatial coordinates (EPSG:4326)';
COMMENT ON COLUMN properties.address IS 'Full address in structured JSON format';
COMMENT ON COLUMN properties.contact_info IS 'Phone, email, and other contact details';
COMMENT ON COLUMN properties.operational_hours IS 'Operating hours for each day of the week';

-- Create service_types table
CREATE TABLE service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (name IN ('accommodation', 'dining', 'events', 'comprehensive')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for both tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;

-- Security Policies
CREATE POLICY "Properties are viewable by everyone" 
ON properties 
FOR SELECT USING (true);

CREATE POLICY "Service types are viewable by everyone" 
ON service_types 
FOR SELECT USING (true);

-- Note: We'll create the property_managers table in a separate migration
-- For now, we leave the more complex policies commented out until that table exists
/*
CREATE POLICY "Property managers can manage properties"
ON properties
FOR ALL USING (
  EXISTS (SELECT 1 FROM property_managers WHERE property_id = properties.id AND user_id = auth.uid())
);

CREATE POLICY "Property managers can manage service types"
ON service_types
FOR ALL USING (
  EXISTS (SELECT 1 FROM property_managers WHERE property_id = service_types.property_id AND user_id = auth.uid())
);
*/

-- Create indexes
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_service_types_property ON service_types(property_id);

-- Add timestamp automation
CREATE TRIGGER properties_modtime
BEFORE UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION update_modified();
