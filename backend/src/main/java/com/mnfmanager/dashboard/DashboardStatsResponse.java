package com.mnfmanager.dashboard;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class DashboardStatsResponse {

    private final String currentWinningCaptain;

    private final Streak currentStreak;
    private final Streak longestCurrentSeasonStreak;
    private final Streak longestAllTimeStreak;

    @Getter
    @Builder
    public static class Streak {
        private final String captainName;
        private final int length;
        private final List<Long> matchIds;
    }
}