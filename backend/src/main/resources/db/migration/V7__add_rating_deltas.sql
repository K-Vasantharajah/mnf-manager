ALTER TABLE player_ratings ADD COLUMN attack_delta SMALLINT DEFAULT 0;
ALTER TABLE player_ratings ADD COLUMN defence_delta SMALLINT DEFAULT 0;
ALTER TABLE player_ratings ADD COLUMN overall_delta SMALLINT DEFAULT 0;