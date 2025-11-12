-- Add service role bypass for profile creation during signup
DROP POLICY IF EXISTS "Users can insert their own profile" ON users_profile;

CREATE POLICY "Users can insert their own profile" ON users_profile
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');
