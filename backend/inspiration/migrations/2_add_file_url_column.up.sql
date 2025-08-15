-- Add file_url column to inspirations table
ALTER TABLE inspirations ADD COLUMN file_url TEXT;

-- Create index for file_url
CREATE INDEX idx_inspirations_file_url ON inspirations(file_url);
