package com.mnfmanager.match;

import com.mnfmanager.TestSeasons;

import com.mnfmanager.BaseIntegrationTest;
import com.mnfmanager.dashboard.DashboardStatsResponse;
import com.mnfmanager.player.Player;
import com.mnfmanager.player.PlayerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

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

    private Match createMatch(Player captainA, Player captainB,
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
        return matchService.createMatch(request);
    }

    private Match createExhibitionMatch(Player captainA, Player captainB,
            short scoreA, short scoreB, int year) {
        CreateMatchRequest request = new CreateMatchRequest();
        request.setMatchDate(LocalDate.of(year, 8, 25));
        request.setSeasonYear((short) year);
        request.setIsExhibition(true);
        request.setCaptainAId(captainA.getId());
        request.setCaptainBId(captainB.getId());
        request.setScoreA(scoreA);
        request.setScoreB(scoreB);
        request.setDurationMins((short) 60);
        request.setTeamAPlayerIds(List.of(captainA.getId()));
        request.setTeamBPlayerIds(List.of(captainB.getId()));
        request.setGoalScorers(List.of());
        return matchService.createMatch(request);
    }

    @Test
    void shouldReturnCurrentWinningCaptain() {
        createMatch(captainA, captainB, (short) 3, (short) 1, TestSeasons.CURRENT);

        DashboardStatsResponse stats = matchService.getCaptainDashboardStats();

        assertThat(stats.getCurrentWinningCaptain()).isEqualTo("Dashboard Captain A");
    }

    @Test
    void shouldReturnDrawAsCurrentWinningCaptain() {
        createMatch(captainA, captainB, (short) 2, (short) 2, TestSeasons.CURRENT);

        DashboardStatsResponse stats = matchService.getCaptainDashboardStats();

        assertThat(stats.getCurrentWinningCaptain()).contains("Draw - replay");
    }

    @Test
    void shouldCalculateCurrentStreak() {
        // Captain A wins 3 in a row
        createMatch(captainA, captainB, (short) 3, (short) 1, TestSeasons.CURRENT);
        createMatch(captainA, captainB, (short) 2, (short) 1, TestSeasons.CURRENT);
        createMatch(captainA, captainB, (short) 4, (short) 0, TestSeasons.CURRENT);

        DashboardStatsResponse stats = matchService.getCaptainDashboardStats();

        assertThat(stats.getCurrentStreak().getCaptainName()).isEqualTo("Dashboard Captain A");
        assertThat(stats.getCurrentStreak().getLength()).isEqualTo(3);
        assertThat(stats.getCurrentStreak().getMatchIds()).hasSize(3);
    }

    @Test
    void shouldResetStreakOnLoss() {
        // Captain A wins 2, then loses
        createMatch(captainA, captainB, (short) 3, (short) 1, TestSeasons.CURRENT);
        createMatch(captainA, captainB, (short) 2, (short) 1, TestSeasons.CURRENT);
        createMatch(captainA, captainB, (short) 0, (short) 3, TestSeasons.CURRENT);

        DashboardStatsResponse stats = matchService.getCaptainDashboardStats();

        assertThat(stats.getCurrentStreak().getCaptainName()).isEqualTo("Dashboard Captain B");
        assertThat(stats.getCurrentStreak().getLength()).isEqualTo(1);
    }

    @Test
    void shouldCalculateLongestSeasonStreak() {
        // Captain A wins 3 in a row then loses
        createMatch(captainA, captainB, (short) 3, (short) 1, TestSeasons.CURRENT);
        createMatch(captainA, captainB, (short) 2, (short) 1, TestSeasons.CURRENT);
        createMatch(captainA, captainB, (short) 4, (short) 0, TestSeasons.CURRENT);
        createMatch(captainA, captainB, (short) 0, (short) 3, TestSeasons.CURRENT);

        DashboardStatsResponse stats = matchService.getCaptainDashboardStats();

        assertThat(stats.getLongestCurrentSeasonStreak().getCaptainName())
                .isEqualTo("Dashboard Captain A");
        assertThat(stats.getLongestCurrentSeasonStreak().getLength()).isEqualTo(3);
    }

    @Test
    void shouldReturnEmptyStatsWithNoMatches() {
        DashboardStatsResponse stats = matchService.getCaptainDashboardStats();

        assertThat(stats.getCurrentWinningCaptain()).isEqualTo("None");
        assertThat(stats.getCurrentStreak().getLength()).isZero();
        assertThat(stats.getCurrentStreak().getMatchIds()).isEmpty();
    }

    @Test
    void shouldReturnMatchIdsForCurrentStreak() {
        createMatch(captainA, captainB, (short) 0, (short) 3, TestSeasons.CURRENT); // A loses
        Match second = createMatch(captainA, captainB, (short) 3, (short) 1, TestSeasons.CURRENT);
        Match third = createMatch(captainA, captainB, (short) 2, (short) 0, TestSeasons.CURRENT);

        DashboardStatsResponse stats = matchService.getCaptainDashboardStats();

        assertThat(stats.getCurrentStreak().getMatchIds())
                .containsExactly(second.getId(), third.getId());
    }

    @Test
    void shouldExcludeExhibitionMatchesFromStreaks() {
        createMatch(captainA, captainB, (short) 3, (short) 1, TestSeasons.CURRENT);
        createExhibitionMatch(captainA, captainB, (short) 0, (short) 5, TestSeasons.CURRENT);
        createMatch(captainA, captainB, (short) 2, (short) 0, TestSeasons.CURRENT);

        DashboardStatsResponse stats = matchService.getCaptainDashboardStats();

        assertThat(stats.getCurrentStreak().getCaptainName()).isEqualTo("Dashboard Captain A");
        assertThat(stats.getCurrentStreak().getLength()).isEqualTo(2);
    }
}