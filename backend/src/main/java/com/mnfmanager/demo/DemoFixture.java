package com.mnfmanager.demo;

import java.util.List;

public final class DemoFixture {

    private DemoFixture() {
    }

    public record Data(List<DemoPlayer> players, List<DemoMatch> matches) {
    }

    public record DemoPlayer(String name, String position) {
    }

    public record DemoMatch(
            int weeksAgo,
            boolean exhibition,
            String captainA,
            String captainB,
            int scoreA,
            int scoreB,
            List<String> teamA,
            List<String> teamB,
            List<DemoGoal> goals) {
    }

    public record DemoGoal(String player, int goals, String team, boolean ownGoal) {
    }

    public record DemoRating(
            String name,
            Short attackRating,
            Short defenceRating,
            Short overallRating,
            Short reliability) {
    }
}