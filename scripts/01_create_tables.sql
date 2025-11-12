-- Create users profile table
CREATE TABLE IF NOT EXISTS users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('owner', 'seeker')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create parking spaces table
CREATE TABLE IF NOT EXISTS parking_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  price_per_hour DECIMAL(10, 2) NOT NULL,
  price_per_day DECIMAL(10, 2),
  capacity INTEGER DEFAULT 1,
  amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES parking_spaces(id) ON DELETE CASCADE,
  seeker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  space_id UUID NOT NULL REFERENCES parking_spaces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(seeker_id, space_id)
);

-- Enable Row Level Security
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Users Profile Policies
CREATE POLICY "Users can view their own profile" ON users_profile
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users_profile
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users_profile
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Parking Spaces Policies
CREATE POLICY "Anyone can view available spaces" ON parking_spaces
  FOR SELECT USING (is_available = TRUE);

CREATE POLICY "Owners can view their own spaces" ON parking_spaces
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert their own spaces" ON parking_spaces
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own spaces" ON parking_spaces
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own spaces" ON parking_spaces
  FOR DELETE USING (auth.uid() = owner_id);

-- Bookings Policies
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (auth.uid() = seeker_id OR auth.uid() = owner_id);

CREATE POLICY "Seekers can insert bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = seeker_id);

CREATE POLICY "Owners and seekers can update their bookings" ON bookings
  FOR UPDATE USING (auth.uid() = seeker_id OR auth.uid() = owner_id);

-- Reviews Policies
CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert reviews for completed bookings" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Favorites Policies
CREATE POLICY "Users can view their own favorites" ON favorites
  FOR SELECT USING (auth.uid() = seeker_id);

CREATE POLICY "Users can insert favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = seeker_id);

CREATE POLICY "Users can delete their own favorites" ON favorites
  FOR DELETE USING (auth.uid() = seeker_id);
