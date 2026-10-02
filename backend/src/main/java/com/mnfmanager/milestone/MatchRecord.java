package com.mnfmanager.milestone;

import java.util.Map;

public record MatchRecord(
        long matchId,
        long captainAId,
        long captainBId,
        Character winningTeam,
        Map<Long, Character> teams,
        Map<Long, Integer> goals) {

    public MatchRecord {
        teams = Map.copyOf(teams);
        goals = Map.copyOf(goals);
    }

    public enum Result {
        WIN, DRAW, LOSS
    }

    public boolean played(long playerId) {
        return teams.containsKey(playerId);
    }

    public Result resultFor(long playerId) {
        Character team = teams.get(playerId);
        if (team == null) {
            throw new IllegalArgumentException("Player " + playerId + " didn't play match " + matchId);
        }
        if (winningTeam == null) {
            return Result.DRAW;
        }
        return winningTeam.equals(team) ? Result.WIN : Result.LOSS;
    }

    public int goalsFor(long playerId) {
        return goals.getOrDefault(playerId, 0);
    }

    public boolean captainedBy(long playerId) {
        return captainAId == playerId || captainBId == playerId;
    }
}