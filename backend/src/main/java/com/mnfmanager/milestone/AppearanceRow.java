package com.mnfmanager.milestone;

public record AppearanceRow(
        Long matchId,
        Long playerId,
        Character team,
        Boolean isDraw,
        Long winnerId,
        Long captainAId,
        Long captainBId) {
}