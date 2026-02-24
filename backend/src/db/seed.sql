-- Seed interests / activity categories
INSERT INTO interests (label, emoji, slug) VALUES
  ('Kahve',   '☕', 'coffee'),
  ('Film',    '🎬', 'movie'),
  ('Yürüyüş','🥾', 'hike'),
  ('Yemek',  '🍳', 'food'),
  ('Konser', '🎵', 'concert'),
  ('Kitap',  '📚', 'book'),
  ('Spor',   '⚽', 'sport'),
  ('Sanat',  '🎨', 'art')
ON CONFLICT (slug) DO NOTHING;
