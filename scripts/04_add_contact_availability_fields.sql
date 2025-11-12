-- Add contact_number, availability_date, availability_time fields and remove latitude/longitude

ALTER TABLE parking_spaces
ADD COLUMN IF NOT EXISTS contact_number TEXT,
ADD COLUMN IF NOT EXISTS availability_date DATE,
ADD COLUMN IF NOT EXISTS availability_time TIME,
DROP COLUMN IF EXISTS latitude,
DROP COLUMN IF EXISTS longitude;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_parking_spaces_owner_id ON parking_spaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_parking_spaces_availability_date ON parking_spaces(availability_date);
