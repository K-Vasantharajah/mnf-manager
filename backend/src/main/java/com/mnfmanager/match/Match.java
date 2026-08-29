package com.mnfmanager.match;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.mnfmanager.player.Player;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "matches")
@Getter
@Setter
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@NoArgsConstructor
@AllArgsConstructor
public class Match {

    @EqualsAndHashCode.Include
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "match_date", nullable = false)
    private LocalDate matchDate;

    @Column(name = "season_year", nullable = false)
    private Short seasonYear;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "captain_a_id", nullable = false)
    private Player captainA;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "captain_b_id", nullable = false)
    private Player captainB;

    @Column(name = "score_a", nullable = false)
    @Builder.Default
    private Short scoreA = 0;

    @Column(name = "score_b", nullable = false)
    @Builder.Default
    private Short scoreB = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_id")
    private Player winner;

    @Column(name = "is_draw", nullable = false)
    @Builder.Default
    private Boolean isDraw = false;

    @Column(name = "duration_mins")
    private Short durationMins;

    @JsonIgnore
    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MatchPlayer> matchPlayers = new ArrayList<>();

    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    @Builder.Default
    private List<GoalScorer> goalScorers = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DraftPick> draftPicks = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}