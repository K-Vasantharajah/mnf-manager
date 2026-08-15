package com.mnfmanager.player;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PlayerStatsResponse {
    private Long playerId;
    private String name;
    private Double winRate;
    private Double contributionScore;
}