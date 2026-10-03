package com.mnfmanager.draft;

import com.mnfmanager.match.Match;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DraftQueryRepository extends Repository<Match, Long> {

    interface CaptainHistoryRow {
        Long getPlayerId();

        Long getCaptaincies();

        Long getPicked();
    }

    interface CaptaincyRow {
        Long getPlayerId();

        Long getTimesCaptained();

        Long getLastMatchId();
    }

    @Query(value = """
            WITH captaincies AS (
                SELECT id AS match_id, captain_a_id AS captain_id,
                       captain_b_id AS other_captain_id, 'A' AS team
                FROM matches WHERE is_exhibition = false
                UNION ALL
                SELECT id, captain_b_id, captain_a_id, 'B'
                FROM matches WHERE is_exhibition = false
            )
            SELECT mp.player_id AS "playerId",
                   COUNT(*) AS "captaincies",
                   COUNT(*) FILTER (WHERE mp.team = c.team) AS "picked"
            FROM captaincies c
            JOIN match_players mp ON mp.match_id = c.match_id
            WHERE c.captain_id = :captainId
              AND mp.player_id NOT IN (c.captain_id, c.other_captain_id)
            GROUP BY mp.player_id
            """, nativeQuery = true)
    List<CaptainHistoryRow> findCaptainHistory(@Param("captainId") Long captainId);

    @Query(value = """
            SELECT p.id AS "playerId",
                   COUNT(*) AS "timesCaptained",
                   MAX(m.id) AS "lastMatchId"
            FROM players p
            JOIN matches m ON m.captain_a_id = p.id OR m.captain_b_id = p.id
            WHERE m.is_exhibition = false
              AND m.season_year = :seasonYear
            GROUP BY p.id
            """, nativeQuery = true)
    List<CaptaincyRow> findCaptaincies(@Param("seasonYear") int seasonYear);
}