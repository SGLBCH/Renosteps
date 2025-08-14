CREATE TABLE contractors (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  company TEXT,
  hourly_rate DOUBLE PRECISION,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
