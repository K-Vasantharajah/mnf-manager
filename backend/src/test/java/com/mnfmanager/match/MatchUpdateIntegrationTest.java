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
public class MatchUpdateIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MatchService matchService;

    @Autowired
    private PlayerRepository playerRepository;

    private Player captainA;
    private Player captainB;
    private Player player1;
    private Player player2;
    private Match createdMatch;

    @BeforeEach
    void setUp() {
        captainA = playerRepository.save(Player.builder()
                .name("Captain A")
                .strongFoot("Right")
                .active(true)
                .notes("Test")
                .build());

        captainB = playerRepository.save(Player.builder()
                .name("Captain B")
                .strongFoot("Right")
                .active(true)
                .notes("Test")
                .build());

        player1 = playerRepository.save(Player.builder()
                .name("Player 1")
                .strongFoot("Right")
                .active(true)
                .notes("Test")
                .build());

        player2 = playerRepository.save(Player.builder()
                .name("Player 2")
                .strongFoot("Left")
                .active(true)
                .notes("Test")
                .build());

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

        createdMatch = matchService.createMatch(request);
    }

    @Test
    void shouldUpdateMatchScore() {
        CreateMatchRequest updateRequest = new CreateMatchRequest();
        updateRequest.setMatchDate(LocalDate.of(2026, 8, 25));
        updateRequest.setSeasonYear((short) 2026);
        updateRequest.setCaptainAId(captainA.getId());
        updateRequest.setCaptainBId(captainB.getId());
        updateRequest.setScoreA((short) 1);
        updateRequest.setScoreB((short) 4);
        updateRequest.setDurationMins((short) 60);
        updateRequest.setTeamAPlayerIds(List.of(captainA.getId(), player1.getId()));
        updateRequest.setTeamBPlayerIds(List.of(captainB.getId(), player2.getId()));
        updateRequest.setGoalScorers(List.of());

        Match updated = matchService.updateMatch(createdMatch.getId(), updateRequest);

        assertThat(updated.getScoreA()).isEqualTo((short) 1);
        assertThat(updated.getScoreB()).isEqualTo((short) 4);
        assertThat(updated.getWinner().getId()).isEqualTo(captainB.getId());
        assertThat(updated.getIsDraw()).isFalse();
    }

    @Test
    void shouldUpdateMatchToADraw() {
        CreateMatchRequest updateRequest = new CreateMatchRequest();
        updateRequest.setMatchDate(LocalDate.of(2026, 8, 25));
        updateRequest.setSeasonYear((short) 2026);
        updateRequest.setCaptainAId(captainA.getId());
        updateRequest.setCaptainBId(captainB.getId());
        updateRequest.setScoreA((short) 2);
        updateRequest.setScoreB((short) 2);
        updateRequest.setDurationMins((short) 60);
        updateRequest.setTeamAPlayerIds(List.of(captainA.getId(), player1.getId()));
        updateRequest.setTeamBPlayerIds(List.of(captainB.getId(), player2.getId()));
        updateRequest.setGoalScorers(List.of());

        Match updated = matchService.updateMatch(createdMatch.getId(), updateRequest);

        assertThat(updated.getIsDraw()).isTrue();
        assertThat(updated.getWinner()).isNull();
    }

    @Test
    void shouldReverseAndRecalculatePlayerStats() {
        Player originalPlayer1 = playerRepository
                .findByIdWithFullDetails(player1.getId()).orElseThrow();
        var originalStats = originalPlayer1.getSeasonStats().stream()
                .filter(s -> s.getSeasonYear() == 2026)
                .findFirst().orElseThrow();

        assertThat(originalStats.getWins()).isEqualTo((short) 1);
        assertThat(originalStats.getGoals()).isEqualTo((short) 2);

        CreateMatchRequest updateRequest = new CreateMatchRequest();
        updateRequest.setMatchDate(LocalDate.of(2026, 8, 25));
        updateRequest.setSeasonYear((short) 2026);
        updateRequest.setCaptainAId(captainA.getId());
        updateRequest.setCaptainBId(captainB.getId());
        updateRequest.setScoreA((short) 1);
        updateRequest.setScoreB((short) 4);
        updateRequest.setDurationMins((short) 60);
        updateRequest.setTeamAPlayerIds(List.of(captainA.getId(), player1.getId()));
        updateRequest.setTeamBPlayerIds(List.of(captainB.getId(), player2.getId()));

        CreateMatchRequest.GoalScorerRequest gs = new CreateMatchRequest.GoalScorerRequest();
        gs.setPlayerId(player1.getId());
        gs.setGoals((short) 1);
        gs.setTeam('A');
        updateRequest.setGoalScorers(List.of(gs));

        matchService.updateMatch(createdMatch.getId(), updateRequest);

        Player updatedPlayer1 = playerRepository
                .findByIdWithFullDetails(player1.getId()).orElseThrow();
        var updatedStats = updatedPlayer1.getSeasonStats().stream()
                .filter(s -> s.getSeasonYear() == 2026)
                .findFirst().orElseThrow();

        assertThat(updatedStats.getWins()).isEqualTo((short) 0);
        assertThat(updatedStats.getLosses()).isEqualTo((short) 1);
        assertThat(updatedStats.getGoals()).isEqualTo((short) 1);
    }

    @Test
    void shouldUpdateGoalScorers() {
        CreateMatchRequest updateRequest = new CreateMatchRequest();
        updateRequest.setMatchDate(LocalDate.of(2026, 8, 25));
        updateRequest.setSeasonYear((short) 2026);
        updateRequest.setCaptainAId(captainA.getId());
        updateRequest.setCaptainBId(captainB.getId());
        updateRequest.setScoreA((short) 3);
        updateRequest.setScoreB((short) 1);
        updateRequest.setDurationMins((short) 60);
        updateRequest.setTeamAPlayerIds(List.of(captainA.getId(), player1.getId()));
        updateRequest.setTeamBPlayerIds(List.of(captainB.getId(), player2.getId()));

        CreateMatchRequest.GoalScorerRequest gs1 = new CreateMatchRequest.GoalScorerRequest();
        gs1.setPlayerId(player1.getId());
        gs1.setGoals((short) 1);
        gs1.setTeam('A');

        CreateMatchRequest.GoalScorerRequest gs2 = new CreateMatchRequest.GoalScorerRequest();
        gs2.setPlayerId(captainA.getId());
        gs2.setGoals((short) 2);
        gs2.setTeam('A');

        updateRequest.setGoalScorers(List.of(gs1, gs2));

        Match updated = matchService.updateMatch(createdMatch.getId(), updateRequest);

        assertThat(updated.getGoalScorers()).hasSize(2);
    }

    @Test
    void shouldUpdateMatchDate() {
        CreateMatchRequest updateRequest = new CreateMatchRequest();
        updateRequest.setMatchDate(LocalDate.of(2026, 9, 1));
        updateRequest.setSeasonYear((short) 2026);
        updateRequest.setCaptainAId(captainA.getId());
        updateRequest.setCaptainBId(captainB.getId());
        updateRequest.setScoreA((short) 3);
        updateRequest.setScoreB((short) 1);
        updateRequest.setDurationMins((short) 60);
        updateRequest.setTeamAPlayerIds(List.of(captainA.getId()));
        updateRequest.setTeamBPlayerIds(List.of(captainB.getId()));
        updateRequest.setGoalScorers(List.of());

        Match updated = matchService.updateMatch(createdMatch.getId(), updateRequest);

        assertThat(updated.getMatchDate()).isEqualTo(LocalDate.of(2026, 9, 1));
    }

}