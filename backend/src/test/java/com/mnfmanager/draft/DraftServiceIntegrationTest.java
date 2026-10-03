package com.mnfmanager.draft;

import com.mnfmanager.BaseIntegrationTest;
import com.mnfmanager.match.CreateMatchRequest;
import com.mnfmanager.match.MatchService;
import com.mnfmanager.player.Player;
import com.mnfmanager.player.PlayerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class DraftServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private DraftService draftService;

    @Autowired
    private MatchService matchService;

    @Autowired
    private PlayerRepository playerRepository;

    private Player captain;
    private Player other1;
    private Player other2;
    private Player player;

    @BeforeEach
    void setUp() {
        captain = save("Draft Captain");
        other1 = save("Draft Other 1");
        other2 = save("Draft Other 2");
        player = save("Draft Player");
    }

    // ─── Captain preferences ─────────────────────────────────────────────────

    @Test
    void countsOnlyMatchesTheCaptainCaptained() {
        record(captain, other1, List.of(player), List.of(), false); // captain picks player
        record(other1, other2, List.of(player), List.of(captain), false); // captain just playing

        CaptainPreference pref = preferenceFor(player);

        assertThat(pref.captainciesWithPlayer()).isEqualTo(1);
        assertThat(pref.pickedForCaptain()).isEqualTo(1);
    }

    @Test
    void opposingCaptainIsNeverCountedAsPickable() {
        record(captain, other1, List.of(), List.of(), false);

        assertThat(preferenceFor(other1).captainciesWithPlayer()).isZero();
    }

    @Test
    void rateHiddenBelowFiveCaptaincies() {
        for (int i = 0; i < 4; i++) {
            record(captain, other1, List.of(player), List.of(), false);
        }

        assertThat(preferenceFor(player).togetherRate()).isNull();

        record(captain, other1, List.of(), List.of(player), false); // fifth, on the other side

        CaptainPreference pref = preferenceFor(player);
        assertThat(pref.captainciesWithPlayer()).isEqualTo(5);
        assertThat(pref.pickedForCaptain()).isEqualTo(4);
        assertThat(pref.togetherRate()).isEqualTo(80.0);
    }

    @Test
    void exhibitionsAreExcluded() {
        record(captain, other1, List.of(player), List.of(), false);
        record(captain, other1, List.of(player), List.of(), true);

        assertThat(preferenceFor(player).captainciesWithPlayer()).isEqualTo(1);
    }

    // ─── Captain recommendations ─────────────────────────────────────────────

    @Test
    void recommendsNeverCaptainedFirstThenLeastRecent() {
        record(other1, other2, List.of(), List.of(), false); // other1: 1, other2: 1 (earlier)
        record(other1, captain, List.of(), List.of(), false); // other1: 2, captain: 1 (later)

        List<Long> order = draftService
                .captainRecommendations(ids(other1, other2, captain, player))
                .stream()
                .map(CaptainRecommendation::playerId)
                .toList();

        assertThat(order).containsExactly(
                player.getId(), other2.getId(), captain.getId(), other1.getId());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private CaptainPreference preferenceFor(Player target) {
        return draftService.captainPreferences(captain.getId(), List.of(target.getId()))
                .get(0);
    }

    private void record(Player captainA, Player captainB,
            List<Player> extraA, List<Player> extraB, boolean exhibition) {
        CreateMatchRequest request = new CreateMatchRequest();
        request.setMatchDate(LocalDate.now());
        request.setSeasonYear((short) LocalDate.now().getYear());
        request.setIsExhibition(exhibition);
        request.setCaptainAId(captainA.getId());
        request.setCaptainBId(captainB.getId());
        request.setScoreA((short) 1);
        request.setScoreB((short) 0);
        request.setDurationMins((short) 60);
        request.setTeamAPlayerIds(ids(Stream.concat(Stream.of(captainA), extraA.stream())));
        request.setTeamBPlayerIds(ids(Stream.concat(Stream.of(captainB), extraB.stream())));
        request.setGoalScorers(List.of());
        matchService.createMatch(request);
    }

    private Player save(String name) {
        return playerRepository.save(Player.builder()
                .name(name)
                .strongFoot("Right")
                .active(true)
                .build());
    }

    private static List<Long> ids(Player... players) {
        return ids(Stream.of(players));
    }

    private static List<Long> ids(Stream<Player> players) {
        return new ArrayList<>(players.map(Player::getId).toList());
    }
}