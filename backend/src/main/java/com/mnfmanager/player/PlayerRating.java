package com.mnfmanager.player;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "player_ratings")
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerRating {

    @EqualsAndHashCode.Include
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @Column
    private Short ability;

    @Column
    private Short reliability;

    @Column(name = "goal_threat")
    private Short goalThreat;

    @Column(name = "attack_rating")
    private Short attackRating;

    @Column(name = "defence_rating")
    private Short defenceRating;

    @Column(name = "overall_rating")
    private Short overallRating;

    @Column(name = "attack_delta")
    private Short attackDelta;

    @Column(name = "defence_delta")
    private Short defenceDelta;

    @Column(name = "overall_delta")
    private Short overallDelta;

    @Column(name = "reliability_delta")
    private Short reliabilityDelta;

    @UpdateTimestamp
    @Column(name = "rated_at", nullable = false)
    private LocalDateTime ratedAt;

    @Column(name = "rated_by", length = 100)
    private String ratedBy;
}