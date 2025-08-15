CREATE TABLE budget_settings (
  id BIGSERIAL PRIMARY KEY,
  total_budget DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE budget_expenses (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_budget_expenses_category ON budget_expenses(category);
CREATE INDEX idx_budget_expenses_date ON budget_expenses(date);

-- Insert default budget setting
INSERT INTO budget_settings (total_budget) VALUES (50000);
