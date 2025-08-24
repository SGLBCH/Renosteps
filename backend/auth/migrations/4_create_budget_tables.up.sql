-- Create budget tables
CREATE TABLE budget_settings (
  id BIGSERIAL PRIMARY KEY,
  total_budget DOUBLE PRECISION NOT NULL,
  project_id TEXT,
  user_id BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE budget_expenses (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  project_id TEXT,
  user_id BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_budget_settings_project_id ON budget_settings(project_id);
CREATE INDEX idx_budget_settings_user_id ON budget_settings(user_id);
CREATE INDEX idx_budget_expenses_category ON budget_expenses(category);
CREATE INDEX idx_budget_expenses_date ON budget_expenses(date);
CREATE INDEX idx_budget_expenses_project_id ON budget_expenses(project_id);
CREATE INDEX idx_budget_expenses_user_id ON budget_expenses(user_id);

-- Add foreign key constraints
ALTER TABLE budget_settings ADD CONSTRAINT fk_budget_settings_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE budget_expenses ADD CONSTRAINT fk_budget_expenses_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
