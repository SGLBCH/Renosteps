-- Create projects table
CREATE TABLE projects (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  user_id BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user_id
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Add foreign key constraint to users table
ALTER TABLE projects ADD CONSTRAINT fk_projects_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
