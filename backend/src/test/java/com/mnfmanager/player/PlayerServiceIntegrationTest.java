package com.mnfmanager.player;

import com.mnfmanager.BaseIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

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
    void shouldRatePlayer() {
        Player player = Player.builder()
                .name("Rated Player")
                .strongFoot("Right")
                .active(true)
                .notes("Test")
                .build();
        Player saved = playerRepository.save(player);

        PlayerRatingRequest request = new PlayerRatingRequest();
        request.setAbility((short) 8);
        request.setReliability((short) 9);
        request.setGoalThreat((short) 7);
        request.setRatedBy("Kobi");

        Player rated = playerService.ratePlayer(saved.getId(), request);

        assertThat(rated.getRating()).isNotNull();
        assertThat(rated.getRating().getAbility()).isEqualTo((short) 8);
        assertThat(rated.getRating().getReliability()).isEqualTo((short) 9);
        assertThat(rated.getRating().getGoalThreat()).isEqualTo((short) 7);
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
}