package com.mnfmanager.player;

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
public class PlayerPositionId implements Serializable {

    @Column(name = "player_id")
    private Long playerId;

    @Column(name = "position", length = 20)
    private String position;
}
