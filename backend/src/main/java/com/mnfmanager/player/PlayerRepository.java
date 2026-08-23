package com.mnfmanager.player;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {

    List<Player> findByActiveTrue();

    Optional<Player> findByNameIgnoreCase(String name);

    @Query("""
        SELECT p FROM Player p
        LEFT JOIN FETCH p.rating
        LEFT JOIN FETCH p.positions
        WHERE p.active = true
        ORDER BY p.name
    """)
    List<Player> findAllActiveWithRatings();

    @Query("""
        SELECT p FROM Player p
        LEFT JOIN FETCH p.rating
        LEFT JOIN FETCH p.positions
        LEFT JOIN FETCH p.seasonStats
        WHERE p.id = :id
    """)
    Optional<Player> findByIdWithFullDetails(Long id);

    @Query("""
    SELECT DISTINCT p FROM Player p
    LEFT JOIN FETCH p.rating
    LEFT JOIN FETCH p.seasonStats
    WHERE p.active = true
    ORDER BY p.name
    """)
    List<Player> findAllActiveWithRatingsAndStats();
}
