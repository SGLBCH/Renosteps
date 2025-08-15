-- Add user_id column to tasks and subtasks tables
ALTER TABLE tasks ADD COLUMN user_id BIGINT;
ALTER TABLE subtasks ADD COLUMN user_id BIGINT;

-- Create indexes for user_id
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_subtasks_user_id ON subtasks(user_id);

-- Note: Existing tasks will have NULL user_id, which means they won't be accessible
-- after authentication is enabled. This is intentional for security.
