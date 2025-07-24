-- Create user_roles table with default role assignment
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('guest', 'staff', 'admin', 'property_manager')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Security Policy: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON user_roles
FOR SELECT USING (user_id = auth.uid());

-- Security Policy: Prevent users from modifying their own roles
CREATE POLICY "Users cannot update their own roles"
ON user_roles
FOR UPDATE USING (user_id != auth.uid());

-- Security Policy: Only admins can manage roles
CREATE POLICY "Only admins can manage roles"
ON user_roles
FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.uid() 
          AND ur.role = 'admin')
);

-- Function to automatically assign default role
CREATE FUNCTION public.assign_default_role()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'guest');
  RETURN NEW;
END;
$$;

-- Trigger for new users
CREATE TRIGGER on_profile_created
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE public.assign_default_role();