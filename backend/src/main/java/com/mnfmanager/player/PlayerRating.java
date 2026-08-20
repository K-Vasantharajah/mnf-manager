package com.mnfmanager.player;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

    @Min(1) @Max(10)
    @Column(nullable = false)
    private Short ability;

    @Min(1) @Max(10)
    @Column(nullable = false)
    private Short reliability;

    @Min(1) @Max(10)
    @Column(name = "goal_threat", nullable = false)
    private Short goalThreat;

    @Column(name = "rated_at", nullable = false)
    private LocalDateTime ratedAt;

    @Column(name = "rated_by", length = 100)
    private String ratedBy;

    @PrePersist
    @PreUpdate
    protected void onRating() {
        ratedAt = LocalDateTime.now();
    }
}
