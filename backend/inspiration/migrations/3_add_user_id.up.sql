ALTER TABLE inspirations ADD COLUMN user_id BIGINT;
CREATE INDEX idx_inspirations_user_id ON inspirations(user_id);
