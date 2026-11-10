package com.mnfmanager.match;

import com.mnfmanager.BaseIntegrationTest;
import com.mnfmanager.TestSeasons;
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
class ExhibitionMatchIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MatchService matchService;

    @Autowired
    private PlayerRepository playerRepository;

    private Player captainA;
    private Player captainB;

    @BeforeEach
    void setUp() {
        captainA = save("Exhibition Captain A");
        captainB = save("Exhibition Captain B");
    }

    @Test
    void exhibitionsAreNumberedSeparately() {
        Match first = matchService.createMatch(request(false));
        Match friendly = matchService.createMatch(request(true));
        Match second = matchService.createMatch(request(false));

        assertThat(first.getGameWeek()).isEqualTo("GW1");
        assertThat(friendly.getGameWeek()).isEqualTo("EX1");
        assertThat(friendly.getIsExhibition()).isTrue();
        assertThat(second.getGameWeek()).isEqualTo("GW2");
    }

    @Test
    void switchingToExhibitionRemovesItsStats() {
        Match match = matchService.createMatch(request(false));
        assertThat(matchesPlayed(captainA)).isEqualTo(1);

        CreateMatchRequest update = request(true);
        update.setGameWeek(match.getGameWeek());
        Match updated = matchService.updateMatch(match.getId(), update);

        assertThat(updated.getIsExhibition()).isTrue();
        assertThat(updated.getGameWeek()).isEqualTo("EX1");
        assertThat(matchesPlayed(captainA)).isZero();
    }

    @Test
    void editWithoutTheFlagKeepsItAnExhibition() {
        Match match = matchService.createMatch(request(true));

        CreateMatchRequest update = request(true);
        update.setIsExhibition(null);
        update.setGameWeek(match.getGameWeek());

        assertThat(matchService.updateMatch(match.getId(), update).getIsExhibition()).isTrue();
    }

    private int matchesPlayed(Player player) {
        return playerRepository.findByIdWithFullDetails(player.getId()).orElseThrow()
                .getSeasonStats().stream()
                .filter(s -> s.getSeasonYear() == TestSeasons.CURRENT)
                .mapToInt(s -> s.getMatchesPlayed())
                .sum();
    }

    private CreateMatchRequest request(boolean exhibition) {
        CreateMatchRequest request = new CreateMatchRequest();
        request.setMatchDate(LocalDate.now());
        request.setSeasonYear((short) TestSeasons.CURRENT);
        request.setIsExhibition(exhibition);
        request.setCaptainAId(captainA.getId());
        request.setCaptainBId(captainB.getId());
        request.setScoreA((short) 2);
        request.setScoreB((short) 1);
        request.setDurationMins((short) 60);
        request.setTeamAPlayerIds(List.of(captainA.getId()));
        request.setTeamBPlayerIds(List.of(captainB.getId()));
        request.setGoalScorers(List.of());
        return request;
    }

    private Player save(String name) {
        return playerRepository.save(Player.builder()
                .name(name).strongFoot("Right").active(true).build());
    }
}