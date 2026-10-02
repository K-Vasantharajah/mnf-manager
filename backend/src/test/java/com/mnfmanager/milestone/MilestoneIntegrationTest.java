package com.mnfmanager.milestone;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mnfmanager.BaseIntegrationTest;
import com.mnfmanager.match.CreateMatchRequest;
import com.mnfmanager.match.MatchService;
import com.mnfmanager.player.Player;
import com.mnfmanager.player.PlayerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
@Transactional
@WithMockUser(roles = "MEMBER")
class MilestoneIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MilestoneService milestoneService;

    @Autowired
    private MatchService matchService;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private Player captainA;
    private Player captainB;
    private Player scorer;

    @BeforeEach
    void setUp() {
        captainA = save("Milestone Captain A");
        captainB = save("Milestone Captain B");
        scorer = save("Milestone Scorer");
    }

    @Test
    void historyExcludesExhibitionMatches() {
        record(3, 1, false, List.of());
        record(0, 5, true, List.of());

        List<MatchRecord> history = milestoneService.loadHistory();

        assertThat(history).hasSize(1);
        assertThat(history.get(0).winningTeam()).isEqualTo('A');
        assertThat(history.get(0).teams()).containsEntry(scorer.getId(), 'A');
    }

    @Test
    void historyMapsWinnerToTeamB() {
        record(1, 2, false, List.of());

        assertThat(milestoneService.loadHistory().get(0).winningTeam()).isEqualTo('B');
    }

    @Test
    void historyRecordsDrawWithNoWinningTeam() {
        record(2, 2, false, List.of());

        assertThat(milestoneService.loadHistory().get(0).winningTeam()).isNull();
    }

    @Test
    void historyExcludesOwnGoals() {
        record(3, 1, false, List.of(goal(scorer, 2, false), goal(scorer, 1, true)));

        assertThat(milestoneService.loadHistory().get(0).goalsFor(scorer.getId())).isEqualTo(2);
    }

    @Test
    void endpointReturnsGoalMilestone() throws Exception {
        record(8, 0, false, List.of(goal(scorer, 8, false)));

        mockMvc.perform(post("/api/v1/draft/milestones")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                        Map.of("playerIds", List.of(scorer.getId())))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.type == 'GOAL_MILESTONE')].value").value(10))
                .andExpect(jsonPath("$[?(@.type == 'GOAL_MILESTONE')].remaining").value(2));
    }

    @Test
    void endpointRejectsEmptySquad() throws Exception {
        mockMvc.perform(post("/api/v1/draft/milestones")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("playerIds", List.of()))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithAnonymousUser
    void endpointRequiresAccess() throws Exception {
        mockMvc.perform(post("/api/v1/draft/milestones")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                        Map.of("playerIds", List.of(scorer.getId())))))
                .andExpect(status().isUnauthorized());
    }

    private Player save(String name) {
        return playerRepository.save(Player.builder()
                .name(name)
                .strongFoot("Right")
                .active(true)
                .build());
    }

    private void record(int scoreA, int scoreB, boolean exhibition,
            List<CreateMatchRequest.GoalScorerRequest> goals) {
        CreateMatchRequest request = new CreateMatchRequest();
        request.setMatchDate(LocalDate.of(2026, 8, 25));
        request.setSeasonYear((short) 2026);
        request.setIsExhibition(exhibition);
        request.setCaptainAId(captainA.getId());
        request.setCaptainBId(captainB.getId());
        request.setScoreA((short) scoreA);
        request.setScoreB((short) scoreB);
        request.setDurationMins((short) 60);
        request.setTeamAPlayerIds(List.of(captainA.getId(), scorer.getId()));
        request.setTeamBPlayerIds(List.of(captainB.getId()));
        request.setGoalScorers(goals);
        matchService.createMatch(request);
    }

    private static CreateMatchRequest.GoalScorerRequest goal(Player player, int goals, boolean ownGoal) {
        CreateMatchRequest.GoalScorerRequest goal = new CreateMatchRequest.GoalScorerRequest();
        goal.setPlayerId(player.getId());
        goal.setGoals((short) goals);
        goal.setTeam('A');
        goal.setIsOwnGoal(ownGoal);
        return goal;
    }
}