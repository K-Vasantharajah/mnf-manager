-- Ratings moved from a 1-10 scale to 60-95, so the old bounds no longer apply.
ALTER TABLE player_ratings DROP CONSTRAINT IF EXISTS player_ratings_reliability_check;

-- ability and goal_threat are no longer produced or displayed.
ALTER TABLE player_ratings DROP CONSTRAINT IF EXISTS player_ratings_ability_check;
ALTER TABLE player_ratings DROP CONSTRAINT IF EXISTS player_ratings_goal_threat_check;
ALTER TABLE player_ratings DROP COLUMN IF EXISTS ability;
ALTER TABLE player_ratings DROP COLUMN IF EXISTS goal_threat;

