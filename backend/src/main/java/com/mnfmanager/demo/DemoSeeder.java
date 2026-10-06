package com.mnfmanager.demo;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mnfmanager.match.CreateMatchRequest;
import com.mnfmanager.match.MatchService;
import com.mnfmanager.player.Player;
import com.mnfmanager.player.PlayerRating;
import com.mnfmanager.player.PlayerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Loads the synthetic group into a freshly reset demo database. Matches go
 * through MatchService, the same path as the match form, so season stats and
 * game weeks are derived exactly as they are for real matches.
 */
@Component
@Profile("demo")
@RequiredArgsConstructor
@Slf4j
public class DemoSeeder implements ApplicationRunner {

    private final ObjectMapper objectMapper;
    private final PlayerRepository playerRepository;
    private final MatchService matchService;

    @Override
    public void run(ApplicationArguments args) throws IOException {
        DemoFixture.Data data = read("demo/demo-data.json", new TypeReference<>() {
        });

        Map<String, Long> ids = new HashMap<>();
        for (DemoFixture.DemoPlayer p : data.players()) {
            Player saved = playerRepository.save(Player.builder()
                    .name(p.name())
                    .position(p.position())
                    .strongFoot("Right")
                    .active(true)
                    .build());
            ids.put(p.name(), saved.getId());
        }

        LocalDate lastMonday = LocalDate.now().with(TemporalAdjusters.previous(DayOfWeek.MONDAY));

        data.matches().stream()
                .sorted(Comparator.comparingInt(DemoFixture.DemoMatch::weeksAgo).reversed())
                .forEach(m -> matchService.createMatch(toRequest(m, ids, lastMonday)));

        int rated = seedRatings(ids);
        log.info("Demo seeded: {} players, {} matches, {} ratings",
                ids.size(), data.matches().size(), rated);
    }

    private CreateMatchRequest toRequest(
            DemoFixture.DemoMatch m, Map<String, Long> ids, LocalDate lastMonday) {
        LocalDate date = lastMonday.minusWeeks(m.weeksAgo());

        CreateMatchRequest request = new CreateMatchRequest();
        request.setMatchDate(date);
        request.setSeasonYear((short) date.getYear());
        request.setIsExhibition(m.exhibition());
        request.setCaptainAId(ids.get(m.captainA()));
        request.setCaptainBId(ids.get(m.captainB()));
        request.setScoreA((short) m.scoreA());
        request.setScoreB((short) m.scoreB());
        request.setDurationMins((short) 60);
        request.setTeamAPlayerIds(m.teamA().stream().map(ids::get).toList());
        request.setTeamBPlayerIds(m.teamB().stream().map(ids::get).toList());
        request.setGoalScorers(m.goals().stream().map(g -> {
            CreateMatchRequest.GoalScorerRequest goal = new CreateMatchRequest.GoalScorerRequest();
            goal.setPlayerId(ids.get(g.player()));
            goal.setGoals((short) g.goals());
            goal.setTeam(g.team().charAt(0));
            goal.setIsOwnGoal(g.ownGoal());
            return goal;
        }).toList());
        return request;
    }

    private int seedRatings(Map<String, Long> ids) throws IOException {
        if (!new ClassPathResource("demo/demo-ratings.json").exists()) {
            log.warn("No demo ratings fixture; demo players will have no ratings");
            return 0;
        }
        List<DemoFixture.DemoRating> ratings = read("demo/demo-ratings.json", new TypeReference<>() {
        });

        int count = 0;
        for (DemoFixture.DemoRating r : ratings) {
            Long id = ids.get(r.name());
            if (id == null) {
                continue;
            }
            Player player = playerRepository.findById(id).orElseThrow();
            player.setRating(PlayerRating.builder()
                    .player(player)
                    .attackRating(r.attackRating())
                    .defenceRating(r.defenceRating())
                    .overallRating(r.overallRating())
                    .reliability(r.reliability())
                    .attackDelta((short) 0)
                    .defenceDelta((short) 0)
                    .overallDelta((short) 0)
                    .reliabilityDelta((short) 0)
                    .ratedBy("Demo seed")
                    .build());
            playerRepository.save(player);
            count++;
        }
        return count;
    }

    private <T> T read(String path, TypeReference<T> type) throws IOException {
        return objectMapper.readValue(new ClassPathResource(path).getInputStream(), type);
    }
}