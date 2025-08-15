-- Add project_id column to tasks and subtasks tables
ALTER TABLE tasks ADD COLUMN project_id TEXT;
ALTER TABLE subtasks ADD COLUMN project_id TEXT;

-- Create indexes for project_id
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_subtasks_project_id ON subtasks(project_id);

-- Update existing records to have a default project_id
UPDATE tasks SET project_id = '1' WHERE project_id IS NULL;
UPDATE subtasks SET project_id = '1' WHERE project_id IS NULL;

-- Add foreign key constraint for subtasks referencing tasks (but not for project_id since projects table uses BIGSERIAL)
-- Note: We don't add foreign key constraints to project_id because the projects table uses BIGSERIAL (numeric)
-- while the project_id columns are TEXT for flexibility
