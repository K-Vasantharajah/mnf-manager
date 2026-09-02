package com.mnfmanager.player;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerLeaderboardEntry {
    private Long playerId;
    private String name;
    private Integer matchesPlayed;
    private Integer wins;
    private Integer draws;
    private Integer losses;
    private Integer goals;
    private Integer assists;
    private Double winRate;
    private Double pointsPercentage;
    private Double goalsPerGame;
    private Short ability;
    private Short reliability;
    private Short goalThreat;
    private Integer seasonYear;
}