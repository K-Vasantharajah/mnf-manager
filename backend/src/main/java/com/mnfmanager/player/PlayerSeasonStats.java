package com.mnfmanager.player;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "player_season_stats")
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerSeasonStats {

    @EqualsAndHashCode.Include
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @Column(name = "season_year", nullable = false)
    private Short seasonYear;

    @Column(nullable = false)
    @Builder.Default
    private Short goals = 0;

    @Column(nullable = false)
    @Builder.Default
    private Short assists = 0;

    @Column(name = "matches_played", nullable = false)
    @Builder.Default
    private Short matchesPlayed = 0;

    @Column(nullable = false)
    @Builder.Default
    private Short wins = 0;

    @Column(nullable = false)
    @Builder.Default
    private Short draws = 0;

    @Column(nullable = false)
    @Builder.Default
    private Short losses = 0;
}
