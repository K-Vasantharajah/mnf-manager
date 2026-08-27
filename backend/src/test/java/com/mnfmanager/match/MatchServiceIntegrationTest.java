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

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
public class MatchServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MatchService matchService;

    @Autowired
    private PlayerRepository playerRepository;

    private Player captainA;
    private Player captainB;
    private Player player1;
    private Player player2;
    private Player player3;

    @BeforeEach
    void setUp() {
        captainA = playerRepository.save(Player.builder()
                .name("Captain A")
                .strongFoot("Right")
                .active(true)
                .notes("Test captain A")
                .build());

        captainB = playerRepository.save(Player.builder()
                .name("Captain B")
                .strongFoot("Right")
                .active(true)
                .notes("Test captain B")
                .build());

        player1 = playerRepository.save(Player.builder()
                .name("Player 1")
                .strongFoot("Right")
                .active(true)
                .notes("Test player 1")
                .build());

        player2 = playerRepository.save(Player.builder()
                .name("Player 2")
                .strongFoot("Left")
                .active(true)
                .notes("Test player 2")
                .build());

        player3 = playerRepository.save(Player.builder()
                .name("Player 3")
                .strongFoot("Right")
                .active(true)
                .notes("Test player 3")
                .build());
    }

    @Test
    void shouldCreateMatchWithTeamsAndGoalScorers() {
        CreateMatchRequest request = new CreateMatchRequest();
        request.setMatchDate(LocalDate.of(2026, 8, 25));
        request.setSeasonYear((short) 2026);
        request.setCaptainAId(captainA.getId());
        request.setCaptainBId(captainB.getId());
        request.setScoreA((short) 3);
        request.setScoreB((short) 1);
        request.setDurationMins((short) 60);
        request.setTeamAPlayerIds(List.of(captainA.getId(), player1.getId()));
        request.setTeamBPlayerIds(List.of(captainB.getId(), player2.getId()));

        CreateMatchRequest.GoalScorerRequest gs = new CreateMatchRequest.GoalScorerRequest();
        gs.setPlayerId(player1.getId());
        gs.setGoals((short) 2);
        gs.setTeam('A');
        request.setGoalScorers(List.of(gs));

        Match saved = matchService.createMatch(request);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getScoreA()).isEqualTo((short) 3);
        assertThat(saved.getScoreB()).isEqualTo((short) 1);
        assertThat(saved.getIsDraw()).isFalse();
        assertThat(saved.getWinner().getId()).isEqualTo(captainA.getId());
        assertThat(saved.getMatchPlayers()).hasSize(4);
        assertThat(saved.getGoalScorers()).hasSize(1);
    }

    @Test
    void shouldRecordDrawCorrectly() {
        CreateMatchRequest request = new CreateMatchRequest();
        request.setMatchDate(LocalDate.of(2026, 8, 25));
        request.setSeasonYear((short) 2026);
        request.setCaptainAId(captainA.getId());
        request.setCaptainBId(captainB.getId());
        request.setScoreA((short) 2);
        request.setScoreB((short) 2);
        request.setDurationMins((short) 60);
        request.setTeamAPlayerIds(List.of(captainA.getId()));
        request.setTeamBPlayerIds(List.of(captainB.getId()));
        request.setGoalScorers(List.of());

        Match saved = matchService.createMatch(request);

        assertThat(saved.getIsDraw()).isTrue();
        assertThat(saved.getWinner()).isNull();
    }

    @Test
    void shouldUpdatePlayerSeasonStatsOnMatchCreation() {
        CreateMatchRequest request = new CreateMatchRequest();
        request.setMatchDate(LocalDate.of(2026, 8, 25));
        request.setSeasonYear((short) 2026);
        request.setCaptainAId(captainA.getId());
        request.setCaptainBId(captainB.getId());
        request.setScoreA((short) 4);
        request.setScoreB((short) 2);
        request.setDurationMins((short) 60);
        request.setTeamAPlayerIds(List.of(captainA.getId(), player1.getId()));
        request.setTeamBPlayerIds(List.of(captainB.getId(), player2.getId()));

        CreateMatchRequest.GoalScorerRequest gs = new CreateMatchRequest.GoalScorerRequest();
        gs.setPlayerId(player1.getId());
        gs.setGoals((short) 3);
        gs.setTeam('A');
        request.setGoalScorers(List.of(gs));

        matchService.createMatch(request);

        Player updatedPlayer1 = playerRepository.findByIdWithFullDetails(player1.getId()).orElseThrow();
        assertThat(updatedPlayer1.getSeasonStats()).isNotEmpty();

        var stats = updatedPlayer1.getSeasonStats().stream()
                .filter(s -> s.getSeasonYear() == 2026)
                .findFirst()
                .orElseThrow();

        assertThat(stats.getMatchesPlayed()).isEqualTo((short) 1);
        assertThat(stats.getWins()).isEqualTo((short) 1);
        assertThat(stats.getLosses()).isEqualTo((short) 0);
        assertThat(stats.getGoals()).isEqualTo((short) 3);
    }

    @Test
    void shouldGetMatchesBySeason() {
        CreateMatchRequest request2026 = new CreateMatchRequest();
        request2026.setMatchDate(LocalDate.of(2026, 8, 25));
        request2026.setSeasonYear((short) 2026);
        request2026.setCaptainAId(captainA.getId());
        request2026.setCaptainBId(captainB.getId());
        request2026.setScoreA((short) 3);
        request2026.setScoreB((short) 1);
        request2026.setTeamAPlayerIds(List.of(captainA.getId()));
        request2026.setTeamBPlayerIds(List.of(captainB.getId()));
        request2026.setGoalScorers(List.of());

        CreateMatchRequest request2025 = new CreateMatchRequest();
        request2025.setMatchDate(LocalDate.of(2025, 8, 25));
        request2025.setSeasonYear((short) 2025);
        request2025.setCaptainAId(captainA.getId());
        request2025.setCaptainBId(captainB.getId());
        request2025.setScoreA((short) 2);
        request2025.setScoreB((short) 2);
        request2025.setTeamAPlayerIds(List.of(captainA.getId()));
        request2025.setTeamBPlayerIds(List.of(captainB.getId()));
        request2025.setGoalScorers(List.of());

        matchService.createMatch(request2026);
        matchService.createMatch(request2025);

        List<Match> matches2026 = matchService.getMatchesBySeason((short) 2026);
        List<Match> matches2025 = matchService.getMatchesBySeason((short) 2025);

        assertThat(matches2026).hasSize(1);
        assertThat(matches2025).hasSize(1);
        assertThat(matches2026.get(0).getSeasonYear()).isEqualTo((short) 2026);
        assertThat(matches2025.get(0).getSeasonYear()).isEqualTo((short) 2025);
    }

    @Test
    void shouldRecordMultipleGoalScorers() {
        CreateMatchRequest request = new CreateMatchRequest();
        request.setMatchDate(LocalDate.of(2026, 8, 25));
        request.setSeasonYear((short) 2026);
        request.setCaptainAId(captainA.getId());
        request.setCaptainBId(captainB.getId());
        request.setScoreA((short) 5);
        request.setScoreB((short) 2);
        request.setDurationMins((short) 60);
        request.setTeamAPlayerIds(List.of(captainA.getId(), player1.getId(), player3.getId()));
        request.setTeamBPlayerIds(List.of(captainB.getId(), player2.getId()));

        CreateMatchRequest.GoalScorerRequest gs1 = new CreateMatchRequest.GoalScorerRequest();
        gs1.setPlayerId(player1.getId());
        gs1.setGoals((short) 2);
        gs1.setTeam('A');

        CreateMatchRequest.GoalScorerRequest gs2 = new CreateMatchRequest.GoalScorerRequest();
        gs2.setPlayerId(player3.getId());
        gs2.setGoals((short) 3);
        gs2.setTeam('A');

        CreateMatchRequest.GoalScorerRequest gs3 = new CreateMatchRequest.GoalScorerRequest();
        gs3.setPlayerId(player2.getId());
        gs3.setGoals((short) 2);
        gs3.setTeam('B');

        request.setGoalScorers(List.of(gs1, gs2, gs3));

        Match saved = matchService.createMatch(request);

        assertThat(saved.getGoalScorers()).hasSize(3);

        Player updatedPlayer1 = playerRepository.findByIdWithFullDetails(player1.getId()).orElseThrow();
        Player updatedPlayer3 = playerRepository.findByIdWithFullDetails(player3.getId()).orElseThrow();

        var stats1 = updatedPlayer1.getSeasonStats().stream()
                .filter(s -> s.getSeasonYear() == 2026)
                .findFirst().orElseThrow();
        var stats3 = updatedPlayer3.getSeasonStats().stream()
                .filter(s -> s.getSeasonYear() == 2026)
                .findFirst().orElseThrow();

        assertThat(stats1.getGoals()).isEqualTo((short) 2);
        assertThat(stats3.getGoals()).isEqualTo((short) 3);
    }
}