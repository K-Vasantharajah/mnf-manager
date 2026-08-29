package com.mnfmanager.player;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "player_positions")
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerPosition {

    @EqualsAndHashCode.Include
    @EmbeddedId
    private PlayerPositionId id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("playerId")
    @JoinColumn(name = "player_id")
    private Player player;

    @Column(name = "is_primary", nullable = false)
    @Builder.Default
    private Boolean isPrimary = false;
}
