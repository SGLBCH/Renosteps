-- Add user_id column to budget_settings and budget_expenses tables
ALTER TABLE budget_settings ADD COLUMN user_id BIGINT;
ALTER TABLE budget_expenses ADD COLUMN user_id BIGINT;

-- Create indexes for user_id
CREATE INDEX idx_budget_settings_user_id ON budget_settings(user_id);
CREATE INDEX idx_budget_expenses_user_id ON budget_expenses(user_id);

-- Note: Existing budget data will have NULL user_id, which means it won't be accessible
-- after authentication is enabled. This is intentional for security.
