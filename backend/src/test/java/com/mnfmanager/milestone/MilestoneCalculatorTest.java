package com.mnfmanager.milestone;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.mnfmanager.milestone.FactType.*;
import static org.assertj.core.api.Assertions.assertThat;

class MilestoneCalculatorTest {

    private static final long CAPTAIN_A = 100L;
    private static final long CAPTAIN_B = 200L;
    private static final long P1 = 1L;
    private static final long P2 = 2L;
    private static final long P3 = 3L;
    private static final long P4 = 4L;

    private final List<MatchRecord> history = new ArrayList<>();
    private long nextMatchId = 1;

    // ─── Appearance milestones ───────────────────────────────────────────────

    @Test
    void appearanceMilestoneWhenTonightIsTenth() {
        repeat(9, () -> play('A', List.of(P1), List.of()));

        assertThat(facts(P1, APPEARANCE_MILESTONE)).extracting(Fact::value).containsExactly(10);
    }

    @Test
    void noAppearanceMilestoneOnEleventh() {
        repeat(10, () -> play('A', List.of(P1), List.of()));

        assertThat(facts(P1, APPEARANCE_MILESTONE)).isEmpty();
    }

    // ─── Goal milestones ─────────────────────────────────────────────────────

    @Test
    void goalMilestoneWhenWithinTwo() {
        play('A', List.of(P1), List.of(), Map.of(P1, 8));

        assertThat(facts(P1, GOAL_MILESTONE)).singleElement().satisfies(f -> {
            assertThat(f.value()).isEqualTo(10);
            assertThat(f.remaining()).isEqualTo(2);
        });
    }

    @Test
    void noGoalMilestoneWhenThreeAway() {
        play('A', List.of(P1), List.of(), Map.of(P1, 7));

        assertThat(facts(P1, GOAL_MILESTONE)).isEmpty();
    }

    // ─── Streaks ─────────────────────────────────────────────────────────────

    @Test
    void unbeatenStreakSurvivesMissedWeeks() {
        play(null, List.of(P1), List.of());
        play(null, List.of(P1), List.of());
        play('A', List.of(), List.of()); // P1 not there
        play(null, List.of(P1), List.of());
        play(null, List.of(P1), List.of());

        assertThat(facts(P1, UNBEATEN_STREAK)).extracting(Fact::value).containsExactly(4);
    }

    @Test
    void lossBreaksStreaks() {
        repeat(3, () -> play('A', List.of(P1), List.of()));
        play('B', List.of(P1), List.of());
        repeat(2, () -> play('A', List.of(P1), List.of()));

        assertThat(facts(P1, WIN_STREAK)).isEmpty();
        assertThat(facts(P1, UNBEATEN_STREAK)).isEmpty();
    }

    @Test
    void attendanceStreakCountsOnlyUnbrokenRun() {
        repeat(12, () -> play(null, List.of(P1), List.of()));
        play(null, List.of(), List.of()); // missed
        repeat(9, () -> play(null, List.of(P1), List.of()));

        assertThat(facts(P1, ATTENDANCE_STREAK)).isEmpty();

        play(null, List.of(P1), List.of());

        assertThat(facts(P1, ATTENDANCE_STREAK)).extracting(Fact::value).containsExactly(10);
    }

    @Test
    void winStreakReplacesIdenticalUnbeatenStreak() {
        repeat(4, () -> play('A', List.of(P1), List.of()));

        assertThat(facts(P1, WIN_STREAK)).extracting(Fact::value).containsExactly(4);
        assertThat(facts(P1, UNBEATEN_STREAK)).isEmpty();
    }

    @Test
    void unbeatenStreakShownWhenLongerThanWinStreak() {
        play(null, List.of(P1), List.of());
        repeat(3, () -> play('A', List.of(P1), List.of()));

        assertThat(facts(P1, WIN_STREAK)).extracting(Fact::value).containsExactly(3);
        assertThat(facts(P1, UNBEATEN_STREAK)).extracting(Fact::value).containsExactly(4);
    }

