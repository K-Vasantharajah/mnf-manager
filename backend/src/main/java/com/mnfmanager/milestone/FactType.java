package com.mnfmanager.milestone;

public enum FactType {
    APPEARANCE_MILESTONE(0),
    GOAL_MILESTONE(0),
    FIRST_CAPTAINCY(1),
    CAPTAINCY_MILESTONE(1),
    WIN_STREAK(2),
    SCORING_STREAK(2),
    UNBEATEN_STREAK(3),
    UNBEATEN_TOGETHER(4),
    ATTENDANCE_STREAK(5);

    private final int rank;

    FactType(int rank) {
        this.rank = rank;
    }

    public int rank() {
        return rank;
    }
}