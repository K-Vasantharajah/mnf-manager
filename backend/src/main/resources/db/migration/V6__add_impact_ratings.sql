ALTER TABLE player_ratings ADD COLUMN attack_rating SMALLINT;
ALTER TABLE player_ratings ADD COLUMN defence_rating SMALLINT;
ALTER TABLE player_ratings ADD COLUMN overall_rating SMALLINT;

ALTER TABLE player_ratings ALTER COLUMN ability DROP NOT NULL;
ALTER TABLE player_ratings ALTER COLUMN reliability DROP NOT NULL;
ALTER TABLE player_ratings ALTER COLUMN goal_threat DROP NOT NULL;