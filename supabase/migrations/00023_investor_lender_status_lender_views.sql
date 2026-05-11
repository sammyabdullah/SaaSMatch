-- Add status field to investor_profiles (mirrors founder_profiles.status)
ALTER TABLE investor_profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
UPDATE investor_profiles SET status = 'active' WHERE is_approved = true;

-- Add status field to lender_profiles
ALTER TABLE lender_profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
UPDATE lender_profiles SET status = 'active' WHERE is_approved = true;

-- Track when founders view lender profiles
CREATE TABLE IF NOT EXISTS lender_profile_views (
  id        uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  founder_id uuid       NOT NULL REFERENCES founder_profiles(id) ON DELETE CASCADE,
  lender_id  uuid       NOT NULL REFERENCES lender_profiles(id)  ON DELETE CASCADE,
  viewed_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE lender_profile_views ENABLE ROW LEVEL SECURITY;

-- Service role (used by createAdminClient) has full access
CREATE POLICY "Service role full access on lender_profile_views"
  ON lender_profile_views FOR ALL USING (true);
