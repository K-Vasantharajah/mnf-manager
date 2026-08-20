package com.mnfmanager.match;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class CreateMatchRequest {

    @NotNull
    private LocalDate matchDate;

    @NotNull
    private Short seasonYear;

    @NotNull
    private Long captainAId;

    @NotNull
    private Long captainBId;

    @NotNull
    private Short scoreA;

    @NotNull
    private Short scoreB;

    private Short durationMins;

    private List<Long> teamAPlayerIds;
    private List<Long> teamBPlayerIds;
    private List<GoalScorerRequest> goalScorers;

    @Data
    public static class GoalScorerRequest {
        private Long playerId;
        private Short goals;
        private Character team;
    }
}