package com.mnfmanager.player;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mnfmanager.BaseIntegrationTest;

import jakarta.transaction.Transactional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
@Transactional
public class PlayerControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PlayerRepository playerRepository;

    private Player testPlayer;

    @BeforeEach
    void setUp() {
        testPlayer = playerRepository.save(Player.builder()
                .name("Controller Test Player")
                .strongFoot("Right")
                .active(true)
                .notes("Test notes")
                .build());
    }

    @Test
    void shouldReturnAllPlayersWithStatus200() throws Exception {
        mockMvc.perform(get("/api/v1/players")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(java.util.List.class)))
                .andExpect(jsonPath("$[*].name", hasItem("Controller Test Player")));
    }

    @Test
    void shouldReturnPlayerByIdWithStatus200() throws Exception {
        mockMvc.perform(get("/api/v1/players/{id}", testPlayer.getId())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testPlayer.getId()))
                .andExpect(jsonPath("$.name").value("Controller Test Player"))
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    void shouldReturn404ForNonExistentPlayer() throws Exception {
        mockMvc.perform(get("/api/v1/players/{id}", 99999L)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not found"));
    }

    @Test
    void shouldCreatePlayerWithStatus201() throws Exception {
        Map<String, Object> newPlayer = Map.of(
                "name", "New Test Player",
                "strongFoot", "Left",
                "active", true,
                "notes", "Created via controller test"
        );

        mockMvc.perform(post("/api/v1/players")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newPlayer)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("New Test Player"))
                .andExpect(jsonPath("$.strongFoot").value("Left"));
    }

    @Test
    void shouldUpdatePlayerWithStatus200() throws Exception {
        Map<String, Object> update = Map.of(
                "name", "Updated Player Name",
                "strongFoot", "Left",
                "active", true,
                "notes", "Updated notes"
        );

        mockMvc.perform(put("/api/v1/players/{id}", testPlayer.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Player Name"))
                .andExpect(jsonPath("$.strongFoot").value("Left"));
    }

    @Test
    void shouldDeactivatePlayerWithStatus204() throws Exception {
        mockMvc.perform(delete("/api/v1/players/{id}", testPlayer.getId())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());
    }

    @Test
    void shouldReturnPlayerProfileWithStatus200() throws Exception {
        mockMvc.perform(get("/api/v1/players/{id}/profile", testPlayer.getId())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testPlayer.getId()))
                .andExpect(jsonPath("$.name").value("Controller Test Player"))
                .andExpect(jsonPath("$.careerStats").exists())
                .andExpect(jsonPath("$.seasonStats").isArray());
    }

    @Test
    void shouldReturnLeaderboardWithStatus200() throws Exception {
        mockMvc.perform(get("/api/v1/players/leaderboard")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(java.util.List.class)));
    }

    @Test
    void shouldReturnLeaderboardFilteredBySeasonYear() throws Exception {
        mockMvc.perform(get("/api/v1/players/leaderboard")
                .param("seasonYear", "2026")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(java.util.List.class)));
    }

    @Test
    void shouldRatePlayerWithStatus200() throws Exception {
        Map<String, Object> rating = Map.of(
                "ability", 8,
                "reliability", 9,
                "goalThreat", 7,
                "ratedBy", "Kobi"
        );

        mockMvc.perform(post("/api/v1/players/{id}/ratings", testPlayer.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(rating)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rating.ability").value(8))
                .andExpect(jsonPath("$.rating.reliability").value(9))
                .andExpect(jsonPath("$.rating.goalThreat").value(7));
    }
}