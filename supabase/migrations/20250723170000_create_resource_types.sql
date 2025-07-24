-- Create resource_types table
CREATE TABLE resource_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type_id UUID NOT NULL REFERENCES service_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  specifications JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE resource_types ENABLE ROW LEVEL SECURITY;

-- Property manager access policy
CREATE POLICY "Property managers can manage resource types"
ON resource_types FOR ALL USING (
  EXISTS (
    SELECT 1 FROM property_managers pm
    JOIN service_types st ON st.property_id = pm.property_id
    WHERE pm.user_id = auth.uid()
    AND st.id = resource_types.service_type_id
  )
);
