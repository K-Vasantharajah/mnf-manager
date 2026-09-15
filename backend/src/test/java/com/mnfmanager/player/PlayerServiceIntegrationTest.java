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
                .notes("Test notes")
                .build();

        Player saved = playerService.createPlayer(player);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getName()).isEqualTo("Test Player");
        assertThat(saved.getActive()).isTrue();
    }

    @Test
    void shouldGetAllActivePlayers() {
        Player player1 = Player.builder()
                .name("Active Player")
                .strongFoot("Right")
                .active(true)
                .notes("Active")
                .build();

        Player player2 = Player.builder()
                .name("Inactive Player")
                .strongFoot("Left")
                .active(false)
                .notes("Inactive")
                .build();

        playerRepository.save(player1);
        playerRepository.save(player2);

        var activePlayers = playerService.getAllActivePlayers();

        assertThat(activePlayers).isNotEmpty();
        assertThat(activePlayers).allMatch(p -> p.getActive());
    }

    @Test
    void shouldDeactivatePlayer() {
        Player player = Player.builder()
                .name("To Deactivate")
                .strongFoot("Right")
                .active(true)
                .notes("Test")
                .build();
        Player saved = playerRepository.save(player);

        playerService.deactivatePlayer(saved.getId());

        Player deactivated = playerRepository.findById(saved.getId()).orElseThrow();
        assertThat(deactivated.getActive()).isFalse();
    }

    @Test
    void shouldCalculateWinRate() {
        Player player = Player.builder()
                .name("Win Rate Player")
                .strongFoot("Right")
                .active(true)
                .notes("Test")
                .build();
        Player saved = playerRepository.save(player);

        PlayerSeasonStats stats = PlayerSeasonStats.builder()
                .player(saved)
                .seasonYear((short) 2026)
                .matchesPlayed((short) 10)
                .wins((short) 7)
                .draws((short) 1)
                .losses((short) 2)
                .goals((short) 5)
                .assists((short) 3)
                .build();
        saved.getSeasonStats().add(stats);
        playerRepository.save(saved);

        Player withStats = playerRepository.findByIdWithFullDetails(saved.getId()).orElseThrow();
        double winRate = playerService.calculateWinRate(withStats);

        assertThat(winRate).isEqualTo(70.0);
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
                .notes("Active")
                .build());

        playerRepository.save(Player.builder()
                .name("Inactive Player")
                .strongFoot("Right")
                .active(false)
                .notes("Inactive")
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
                .notes("Test")
                .build());

        playerService.deactivatePlayer(player.getId());

        Player deactivated = playerRepository.findById(player.getId()).orElseThrow();
        assertThat(deactivated.getActive()).isFalse();

        List<Player> activePlayers = playerService.getAllActivePlayers();
        assertThat(activePlayers)
                .extracting(Player::getName)
                .doesNotContain("To Deactivate");
        }
}