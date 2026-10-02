package com.mnfmanager.milestone;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MilestoneService {

    private final MilestoneQueryRepository repository;

    public List<Fact> factsFor(Collection<Long> squadIds, Collection<Long> captainIds) {
        return MilestoneCalculator.calculate(
                loadHistory(), squadIds, captainIds != null ? captainIds : List.of());
    }

    List<MatchRecord> loadHistory() {
        Map<Long, Map<Long, Integer>> goalsByMatch = new HashMap<>();
        for (GoalRow row : repository.findCompetitiveGoals()) {
            goalsByMatch.computeIfAbsent(row.matchId(), k -> new HashMap<>())
                    .put(row.playerId(), row.goals().intValue());
        }

        Map<Long, List<AppearanceRow>> appearancesByMatch = repository.findCompetitiveAppearances()
                .stream()
                .collect(Collectors.groupingBy(
                        AppearanceRow::matchId, LinkedHashMap::new, Collectors.toList()));

        return appearancesByMatch.values().stream()
                .map(rows -> toRecord(rows, goalsByMatch))
                .toList();
    }

    private static MatchRecord toRecord(
            List<AppearanceRow> rows, Map<Long, Map<Long, Integer>> goalsByMatch) {
        AppearanceRow match = rows.get(0);
        Map<Long, Character> teams = rows.stream()
                .collect(Collectors.toMap(AppearanceRow::playerId, AppearanceRow::team));

        return new MatchRecord(
                match.matchId(),
                match.captainAId(),
                match.captainBId(),
                winningTeam(match),
                teams,
                goalsByMatch.getOrDefault(match.matchId(), Map.of()));
    }

    private static Character winningTeam(AppearanceRow match) {
        if (Boolean.TRUE.equals(match.isDraw()) || match.winnerId() == null) {
            return null;
        }
        return match.winnerId().equals(match.captainAId()) ? 'A' : 'B';
    }
}