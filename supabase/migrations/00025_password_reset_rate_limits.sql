-- Track password reset attempts per IP for rate limiting
CREATE TABLE IF NOT EXISTS password_reset_rate_limits (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip          text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON password_reset_rate_limits (ip, created_at);

-- Service role only — no public access
ALTER TABLE password_reset_rate_limits ENABLE ROW LEVEL SECURITY;
