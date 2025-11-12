-- Add booking_slots table to track reserved time slots
CREATE TABLE IF NOT EXISTS booking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES parking_spaces(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on booking_slots
ALTER TABLE booking_slots ENABLE ROW LEVEL SECURITY;

-- Create policy for booking_slots
CREATE POLICY "Anyone can view booking slots" ON booking_slots
  FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can insert booking slots" ON booking_slots
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
