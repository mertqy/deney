-- Init schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password      VARCHAR(255) NOT NULL,
  birth_date    DATE NOT NULL,
  bio           TEXT,
  avatar_url    TEXT,
  is_verified   BOOLEAN DEFAULT false,
  trust_score   INTEGER DEFAULT 50 CHECK (trust_score BETWEEN 0 AND 100),
  location_city VARCHAR(100),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS interests (
  id    SERIAL PRIMARY KEY,
  label VARCHAR(50) NOT NULL,
  emoji VARCHAR(10),
  slug  VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS user_interests (
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  interest_id INTEGER REFERENCES interests(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, interest_id)
);

CREATE TABLE IF NOT EXISTS activity_searches (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_slug  VARCHAR(50) NOT NULL,
  desired_date   DATE NOT NULL,
  time_start     TIME NOT NULL,
  time_end       TIME NOT NULL,
  lat            DECIMAL(10, 8) NOT NULL,
  lng            DECIMAL(11, 8) NOT NULL,
  radius_km      DECIMAL(4, 1) DEFAULT 3.0,
  status         VARCHAR(20) DEFAULT 'searching'
                 CHECK (status IN ('searching', 'matched', 'expired', 'cancelled')),
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_searches_active ON activity_searches(activity_slug, desired_date, status)
  WHERE status = 'searching';

CREATE TABLE IF NOT EXISTS matches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_a_id     UUID REFERENCES activity_searches(id),
  search_b_id     UUID REFERENCES activity_searches(id),
  user_a_id       UUID REFERENCES users(id),
  user_b_id       UUID REFERENCES users(id),
  compat_score    INTEGER,
  status          VARCHAR(20) DEFAULT 'pending'
                  CHECK (status IN ('pending', 'a_accepted', 'b_accepted', 'confirmed', 'declined', 'expired')),
  a_responded_at  TIMESTAMPTZ,
  b_responded_at  TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id   UUID REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES users(id),
  content         TEXT NOT NULL,
  is_icebreaker   BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS completed_activities (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id    UUID REFERENCES matches(id),
  user_id     UUID REFERENCES users(id),
  confirmed   BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);
