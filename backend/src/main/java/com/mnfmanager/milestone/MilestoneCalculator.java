package com.mnfmanager.milestone;

import com.mnfmanager.milestone.MatchRecord.Result;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.function.Predicate;

import static com.mnfmanager.milestone.FactType.*;

public final class MilestoneCalculator {

    static final int ATTENDANCE_STREAK_MIN = 10;
    static final int UNBEATEN_STREAK_MIN = 4;
    static final int WIN_STREAK_MIN = 3;
    static final int SCORING_STREAK_MIN = 3;
    static final int TOGETHER_STREAK_MIN = 5;
    static final int TOGETHER_MAX_SHOWN = 3;
    static final int GOALS_WITHIN = 2;

    private static final int[] MILESTONES = { 10, 25, 50, 75, 100 };
    private static final int[] CAPTAINCY_MILESTONES = { 10, 25, 50 };

    private static final Comparator<Fact> DISPLAY_ORDER = Comparator
            .comparingInt((Fact f) -> f.type().rank())
            .thenComparing(Comparator.comparingInt(Fact::value).reversed());

    private MilestoneCalculator() {
    }

    public static List<Fact> calculate(
            List<MatchRecord> matches, Collection<Long> squadIds, Collection<Long> captainIds) {
        List<Long> squad = List.copyOf(new LinkedHashSet<>(squadIds));
        List<Fact> facts = new ArrayList<>();

        for (long playerId : squad) {
            facts.addAll(playerFacts(playerId, matches));
        }
        for (long captainId : new LinkedHashSet<>(captainIds)) {
            captaincyFact(captainId, matches).ifPresent(facts::add);
        }
        facts.addAll(togetherFacts(squad, matches));

        facts.sort(DISPLAY_ORDER);
        return facts;
    }

    private static List<Fact> playerFacts(long playerId, List<MatchRecord> matches) {
        List<MatchRecord> played = matches.stream().filter(m -> m.played(playerId)).toList();
        List<Fact> facts = new ArrayList<>();

        int tonight = played.size() + 1;
        if (isMilestone(tonight, MILESTONES)) {
            facts.add(Fact.of(APPEARANCE_MILESTONE, playerId, tonight));
        }

        int goals = played.stream().mapToInt(m -> m.goalsFor(playerId)).sum();
        int target = nextGoalTarget(goals);
        if (target - goals <= GOALS_WITHIN) {
            facts.add(new Fact(GOAL_MILESTONE, playerId, null, target, target - goals));
        }

        int attendance = trailing(matches, m -> m.played(playerId));
        if (attendance >= ATTENDANCE_STREAK_MIN) {
            facts.add(Fact.of(ATTENDANCE_STREAK, playerId, attendance));
        }

        int wins = trailing(played, m -> m.resultFor(playerId) == Result.WIN);
        if (wins >= WIN_STREAK_MIN) {
            facts.add(Fact.of(WIN_STREAK, playerId, wins));
        }

        int unbeaten = trailing(played, m -> m.resultFor(playerId) != Result.LOSS);
        if (unbeaten >= UNBEATEN_STREAK_MIN && unbeaten > wins) {
            facts.add(Fact.of(UNBEATEN_STREAK, playerId, unbeaten));
        }

        int scoring = trailing(played, m -> m.goalsFor(playerId) > 0);
        if (scoring >= SCORING_STREAK_MIN) {
            facts.add(Fact.of(SCORING_STREAK, playerId, scoring));
        }

        return facts;
    }

    private static Optional<Fact> captaincyFact(long captainId, List<MatchRecord> matches) {
        long previous = matches.stream().filter(m -> m.captainedBy(captainId)).count();
        if (previous == 0) {
            return Optional.of(Fact.of(FIRST_CAPTAINCY, captainId, 1));
        }
        int tonight = (int) previous + 1;
        if (isMilestone(tonight, CAPTAINCY_MILESTONES)) {
            return Optional.of(Fact.of(CAPTAINCY_MILESTONE, captainId, tonight));
        }
        return Optional.empty();
    }

    private static List<Fact> togetherFacts(List<Long> squad, List<MatchRecord> matches) {
        List<Fact> facts = new ArrayList<>();
        for (int i = 0; i < squad.size(); i++) {
            for (int j = i + 1; j < squad.size(); j++) {
                long a = squad.get(i);
                long b = squad.get(j);
                List<MatchRecord> sameTeam = matches.stream()
                        .filter(m -> m.played(a) && m.played(b)
                                && m.teams().get(a).equals(m.teams().get(b)))
                        .toList();
                int unbeaten = trailing(sameTeam, m -> m.resultFor(a) != Result.LOSS);
                if (unbeaten >= TOGETHER_STREAK_MIN) {
                    facts.add(new Fact(UNBEATEN_TOGETHER, a, b, unbeaten, null));
                }
            }
        }
        return facts.stream()
                .sorted(Comparator.comparingInt(Fact::value).reversed())
                .limit(TOGETHER_MAX_SHOWN)
                .toList();
    }

    private static int trailing(List<MatchRecord> ordered, Predicate<MatchRecord> holds) {
        int count = 0;
        for (int i = ordered.size() - 1; i >= 0 && holds.test(ordered.get(i)); i--) {
            count++;
        }
        return count;
    }

    static boolean isMilestone(int n, int[] milestones) {
        for (int m : milestones) {
            if (n == m) {
                return true;
            }
        }
        return n > milestones[milestones.length - 1] && n % 50 == 0;
    }

    static int nextGoalTarget(int goals) {
        for (int m : MILESTONES) {
            if (m > goals) {
                return m;
            }
        }
        return (goals / 50 + 1) * 50;
    }
}