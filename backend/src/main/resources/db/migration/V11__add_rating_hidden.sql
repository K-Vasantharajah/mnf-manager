-- Lets a player keep their rating private once ratings are public.
-- Lives on players, not player_ratings: the ratings job rewrites that table.
ALTER TABLE players ADD COLUMN rating_hidden BOOLEAN NOT NULL DEFAULT false;