package com.mnfmanager.player;

import com.mnfmanager.BaseIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
public class PlayerLeaderboardIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private PlayerService playerService;

    @Autowired
    private PlayerRepository playerRepository;

    private Player player1;
    private Player player2;
    private Player player3;

    @BeforeEach
    void setUp() {
        player1 = playerRepository.save(Player.builder()
                .name("High Win Rate")
                .strongFoot("Right")
                .active(true)
                .notes("Test")
                .build());

        player2 = playerRepository.save(Player.builder()
                .name("Mid Win Rate")
                .strongFoot("Right")
                .active(true)
                .notes("Test")
                .build());

        player3 = playerRepository.save(Player.builder()
                .name("Low Win Rate")
                .strongFoot("Right")
                .active(true)
                .notes("Test")
                .build());

        addSeasonStats(player1, (short) 2026, (short) 10, (short) 9, (short) 0, (short) 1, (short) 5);
        addSeasonStats(player2, (short) 2026, (short) 10, (short) 5, (short) 0, (short) 5, (short) 3);
        addSeasonStats(player3, (short) 2026, (short) 10, (short) 2, (short) 0, (short) 8, (short) 1);
        addSeasonStats(player1, (short) 2025, (short) 15, (short) 10, (short) 2, (short) 3, (short) 8);
    }

    private void addSeasonStats(Player player, short year, short played,
                                 short wins, short draws, short losses, short goals) {
        PlayerSeasonStats stats = PlayerSeasonStats.builder()
                .player(player)
                .seasonYear(year)
                .matchesPlayed(played)
                .wins(wins)
                .draws(draws)
                .losses(losses)
                .goals(goals)
                .assists((short) 0)
                .build();
        player.getSeasonStats().add(stats);
        playerRepository.save(player);
    }

    @Test
    void shouldReturnLeaderboardSortedByWinRate() {
        List<PlayerLeaderboardEntry> leaderboard = playerService.getLeaderboard(2026);

        assertThat(leaderboard).isNotEmpty();
        var ourPlayers = leaderboard.stream()
                .filter(e -> e.getName().equals("High Win Rate")
                        || e.getName().equals("Mid Win Rate")
                        || e.getName().equals("Low Win Rate"))
                .toList();

        assertThat(ourPlayers).hasSize(3);
        assertThat(ourPlayers.get(0).getName()).isEqualTo("High Win Rate");
        assertThat(ourPlayers.get(0).getWinRate()).isEqualTo(90.0);
        assertThat(ourPlayers.get(1).getName()).isEqualTo("Mid Win Rate");
        assertThat(ourPlayers.get(1).getWinRate()).isEqualTo(50.0);
        assertThat(ourPlayers.get(2).getName()).isEqualTo("Low Win Rate");
        assertThat(ourPlayers.get(2).getWinRate()).isEqualTo(20.0);
    }

    @Test
    void shouldFilterBySeasonYear() {
        List<PlayerLeaderboardEntry> leaderboard2026 = playerService.getLeaderboard(2026);
        List<PlayerLeaderboardEntry> leaderboard2025 = playerService.getLeaderboard(2025);

        var player1In2026 = leaderboard2026.stream()
                .filter(e -> e.getName().equals("High Win Rate"))
                .findFirst().orElseThrow();

        var player1In2025 = leaderboard2025.stream()
                .filter(e -> e.getName().equals("High Win Rate"))
                .findFirst().orElseThrow();

        assertThat(player1In2026.getMatchesPlayed()).isEqualTo(10);
        assertThat(player1In2025.getMatchesPlayed()).isEqualTo(15);
    }

    @Test
    void shouldReturnAllTimeStatsWhenNoSeasonFilter() {
        List<PlayerLeaderboardEntry> allTime = playerService.getLeaderboard(null);

        var player1AllTime = allTime.stream()
                .filter(e -> e.getName().equals("High Win Rate"))
                .findFirst().orElseThrow();

        assertThat(player1AllTime.getMatchesPlayed()).isEqualTo(25);
        assertThat(player1AllTime.getGoals()).isEqualTo(13);
    }

    @Test
    void shouldOnlyIncludePlayersWithMatchesWhenSeasonFiltered() {
        List<PlayerLeaderboardEntry> leaderboard2025 = playerService.getLeaderboard(2025);

        var player2In2025 = leaderboard2025.stream()
                .filter(e -> e.getName().equals("Mid Win Rate"))
                .findFirst();

        assertThat(player2In2025).isEmpty();
    }

    @Test
    void shouldCalculateGoalsCorrectly() {
        List<PlayerLeaderboardEntry> leaderboard = playerService.getLeaderboard(2026);

        var player1Entry = leaderboard.stream()
                .filter(e -> e.getName().equals("High Win Rate"))
                .findFirst().orElseThrow();

        assertThat(player1Entry.getGoals()).isEqualTo(5);
        assertThat(player1Entry.getGoalsPerGame()).isEqualTo(0.5);
    }
}