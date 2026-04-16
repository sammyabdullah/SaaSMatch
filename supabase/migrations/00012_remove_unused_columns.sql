-- Remove unused columns from investor_profiles
ALTER TABLE investor_profiles
  DROP COLUMN IF EXISTS typical_response_days,
  DROP COLUMN IF EXISTS takes_board_seat,
  DROP COLUMN IF EXISTS portfolio_count,
  DROP COLUMN IF EXISTS value_beyond_capital;

-- Remove unused columns from founder_profiles
ALTER TABLE founder_profiles
  DROP COLUMN IF EXISTS geography_preference,
  DROP COLUMN IF EXISTS wants_lead,
  DROP COLUMN IF EXISTS wants_board_seat,
  DROP COLUMN IF EXISTS check_size_min_usd,
  DROP COLUMN IF EXISTS check_size_max_usd;
