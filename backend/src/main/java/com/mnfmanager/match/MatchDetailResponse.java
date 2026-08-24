package com.mnfmanager.match;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class MatchDetailResponse {

    private Long id;
    private LocalDate matchDate;
    private Short seasonYear;
    private Long captainAId;
    private String captainAName;
    private Long captainBId;
    private String captainBName;
    private Short scoreA;
    private Short scoreB;
    private Long winnerId;
    private Boolean isDraw;
    private Short durationMins;
    private List<Long> teamAPlayerIds;
    private List<Long> teamBPlayerIds;
    private List<GoalScorerDetail> goalScorers;

    @Data
    @Builder
    public static class GoalScorerDetail {
        private Long playerId;
        private String playerName;
        private Short goals;
        private Character team;
    }
}