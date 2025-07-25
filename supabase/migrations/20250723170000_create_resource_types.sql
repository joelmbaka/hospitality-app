-- Create resources table
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  specifications JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Property manager access policy
CREATE POLICY "Property managers can manage resources"
ON resources FOR ALL USING (
  EXISTS (
    SELECT 1 FROM property_managers pm
    WHERE pm.user_id = auth.uid()
      AND pm.property_id = resources.property_id
  )
);
