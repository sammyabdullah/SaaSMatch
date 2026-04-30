-- ============================================================
-- Migration 00022: Remove founder request limits entirely
-- ============================================================

-- Drop the trigger enforcing the flag limit
DROP TRIGGER IF EXISTS trg_enforce_founder_flag_limit ON flags;

-- Replace the function with a no-op
CREATE OR REPLACE FUNCTION fn_enforce_founder_flag_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN new;
END;
$$;
