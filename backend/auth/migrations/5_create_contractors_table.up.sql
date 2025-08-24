-- Create contractors table
CREATE TABLE contractors (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  company TEXT,
  hourly_rate DOUBLE PRECISION,
  notes TEXT,
  user_id BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user_id
CREATE INDEX idx_contractors_user_id ON contractors(user_id);

-- Add foreign key constraint
ALTER TABLE contractors ADD CONSTRAINT fk_contractors_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
