package com.mnfmanager.match;

import com.mnfmanager.BaseIntegrationTest;
import com.mnfmanager.player.Player;
import com.mnfmanager.player.PlayerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
public class DashboardStatsIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MatchService matchService;

    @Autowired
    private PlayerRepository playerRepository;

    private Player captainA;
    private Player captainB;

    @BeforeEach
    void setUp() {
        captainA = playerRepository.save(Player.builder()
                .name("Dashboard Captain A")
                .strongFoot("Right")
                .active(true)
                .build());

        captainB = playerRepository.save(Player.builder()
                .name("Dashboard Captain B")
                .strongFoot("Right")
                .active(true)
                .build());
    }

    private void createMatch(Player captainA, Player captainB,
            short scoreA, short scoreB, int year) {
        CreateMatchRequest request = new CreateMatchRequest();
        request.setMatchDate(LocalDate.of(year, 8, 25));
        request.setSeasonYear((short) year);
        request.setCaptainAId(captainA.getId());
        request.setCaptainBId(captainB.getId());
        request.setScoreA(scoreA);
        request.setScoreB(scoreB);
        request.setDurationMins((short) 60);
        request.setTeamAPlayerIds(List.of(captainA.getId()));
        request.setTeamBPlayerIds(List.of(captainB.getId()));
        request.setGoalScorers(List.of());
        matchService.createMatch(request);
    }

    @Test
    void shouldReturnCurrentWinningCaptain() {
        createMatch(captainA, captainB, (short) 3, (short) 1, 2026);

        Map<String, Object> stats = matchService.getCaptainDashboardStats();

        assertThat(stats.get("currentWinningCaptain")).isEqualTo("Dashboard Captain A");
    }

    @Test
    void shouldReturnDrawAsCurrentWinningCaptain() {
        createMatch(captainA, captainB, (short) 2, (short) 2, 2026);

        Map<String, Object> stats = matchService.getCaptainDashboardStats();

        assertThat(stats.get("currentWinningCaptain").toString())
                .contains("Draw - replay");
    }

    @Test
    void shouldCalculateCurrentStreak() {
        // Captain A wins 3 in a row
        createMatch(captainA, captainB, (short) 3, (short) 1, 2026);
        createMatch(captainA, captainB, (short) 2, (short) 1, 2026);
        createMatch(captainA, captainB, (short) 4, (short) 0, 2026);

        Map<String, Object> stats = matchService.getCaptainDashboardStats();

        assertThat(stats.get("currentStreakCaptain")).isEqualTo("Dashboard Captain A");
        assertThat((int) stats.get("currentStreak")).isEqualTo(3);
    }

    @Test
    void shouldResetStreakOnLoss() {
        // Captain A wins 2, then loses
        createMatch(captainA, captainB, (short) 3, (short) 1, 2026);
        createMatch(captainA, captainB, (short) 2, (short) 1, 2026);
        createMatch(captainA, captainB, (short) 0, (short) 3, 2026);

        Map<String, Object> stats = matchService.getCaptainDashboardStats();

        assertThat(stats.get("currentStreakCaptain")).isEqualTo("Dashboard Captain B");
        assertThat((int) stats.get("currentStreak")).isEqualTo(1);
    }

    @Test
    void shouldCalculateLongestSeasonStreak() {
        // Captain A wins 3 in a row then loses
        createMatch(captainA, captainB, (short) 3, (short) 1, 2026);
        createMatch(captainA, captainB, (short) 2, (short) 1, 2026);
        createMatch(captainA, captainB, (short) 4, (short) 0, 2026);
        createMatch(captainA, captainB, (short) 0, (short) 3, 2026);

        Map<String, Object> stats = matchService.getCaptainDashboardStats();

        assertThat(stats.get("longestCurrentSeasonStreakCaptain"))
                .isEqualTo("Dashboard Captain A");
        assertThat((int) stats.get("longestCurrentSeasonStreak")).isEqualTo(3);
    }

    @Test
    void shouldReturnEmptyStatsWithNoMatches() {
        Map<String, Object> stats = matchService.getCaptainDashboardStats();

        assertThat(stats.get("currentWinningCaptain")).isEqualTo("None");
        assertThat((int) stats.get("currentStreak")).isEqualTo(0);
    }
}