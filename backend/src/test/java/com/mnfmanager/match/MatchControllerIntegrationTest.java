package com.mnfmanager.match;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mnfmanager.BaseIntegrationTest;
import com.mnfmanager.player.Player;
import com.mnfmanager.player.PlayerRepository;

import jakarta.transaction.Transactional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
@Transactional
public class MatchControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PlayerRepository playerRepository;

    private Player captainA;
    private Player captainB;

    @BeforeEach
    void setUp() {
        captainA = playerRepository.save(Player.builder()
                .name("Match Controller Captain A")
                .strongFoot("Right")
                .active(true)
                .build());

        captainB = playerRepository.save(Player.builder()
                .name("Match Controller Captain B")
                .strongFoot("Right")
                .active(true)
                .build());
    }

    @Test
    void shouldReturnAllMatchesWithStatus200() throws Exception {
        mockMvc.perform(get("/api/v1/matches")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(java.util.List.class)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldCreateMatchWithStatus201() throws Exception {
        Map<String, Object> match = Map.of(
                "matchDate", "2026-08-25",
                "seasonYear", 2026,
                "captainAId", captainA.getId(),
                "captainBId", captainB.getId(),
                "scoreA", 3,
                "scoreB", 1,
                "durationMins", 60,
                "teamAPlayerIds", List.of(captainA.getId()),
                "teamBPlayerIds", List.of(captainB.getId()),
                "goalScorers", List.of());

        mockMvc.perform(post("/api/v1/matches")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(match)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.scoreA").value(3))
                .andExpect(jsonPath("$.scoreB").value(1))
                .andExpect(jsonPath("$.isDraw").value(false));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldReturnMatchByIdWithStatus200() throws Exception {
        Map<String, Object> match = Map.of(
                "matchDate", "2026-08-25",
                "seasonYear", 2026,
                "captainAId", captainA.getId(),
                "captainBId", captainB.getId(),
                "scoreA", 2,
                "scoreB", 2,
                "durationMins", 60,
                "teamAPlayerIds", List.of(captainA.getId()),
                "teamBPlayerIds", List.of(captainB.getId()),
                "goalScorers", List.of());

        String response = mockMvc.perform(post("/api/v1/matches")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(match)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long matchId = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(get("/api/v1/matches/{id}", matchId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(matchId))
                .andExpect(jsonPath("$.isDraw").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldReturnMatchDetailWithStatus200() throws Exception {
        Map<String, Object> match = Map.of(
                "matchDate", "2026-08-25",
                "seasonYear", 2026,
                "captainAId", captainA.getId(),
                "captainBId", captainB.getId(),
                "scoreA", 3,
                "scoreB", 1,
                "durationMins", 60,
                "teamAPlayerIds", List.of(captainA.getId()),
                "teamBPlayerIds", List.of(captainB.getId()),
                "goalScorers", List.of());

        String response = mockMvc.perform(post("/api/v1/matches")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(match)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long matchId = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(get("/api/v1/matches/{id}/detail", matchId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(matchId))
                .andExpect(jsonPath("$.captainAName").value("Match Controller Captain A"))
                .andExpect(jsonPath("$.captainBName").value("Match Controller Captain B"))
                .andExpect(jsonPath("$.teamAPlayers").isArray())
                .andExpect(jsonPath("$.teamBPlayers").isArray())
                .andExpect(jsonPath("$.goalScorers").isArray());
    }

    @Test
    void shouldReturnMatchesBySeasonWithStatus200() throws Exception {
        mockMvc.perform(get("/api/v1/matches/season/{year}", 2026)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(java.util.List.class)));
    }

    @Test
    void shouldReturn404ForNonExistentMatch() throws Exception {
        mockMvc.perform(get("/api/v1/matches/{id}", 99999L)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not found"));
    }

    @Test
    void shouldReturn403WhenCreatingMatchWithoutAuth() throws Exception {
        Map<String, Object> match = Map.of(
                "matchDate", "2026-08-25",
                "seasonYear", 2026,
                "captainAId", captainA.getId(),
                "captainBId", captainB.getId(),
                "scoreA", 3,
                "scoreB", 1,
                "durationMins", 60,
                "teamAPlayerIds", List.of(captainA.getId()),
                "teamBPlayerIds", List.of(captainB.getId()),
                "goalScorers", List.of());

        mockMvc.perform(post("/api/v1/matches")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(match)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldUpdateMatchWithStatus200() throws Exception {
        Map<String, Object> match = Map.of(
                "matchDate", "2026-08-25",
                "seasonYear", 2026,
                "captainAId", captainA.getId(),
                "captainBId", captainB.getId(),
                "scoreA", 3,
                "scoreB", 1,
                "durationMins", 60,
                "teamAPlayerIds", List.of(captainA.getId()),
                "teamBPlayerIds", List.of(captainB.getId()),
                "goalScorers", List.of());

        String response = mockMvc.perform(post("/api/v1/matches")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(match)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long matchId = objectMapper.readTree(response).get("id").asLong();

        Map<String, Object> updatedMatch = Map.of(
                "matchDate", "2026-08-25",
                "seasonYear", 2026,
                "captainAId", captainA.getId(),
                "captainBId", captainB.getId(),
                "scoreA", 2,
                "scoreB", 2,
                "durationMins", 60,
                "teamAPlayerIds", List.of(captainA.getId()),
                "teamBPlayerIds", List.of(captainB.getId()),
                "goalScorers", List.of());

        mockMvc.perform(put("/api/v1/matches/{id}", matchId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedMatch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scoreA").value(2))
                .andExpect(jsonPath("$.scoreB").value(2))
                .andExpect(jsonPath("$.isDraw").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldCreateExhibitionMatchWithStatus201() throws Exception {
        Map<String, Object> match = new HashMap<>();
        match.put("matchDate", "2026-08-25");
        match.put("seasonYear", 2026);
        match.put("captainAId", captainA.getId());
        match.put("captainBId", captainB.getId());
        match.put("scoreA", 5);
        match.put("scoreB", 0);
        match.put("durationMins", 60);
        match.put("isExhibition", true);
        match.put("teamAPlayerIds", List.of(captainA.getId()));
        match.put("teamBPlayerIds", List.of(captainB.getId()));
        match.put("goalScorers", List.of());

        mockMvc.perform(post("/api/v1/matches")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(match)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.isExhibition").value(true));
    }
}