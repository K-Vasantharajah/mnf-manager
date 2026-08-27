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
public class MatchDetailIntegrationTest extends BaseIntegrationTest {

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

        CreateMatchRequest.GoalScorerRequest gs1 = new CreateMatchRequest.GoalScorerRequest();
        gs1.setPlayerId(player1.getId());
        gs1.setGoals((short) 2);
        gs1.setTeam('A');

        CreateMatchRequest.GoalScorerRequest gs2 = new CreateMatchRequest.GoalScorerRequest();
        gs2.setPlayerId(player2.getId());
        gs2.setGoals((short) 1);
        gs2.setTeam('B');

        request.setGoalScorers(List.of(gs1, gs2));
        createdMatch = matchService.createMatch(request);
    }

    @Test
    void shouldReturnFullMatchDetail() {
        MatchDetailResponse detail = matchService.getMatchDetail(createdMatch.getId());

        assertThat(detail).isNotNull();
        assertThat(detail.getId()).isEqualTo(createdMatch.getId());
        assertThat(detail.getScoreA()).isEqualTo((short) 3);
        assertThat(detail.getScoreB()).isEqualTo((short) 1);
        assertThat(detail.getIsDraw()).isFalse();
        assertThat(detail.getDurationMins()).isEqualTo((short) 60);
    }

    @Test
    void shouldReturnCorrectCaptains() {
        MatchDetailResponse detail = matchService.getMatchDetail(createdMatch.getId());

        assertThat(detail.getCaptainAId()).isEqualTo(captainA.getId());
        assertThat(detail.getCaptainAName()).isEqualTo("Captain A");
        assertThat(detail.getCaptainBId()).isEqualTo(captainB.getId());
        assertThat(detail.getCaptainBName()).isEqualTo("Captain B");
    }

    @Test
    void shouldReturnCorrectTeamPlayers() {
        MatchDetailResponse detail = matchService.getMatchDetail(createdMatch.getId());

        assertThat(detail.getTeamAPlayerIds()).hasSize(2);
        assertThat(detail.getTeamAPlayerIds()).contains(captainA.getId(), player1.getId());
        assertThat(detail.getTeamBPlayerIds()).hasSize(2);
        assertThat(detail.getTeamBPlayerIds()).contains(captainB.getId(), player2.getId());
    }

    @Test
    void shouldReturnCorrectGoalScorers() {
        MatchDetailResponse detail = matchService.getMatchDetail(createdMatch.getId());

        assertThat(detail.getGoalScorers()).hasSize(2);

        var scorer1 = detail.getGoalScorers().stream()
                .filter(gs -> gs.getPlayerId().equals(player1.getId()))
                .findFirst().orElseThrow();

        assertThat(scorer1.getPlayerName()).isEqualTo("Player 1");
        assertThat(scorer1.getGoals()).isEqualTo((short) 2);
        assertThat(scorer1.getTeam()).isEqualTo('A');
    }

    @Test
    void shouldReturnCorrectWinner() {
        MatchDetailResponse detail = matchService.getMatchDetail(createdMatch.getId());

        assertThat(detail.getWinnerId()).isEqualTo(captainA.getId());
    }
}