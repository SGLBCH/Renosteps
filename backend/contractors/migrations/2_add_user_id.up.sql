ALTER TABLE contractors ADD COLUMN user_id BIGINT;
CREATE INDEX idx_contractors_user_id ON contractors(user_id);
