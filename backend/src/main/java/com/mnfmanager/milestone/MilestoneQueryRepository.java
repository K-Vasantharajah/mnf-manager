package com.mnfmanager.milestone;

import com.mnfmanager.match.Match;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

import java.util.List;

public interface MilestoneQueryRepository extends Repository<Match, Long> {

    @Query("""
            SELECT new com.mnfmanager.milestone.AppearanceRow(
                m.id, mp.id.playerId, mp.team, m.isDraw, w.id, m.captainA.id, m.captainB.id)
            FROM MatchPlayer mp
            JOIN mp.match m
            LEFT JOIN m.winner w
            WHERE m.isExhibition = false
            ORDER BY m.id
            """)
    List<AppearanceRow> findCompetitiveAppearances();

    @Query("""
            SELECT new com.mnfmanager.milestone.GoalRow(m.id, gs.player.id, SUM(gs.goals))
            FROM GoalScorer gs
            JOIN gs.match m
            WHERE m.isExhibition = false
              AND gs.isOwnGoal = false
            GROUP BY m.id, gs.player.id
            """)
    List<GoalRow> findCompetitiveGoals();
}