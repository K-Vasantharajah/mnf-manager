package com.mnfmanager.player;

import com.mnfmanager.BaseIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.nullValue;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class RatingVisibilityIntegrationTest {

    abstract static class WithRatedPlayers extends BaseIntegrationTest {

        @Autowired
        protected MockMvc mockMvc;

        @Autowired
        protected PlayerRepository playerRepository;

        protected Player visible;
        protected Player hidden;

        @BeforeEach
        void setUp() {
            visible = rated("Visible Player", false);
            hidden = rated("Hidden Player", true);
        }

        private Player rated(String name, boolean ratingHidden) {
            Player player = playerRepository.save(Player.builder()
                    .name(name).strongFoot("Right").active(true).ratingHidden(ratingHidden).build());
            player.setRating(PlayerRating.builder()
                    .player(player)
                    .attackRating((short) 80).defenceRating((short) 70)
                    .overallRating((short) 75).reliability((short) 90)
                    .ratedBy("Test").build());
            return playerRepository.saveAndFlush(player);
        }
    }

    @Nested
    @AutoConfigureMockMvc
    @Transactional
    @TestPropertySource(properties = "mnf.ratings.public=false")
    class WhenRatingsAreAdminOnly extends WithRatedPlayers {

        @Test
        @WithMockUser(roles = "MEMBER")
        void membersSeeNoRatings() throws Exception {
            mockMvc.perform(get("/api/v1/players/{id}", visible.getId()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.rating").value(nullValue()));
            mockMvc.perform(get("/api/v1/players/{id}/profile", visible.getId()))
                    .andExpect(jsonPath("$.overallRating").value(nullValue()))
                    .andExpect(jsonPath("$.ratingsVisible").value(false));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void adminsSeeRatings() throws Exception {
            mockMvc.perform(get("/api/v1/players/{id}", visible.getId()))
                    .andExpect(jsonPath("$.rating.overallRating").value(75));
        }
    }

    @Nested
    @AutoConfigureMockMvc
    @Transactional
    @TestPropertySource(properties = "mnf.ratings.public=true")
    class WhenRatingsArePublic extends WithRatedPlayers {

        @Test
        @WithMockUser(roles = "MEMBER")
        void membersSeeRatings() throws Exception {
            mockMvc.perform(get("/api/v1/players/{id}", visible.getId()))
                    .andExpect(jsonPath("$.rating.overallRating").value(75));
            mockMvc.perform(get("/api/v1/players/{id}/profile", visible.getId()))
                    .andExpect(jsonPath("$.overallRating").value(75))
                    .andExpect(jsonPath("$.ratingsVisible").value(true));
        }

        @Test
        @WithMockUser(roles = "MEMBER")
        void membersDontSeeHiddenRatings() throws Exception {
            mockMvc.perform(get("/api/v1/players/{id}", hidden.getId()))
                    .andExpect(jsonPath("$.rating").value(nullValue()));
            mockMvc.perform(get("/api/v1/players/{id}/profile", hidden.getId()))
                    .andExpect(jsonPath("$.overallRating").value(nullValue()))
                    .andExpect(jsonPath("$.ratingsVisible").value(false));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void adminsSeeHiddenRatings() throws Exception {
            mockMvc.perform(get("/api/v1/players/{id}", hidden.getId()))
                    .andExpect(jsonPath("$.rating.overallRating").value(75));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void editingAPlayerKeepsTheirOptOut() throws Exception {
            String update = """
                    {"name": "Hidden Player", "strongFoot": "Right", "active": true, "position": "CB"}
                    """;
            mockMvc.perform(put("/api/v1/players/{id}", hidden.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(update))
                    .andExpect(status().isOk());

            assertThat(playerRepository.findById(hidden.getId()).orElseThrow().getRatingHidden())
                    .isTrue();
        }
    }
}