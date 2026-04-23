-- Add 'series-c' to the founder_stage enum.
-- Required because investor_profiles.stages is typed as founder_stage[]
-- and founder_profiles.stage is typed as founder_stage.
alter type founder_stage add value if not exists 'series-c';
