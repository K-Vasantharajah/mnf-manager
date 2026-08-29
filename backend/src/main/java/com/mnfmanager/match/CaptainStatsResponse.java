package com.mnfmanager.match;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class CaptainStatsResponse {

    private Long playerId;
    private String name;
    private Integer matchesCaptained;
    private Integer wins;
    private Integer draws;
    private Integer losses;
    private Double winRate;
    private List<String> mostPickedPlayers;
    private Integer seasonYear;
}