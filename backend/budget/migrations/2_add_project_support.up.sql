-- Add project_id column to budget_settings and budget_expenses
ALTER TABLE budget_settings ADD COLUMN project_id TEXT;
ALTER TABLE budget_expenses ADD COLUMN project_id TEXT;

-- Create indexes for project_id
CREATE INDEX idx_budget_settings_project_id ON budget_settings(project_id);
CREATE INDEX idx_budget_expenses_project_id ON budget_expenses(project_id);

-- Update existing records to have a default project_id
UPDATE budget_settings SET project_id = '1' WHERE project_id IS NULL;
UPDATE budget_expenses SET project_id = '1' WHERE project_id IS NULL;
