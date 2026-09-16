package com.mnfmanager.player;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PlayerMatchResponse {
    private Long id;
    private String gameWeek;
    private Integer seasonYear;
    private String captainAName;
    private String captainBName;
    private Integer scoreA;
    private Integer scoreB;
    private String result;
}