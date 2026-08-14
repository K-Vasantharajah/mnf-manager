package com.mnfmanager.player;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "player_positions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerPosition {

    @EmbeddedId
    private PlayerPositionId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("playerId")
    @JoinColumn(name = "player_id")
    private Player player;

    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary = false;
}
