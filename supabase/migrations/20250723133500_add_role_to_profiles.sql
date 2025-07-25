-- Add role column to profiles
ALTER TABLE profiles
ADD COLUMN role TEXT 
  CHECK (role IN ('guest', 'staff', 'admin', 'property_manager'));



-- Set default
UPDATE profiles
SET role = 'guest'
WHERE role IS NULL;



-- Update policies to use profiles.role
-- Example: Admin policy
DROP POLICY IF EXISTS "Admins can manage roles" ON profiles;
CREATE POLICY "Admins can manage roles"
ON profiles FOR UPDATE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Add trigger to set default role on new profiles
CREATE OR REPLACE FUNCTION set_default_role()
RETURNS TRIGGER AS $$
BEGIN
  NEW.role = 'guest';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_default_role_trigger
BEFORE INSERT ON profiles
FOR EACH ROW
WHEN (NEW.role IS NULL)
EXECUTE FUNCTION set_default_role();
