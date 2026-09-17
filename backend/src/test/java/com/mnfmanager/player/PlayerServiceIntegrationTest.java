package com.mnfmanager.player;

import com.mnfmanager.BaseIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import com.mnfmanager.common.exception.ResourceNotFoundException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import java.util.List;

@Transactional
public class PlayerServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private PlayerService playerService;

    @Autowired
    private PlayerRepository playerRepository;

    @Test
    void shouldCreatePlayer() {
        Player player = Player.builder()
                .name("Test Player")
                .strongFoot("Right")
                .active(true)
                .build();

        Player saved = playerService.createPlayer(player);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getName()).isEqualTo("Test Player");
        assertThat(saved.getActive()).isTrue();
    }

    @Test
    void shouldCalculatePointsPercentageCorrectly() {
        Player player = playerRepository.save(Player.builder()
                .name("Pt% Player")
                .strongFoot("Right")
                .active(true)
                .build());

        PlayerSeasonStats stats = PlayerSeasonStats.builder()
                .player(player)
                .seasonYear((short) 2026)
                .matchesPlayed((short) 10)
                .wins((short) 7)
                .draws((short) 1)
                .losses((short) 2)
                .goals((short) 5)
                .assists((short) 3)
                .build();
        player.getSeasonStats().add(stats);
        playerRepository.save(player);

        List<PlayerLeaderboardEntry> leaderboard = playerService.getLeaderboard(2026);
        var entry = leaderboard.stream()
                .filter(e -> e.getName().equals("Pt% Player"))
                .findFirst().orElseThrow();

        // (7*3 + 1) / (10*3) * 100 = 22/30 * 100 = 73.3
        assertThat(entry.getPointsPercentage()).isEqualTo(73.3);
    }

    @Test
    void shouldThrowExceptionForNonExistentPlayer() {
        assertThatThrownBy(() -> playerService.getPlayerById(99999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99999");
    }

    @Test
    void shouldExcludeInactivePlayersFromActiveList() {
        playerRepository.save(Player.builder()
                .name("Active Player")
                .strongFoot("Right")
                .active(true)
                .build());

        playerRepository.save(Player.builder()
                .name("Inactive Player")
                .strongFoot("Right")
                .active(false)
                .build());

        List<Player> activePlayers = playerService.getAllActivePlayers();

        assertThat(activePlayers)
                .extracting(Player::getName)
                .contains("Active Player")
                .doesNotContain("Inactive Player");
    }

    @Test
    void shouldDeactivatePlayerCorrectly() {
        Player player = playerRepository.save(Player.builder()
                .name("To Deactivate")
                .strongFoot("Right")
                .active(true)
                .build());

        playerService.deactivatePlayer(player.getId());

        Player deactivated = playerRepository.findById(player.getId()).orElseThrow();
        assertThat(deactivated.getActive()).isFalse();

        List<Player> activePlayers = playerService.getAllActivePlayers();
        assertThat(activePlayers)
                .extracting(Player::getName)
                .doesNotContain("To Deactivate");
    }

    @Test
    void shouldUpdatePlayer() {
        Player player = playerRepository.save(Player.builder()
                .name("Original Name")
                .strongFoot("Right")
                .active(true)
                .build());

        Player update = Player.builder()
                .name("Updated Name")
                .strongFoot("Left")
                .active(true)
                .position("ST")
                .build();

        Player updated = playerService.updatePlayer(player.getId(), update);

        assertThat(updated.getName()).isEqualTo("Updated Name");
        assertThat(updated.getStrongFoot()).isEqualTo("Left");
        assertThat(updated.getPosition()).isEqualTo("ST");
    }
}