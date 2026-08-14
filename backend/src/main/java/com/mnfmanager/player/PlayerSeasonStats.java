package com.mnfmanager.player;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "player_season_stats")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerSeasonStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @Column(name = "season_year", nullable = false)
    private Short seasonYear;

    @Column(nullable = false)
    private Short goals = 0;

    @Column(nullable = false)
    private Short assists = 0;

    @Column(name = "matches_played", nullable = false)
    private Short matchesPlayed = 0;

    @Column(nullable = false)
    private Short wins = 0;

    @Column(nullable = false)
    private Short draws = 0;

    @Column(nullable = false)
    private Short losses = 0;
}
