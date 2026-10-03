package com.mnfmanager.draft;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CaptainRecommendation(
        @JsonProperty("player_id") Long playerId,
        String name,
        String position,
        @JsonProperty("times_captained_this_season") int timesCaptainedThisSeason,
        @JsonProperty("last_match_id_captained") long lastMatchIdCaptained) {
}