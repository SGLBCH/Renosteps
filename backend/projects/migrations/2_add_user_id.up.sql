-- Add user_id column to projects table
ALTER TABLE projects ADD COLUMN user_id BIGINT;

-- Create index for user_id
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Note: Existing projects will have NULL user_id, which means they won't be accessible
-- after authentication is enabled. This is intentional for security.
