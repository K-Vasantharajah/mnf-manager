package com.mnfmanager.player;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PlayerProfileResponse {

    private Long id;
    private String name;
    private String strongFoot;
    private String notes;
    private Boolean active;

    private Short ability;
    private Short reliability;
    private Short goalThreat;

    private List<SeasonStatsDetail> seasonStats;
    private CareerStats careerStats;

    @Data
    @Builder
    public static class SeasonStatsDetail {
        private Short seasonYear;
        private Integer matchesPlayed;
        private Integer wins;
        private Integer draws;
        private Integer losses;
        private Integer goals;
        private Integer assists;
        private Double winRate;
        private Double goalsPerGame;
    }

    @Data
    @Builder
    public static class CareerStats {
        private Integer totalMatches;
        private Integer totalWins;
        private Integer totalDraws;
        private Integer totalLosses;
        private Integer totalGoals;
        private Integer totalAssists;
        private Double careerWinRate;
        private Double careerGoalsPerGame;
    }
}