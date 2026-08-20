package com.mnfmanager.match;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchPlayerId implements Serializable {

    @Column(name = "match_id")
    private Long matchId;

    @Column(name = "player_id")
    private Long playerId;
}