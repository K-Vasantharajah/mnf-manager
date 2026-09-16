package com.mnfmanager.player;

import com.mnfmanager.BaseIntegrationTest;
import com.mnfmanager.match.CreateMatchRequest;
import com.mnfmanager.match.MatchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
public class PlayerMatchHistoryIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private PlayerService playerService;

    @Autowired
    private MatchService matchService;

    @Autowired
    private PlayerRepository playerRepository;

    private Player captainA;
    private Player captainB;
    private Player player;

    @BeforeEach
    void setUp() {
        captainA = playerRepository.save(Player.builder()
                .name("Captain A")
                .strongFoot("Right")
                .active(true)
                .build());

        captainB = playerRepository.save(Player.builder()
                .name("Captain B")
                .strongFoot("Right")
                .active(true)
                .build());

        player = playerRepository.save(Player.builder()
                .name("History Player")
                .strongFoot("Right")
                .active(true)
                .build());

        // 2026 match - player on winning team A
        CreateMatchRequest request2026 = new CreateMatchRequest();
        request2026.setMatchDate(LocalDate.of(2026, 8, 25));
        request2026.setSeasonYear((short) 2026);
        request2026.setCaptainAId(captainA.getId());
        request2026.setCaptainBId(captainB.getId());
        request2026.setScoreA((short) 3);
        request2026.setScoreB((short) 1);
        request2026.setDurationMins((short) 60);
        request2026.setTeamAPlayerIds(List.of(captainA.getId(), player.getId()));
        request2026.setTeamBPlayerIds(List.of(captainB.getId()));
        request2026.setGoalScorers(List.of());
        matchService.createMatch(request2026);

        // 2025 match - player on losing team B
        CreateMatchRequest request2025 = new CreateMatchRequest();
        request2025.setMatchDate(LocalDate.of(2025, 8, 25));
        request2025.setSeasonYear((short) 2025);
        request2025.setCaptainAId(captainA.getId());
        request2025.setCaptainBId(captainB.getId());
        request2025.setScoreA((short) 3);
        request2025.setScoreB((short) 1);
        request2025.setDurationMins((short) 60);
        request2025.setTeamAPlayerIds(List.of(captainA.getId()));
        request2025.setTeamBPlayerIds(List.of(captainB.getId(), player.getId()));
        request2025.setGoalScorers(List.of());
        matchService.createMatch(request2025);
    }

    @Test
    void shouldReturnMatchHistoryForPlayer() {
        List<PlayerMatchResponse> history = playerService.getPlayerMatches(
                player.getId(), null);

        assertThat(history).hasSize(2);
    }

    @Test
    void shouldFilterMatchHistoryBySeason() {
        List<PlayerMatchResponse> history2026 = playerService.getPlayerMatches(
                player.getId(), 2026);
        List<PlayerMatchResponse> history2025 = playerService.getPlayerMatches(
                player.getId(), 2025);

        assertThat(history2026).hasSize(1);
        assertThat(history2025).hasSize(1);
    }

    @Test
    void shouldReturnCorrectResultForWin() {
        List<PlayerMatchResponse> history = playerService.getPlayerMatches(
                player.getId(), 2026);

        assertThat(history.get(0).getResult()).isEqualTo("WIN");
    }

    @Test
    void shouldReturnCorrectResultForLoss() {
        List<PlayerMatchResponse> history = playerService.getPlayerMatches(
                player.getId(), 2025);

        assertThat(history.get(0).getResult()).isEqualTo("LOSS");
    }
}