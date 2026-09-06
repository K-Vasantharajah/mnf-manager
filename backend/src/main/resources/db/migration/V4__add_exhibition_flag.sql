ALTER TABLE matches ADD COLUMN is_exhibition BOOLEAN NOT NULL DEFAULT false;

UPDATE matches SET is_exhibition = true WHERE game_week LIKE 'EX%';