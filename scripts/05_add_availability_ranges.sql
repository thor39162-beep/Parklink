-- Add availability date/time range fields
ALTER TABLE parking_spaces
ADD COLUMN IF NOT EXISTS availability_date_from DATE,
ADD COLUMN IF NOT EXISTS availability_date_to DATE,
ADD COLUMN IF NOT EXISTS availability_time_from TIME,
ADD COLUMN IF NOT EXISTS availability_time_to TIME;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_parking_spaces_availability_from ON parking_spaces(availability_date_from);
CREATE INDEX IF NOT EXISTS idx_parking_spaces_availability_to ON parking_spaces(availability_date_to);
