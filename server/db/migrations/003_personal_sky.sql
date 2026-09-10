-- Migration 003: Personal Sky, Fulfillment, and Mirror Search

CREATE TABLE IF NOT EXISTS saved_wishes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wish_id UUID NOT NULL REFERENCES wishes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, wish_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_wishes_user_id ON saved_wishes(user_id);

ALTER TABLE wishes ADD COLUMN IF NOT EXISTS fulfillment_note VARCHAR(280);

ALTER TABLE wishes ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS idx_wishes_search_vector ON wishes USING GIN(search_vector);

CREATE OR REPLACE FUNCTION wishes_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.text, '') || ' ' || COALESCE(NEW.category, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wishes_search_vector_trigger ON wishes;
CREATE TRIGGER wishes_search_vector_trigger
  BEFORE INSERT OR UPDATE ON wishes
  FOR EACH ROW EXECUTE FUNCTION wishes_search_vector_update();

UPDATE wishes SET search_vector = to_tsvector('english', COALESCE(text, '') || ' ' || COALESCE(category, ''));

