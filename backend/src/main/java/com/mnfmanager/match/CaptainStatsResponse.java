package com.mnfmanager.match;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class CaptainStatsResponse {

    private Long playerId;
    private String name;
    private Integer matchesCaptained;
    private Integer wins;
    private Integer draws;
    private Integer losses;
    private Double winRate;
    private Double pointsPercentage;
    private List<String> mostPickedPlayers;
    private Integer seasonYear;
    private List<CaptainMatchResult> matchHistory;

    @Data
    @Builder
    public static class CaptainMatchResult {
        private Long matchId;
        private String gameWeek;
        private Integer seasonYear;
        private String opponentName;
        private Integer scoreFor;
        private Integer scoreAgainst;
        private String result;
    }
}