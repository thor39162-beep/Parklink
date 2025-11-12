-- Add Google Maps link field to parking_spaces table
ALTER TABLE parking_spaces
ADD COLUMN IF NOT EXISTS google_maps_link TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_parking_spaces_google_maps_link ON parking_spaces(google_maps_link);
