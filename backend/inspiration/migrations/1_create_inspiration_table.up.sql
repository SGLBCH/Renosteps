CREATE TABLE inspirations (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inspiration_files (
  id BIGSERIAL PRIMARY KEY,
  inspiration_id BIGINT NOT NULL REFERENCES inspirations(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  content_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inspirations_project_id ON inspirations(project_id);
CREATE INDEX idx_inspiration_files_inspiration_id ON inspiration_files(inspiration_id);
