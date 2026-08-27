package com.mnfmanager.player;

import com.mnfmanager.BaseIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
public class PlayerProfileIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private PlayerService playerService;

    @Autowired
    private PlayerRepository playerRepository;

    private Player player;

    @BeforeEach
    void setUp() {
        player = playerRepository.save(Player.builder()
                .name("Test Player")
                .strongFoot("Right")
                .active(true)
                .notes("Test notes")
                .build());

        PlayerRating rating = PlayerRating.builder()
                .player(player)
                .ability((short) 8)
                .reliability((short) 9)
                .goalThreat((short) 7)
                .ratedBy("Kobi")
                .build();
        player.setRating(rating);
        playerRepository.saveAndFlush(player);

        PlayerSeasonStats stats2026 = PlayerSeasonStats.builder()
                .player(player)
                .seasonYear((short) 2026)
                .matchesPlayed((short) 10)
                .wins((short) 7)
                .draws((short) 1)
                .losses((short) 2)
                .goals((short) 5)
                .assists((short) 3)
                .build();
        player.getSeasonStats().add(stats2026);
        playerRepository.saveAndFlush(player);

        PlayerSeasonStats stats2025 = PlayerSeasonStats.builder()
                .player(player)
                .seasonYear((short) 2025)
                .matchesPlayed((short) 20)
                .wins((short) 12)
                .draws((short) 3)
                .losses((short) 5)
                .goals((short) 8)
                .assists((short) 4)
                .build();

        player.getSeasonStats().add(stats2025);
        playerRepository.saveAndFlush(player);
    }

    @Test
    void shouldReturnPlayerProfile() {
        PlayerProfileResponse profile = playerService.getPlayerProfile(player.getId());

        assertThat(profile).isNotNull();
        assertThat(profile.getId()).isEqualTo(player.getId());
        assertThat(profile.getName()).isEqualTo("Test Player");
        assertThat(profile.getStrongFoot()).isEqualTo("Right");
        assertThat(profile.getActive()).isTrue();
    }

    @Test
    void shouldReturnCorrectRatings() {
        PlayerProfileResponse profile = playerService.getPlayerProfile(player.getId());

        assertThat(profile.getAbility()).isEqualTo((short) 8);
        assertThat(profile.getReliability()).isEqualTo((short) 9);
        assertThat(profile.getGoalThreat()).isEqualTo((short) 7);
    }

    @Test
    void shouldReturnSeasonStatsInDescendingOrder() {
        PlayerProfileResponse profile = playerService.getPlayerProfile(player.getId());

        assertThat(profile.getSeasonStats()).hasSize(2);
        assertThat(profile.getSeasonStats().get(0).getSeasonYear()).isEqualTo((short) 2026);
        assertThat(profile.getSeasonStats().get(1).getSeasonYear()).isEqualTo((short) 2025);
    }

    @Test
    void shouldCalculateCorrectSeasonStats() {
        PlayerProfileResponse profile = playerService.getPlayerProfile(player.getId());

        var stats2026 = profile.getSeasonStats().stream()
                .filter(s -> s.getSeasonYear() == 2026)
                .findFirst()
                .orElseThrow();

        assertThat(stats2026.getMatchesPlayed()).isEqualTo(10);
        assertThat(stats2026.getWins()).isEqualTo(7);
        assertThat(stats2026.getDraws()).isEqualTo(1);
        assertThat(stats2026.getLosses()).isEqualTo(2);
        assertThat(stats2026.getGoals()).isEqualTo(5);
        assertThat(stats2026.getWinRate()).isEqualTo(70.0);
        assertThat(stats2026.getGoalsPerGame()).isEqualTo(0.5);
    }

    @Test
    void shouldCalculateCorrectCareerStats() {
        PlayerProfileResponse profile = playerService.getPlayerProfile(player.getId());

        assertThat(profile.getCareerStats().getTotalMatches()).isEqualTo(30);
        assertThat(profile.getCareerStats().getTotalWins()).isEqualTo(19);
        assertThat(profile.getCareerStats().getTotalGoals()).isEqualTo(13);
        assertThat(profile.getCareerStats().getCareerWinRate()).isEqualTo(63.3);
    }

    @Test
    void shouldReturnEmptyStatsForPlayerWithNoMatches() {
        Player newPlayer = playerRepository.save(Player.builder()
                .name("New Player")
                .strongFoot("Left")
                .active(true)
                .notes("No matches yet")
                .build());

        PlayerProfileResponse profile = playerService.getPlayerProfile(newPlayer.getId());

        assertThat(profile.getSeasonStats()).isEmpty();
        assertThat(profile.getCareerStats().getTotalMatches()).isEqualTo(0);
        assertThat(profile.getCareerStats().getCareerWinRate()).isEqualTo(0.0);
    }
    
}