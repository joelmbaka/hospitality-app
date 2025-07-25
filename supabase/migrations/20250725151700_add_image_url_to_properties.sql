-- Add image_url column to properties
ALTER TABLE properties
  ADD COLUMN image_url TEXT;

COMMENT ON COLUMN properties.image_url IS 'Public URL to a representative image for the property';
