CREATE TABLE matches (
    id              BIGSERIAL PRIMARY KEY,
    match_date      DATE,
    season_year     SMALLINT NOT NULL,
    game_week       VARCHAR(10),
    captain_a_id    BIGINT NOT NULL REFERENCES players(id),
    captain_b_id    BIGINT NOT NULL REFERENCES players(id),
    score_a         SMALLINT NOT NULL DEFAULT 0,
    score_b         SMALLINT NOT NULL DEFAULT 0,
    winner_id       BIGINT REFERENCES players(id),
    is_draw         BOOLEAN NOT NULL DEFAULT false,
    duration_mins   SMALLINT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE match_players (
    match_id    BIGINT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id   BIGINT NOT NULL REFERENCES players(id),
    team        CHAR(1) NOT NULL CHECK (team IN ('A', 'B')),
    PRIMARY KEY (match_id, player_id)
);

CREATE TABLE goal_scorers (
    id          BIGSERIAL PRIMARY KEY,
    match_id    BIGINT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id   BIGINT NOT NULL REFERENCES players(id),
    goals       SMALLINT NOT NULL DEFAULT 1,
    team        CHAR(1) NOT NULL CHECK (team IN ('A', 'B'))
);

CREATE TABLE draft_picks (
    id          BIGSERIAL PRIMARY KEY,
    match_id    BIGINT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    captain_id  BIGINT NOT NULL REFERENCES players(id),
    player_id   BIGINT NOT NULL REFERENCES players(id),
    pick_number SMALLINT NOT NULL,
    team        CHAR(1) NOT NULL CHECK (team IN ('A', 'B'))
);

CREATE INDEX idx_matches_season ON matches(season_year);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_game_week ON matches(season_year, game_week);
CREATE INDEX idx_match_players_match ON match_players(match_id);
CREATE INDEX idx_match_players_player ON match_players(player_id);
CREATE INDEX idx_goal_scorers_match ON goal_scorers(match_id);
CREATE INDEX idx_goal_scorers_player ON goal_scorers(player_id);
CREATE INDEX idx_draft_picks_match ON draft_picks(match_id);
CREATE INDEX idx_draft_picks_captain ON draft_picks(captain_id);