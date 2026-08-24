package com.mnfmanager.match;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {

    List<Match> findBySeasonYearOrderByMatchDateDesc(Short seasonYear);

    @Query("""
        SELECT m FROM Match m
        LEFT JOIN FETCH m.captainA
        LEFT JOIN FETCH m.captainB
        LEFT JOIN FETCH m.winner
        ORDER BY m.matchDate DESC
    """)
    List<Match> findAllByOrderByMatchDateDesc();

    @Query("""
        SELECT m FROM Match m
        LEFT JOIN FETCH m.captainA
        LEFT JOIN FETCH m.captainB
        LEFT JOIN FETCH m.winner
        LEFT JOIN FETCH m.matchPlayers mp
        LEFT JOIN FETCH mp.player
        WHERE m.id = :id
    """)
    Optional<Match> findByIdWithFullDetails(Long id);

    @Query("""
        SELECT m FROM Match m
        LEFT JOIN FETCH m.goalScorers gs
        LEFT JOIN FETCH gs.player
        WHERE m.id = :id
    """)
    Optional<Match> findByIdWithGoalScorers(Long id);

    @Query("""
        SELECT m FROM Match m
        LEFT JOIN FETCH m.matchPlayers
        LEFT JOIN FETCH m.goalScorers
        WHERE m.seasonYear = :seasonYear
        ORDER BY m.matchDate DESC
    """)
    List<Match> findBySeasonWithDetails(Short seasonYear);
}