    @Test
    void scoringStreak() {
        repeat(3, () -> play('A', List.of(P1), List.of(), Map.of(P1, 1)));

        assertThat(facts(P1, SCORING_STREAK)).extracting(Fact::value).containsExactly(3);
    }

    // ─── Together-records ────────────────────────────────────────────────────

    @Test
    void togetherStreakSkipsMatchesOnOppositeSides() {
        repeat(3, () -> play('A', List.of(P1, P2), List.of()));
        play('B', List.of(P1), List.of(P2)); // opposite sides: neither counts nor breaks
        repeat(2, () -> play('A', List.of(P1, P2), List.of()));

        List<Fact> together = calculate(List.of(P1, P2), List.of()).stream()
                .filter(f -> f.type() == UNBEATEN_TOGETHER)
                .toList();

        assertThat(together).singleElement().satisfies(f -> {
            assertThat(f.value()).isEqualTo(5);
            assertThat(Set.of(f.playerId(), f.partnerId())).containsExactlyInAnyOrder(P1, P2);
        });
    }

    @Test
    void togetherRecordsLimitedToThree() {
        repeat(5, () -> play('A', List.of(P1, P2, P3, P4), List.of()));

        assertThat(calculate(List.of(P1, P2, P3, P4), List.of()).stream()
                .filter(f -> f.type() == UNBEATEN_TOGETHER))
                .hasSize(3);
    }

    // ─── Captaincy ───────────────────────────────────────────────────────────

    @Test
    void firstCaptaincy() {
        play('A', List.of(P1), List.of());

        assertThat(calculate(List.of(P1), List.of(P1)))
                .filteredOn(f -> f.type() == FIRST_CAPTAINCY)
                .singleElement()
                .satisfies(f -> assertThat(f.playerId()).isEqualTo(P1));
    }

    @Test
    void noCaptaincyFactForSecondCaptaincy() {
        play('A', List.of(), List.of()); // CAPTAIN_A has captained once

        assertThat(calculate(List.of(CAPTAIN_A), List.of(CAPTAIN_A)))
                .filteredOn(f -> f.type() == FIRST_CAPTAINCY || f.type() == CAPTAINCY_MILESTONE)
                .isEmpty();
    }

    // ─── Ordering ────────────────────────────────────────────────────────────

    @Test
    void milestonesComeBeforeStreaks() {
        repeat(9, () -> play('A', List.of(P1), List.of())); // 10th tonight, and a 9-match win run

        List<Fact> facts = calculate(List.of(P1), List.of());

        assertThat(facts.get(0).type()).isEqualTo(APPEARANCE_MILESTONE);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private void play(Character winner, List<Long> teamA, List<Long> teamB) {
        play(winner, teamA, teamB, Map.of());
    }

    private void play(Character winner, List<Long> teamA, List<Long> teamB, Map<Long, Integer> goals) {
        Map<Long, Character> teams = new HashMap<>();
        teams.put(CAPTAIN_A, 'A');
        teams.put(CAPTAIN_B, 'B');
        teamA.forEach(p -> teams.put(p, 'A'));
        teamB.forEach(p -> teams.put(p, 'B'));
        history.add(new MatchRecord(nextMatchId++, CAPTAIN_A, CAPTAIN_B, winner, teams, goals));
    }

    private static void repeat(int times, Runnable action) {
        for (int i = 0; i < times; i++) {
            action.run();
        }
    }

    private List<Fact> calculate(List<Long> squad, List<Long> captains) {
        return MilestoneCalculator.calculate(history, squad, captains);
    }

    private List<Fact> facts(long playerId, FactType type) {
        return calculate(List.of(playerId), List.of()).stream()
                .filter(f -> f.playerId() == playerId && f.type() == type)
                .toList();
    }
}