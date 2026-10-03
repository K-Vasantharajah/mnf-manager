package com.mnfmanager.draft;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CaptainPreference(
        @JsonProperty("player_id") Long playerId,
        @JsonProperty("player_name") String playerName,
        @JsonProperty("picked_for_captain") int pickedForCaptain,
        @JsonProperty("captaincies_with_player") int captainciesWithPlayer,
        @JsonProperty("together_rate") Double togetherRate) {
}