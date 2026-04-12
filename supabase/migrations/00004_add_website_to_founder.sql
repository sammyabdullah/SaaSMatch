-- Migration 00004: Add website field to founder_profiles
alter table founder_profiles
  add column if not exists website text;
