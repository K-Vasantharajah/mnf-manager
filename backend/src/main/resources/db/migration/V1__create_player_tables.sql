CREATE TABLE players (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT true,
    strong_foot VARCHAR(5) NOT NULL DEFAULT 'Right',
    notes       TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE player_positions (
    player_id  BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    position   VARCHAR(20) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (player_id, position)
);

CREATE TABLE player_ratings (
    id           BIGSERIAL PRIMARY KEY,
    player_id    BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    ability      SMALLINT NOT NULL CHECK (ability BETWEEN 1 AND 10),
    reliability  SMALLINT NOT NULL CHECK (reliability BETWEEN 1 AND 10),
    goal_threat  SMALLINT NOT NULL CHECK (goal_threat BETWEEN 1 AND 10),
    rated_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    rated_by     VARCHAR(100),
    UNIQUE (player_id)
);

CREATE TABLE player_season_stats (
    id             BIGSERIAL PRIMARY KEY,
    player_id      BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    season_year    SMALLINT NOT NULL,
    goals          SMALLINT NOT NULL DEFAULT 0,
    assists        SMALLINT NOT NULL DEFAULT 0,
    matches_played SMALLINT NOT NULL DEFAULT 0,
    wins           SMALLINT NOT NULL DEFAULT 0,
    draws          SMALLINT NOT NULL DEFAULT 0,
    losses         SMALLINT NOT NULL DEFAULT 0,
    UNIQUE (player_id, season_year)
);

CREATE INDEX idx_players_active ON players(active);
CREATE INDEX idx_player_ratings_player_id ON player_ratings(player_id);
CREATE INDEX idx_player_season_stats_player_id ON player_season_stats(player_id);
CREATE INDEX idx_player_season_stats_year ON player_season_stats(season_year);
