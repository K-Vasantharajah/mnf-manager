package com.mnfmanager.player;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/players")
@RequiredArgsConstructor
@Slf4j
public class PlayerController {

    private final PlayerService playerService;

    @GetMapping
    public ResponseEntity<List<Player>> getAllPlayers() {
        return ResponseEntity.ok(playerService.getAllActivePlayers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Player> getPlayerById(@PathVariable Long id) {
        return ResponseEntity.ok(playerService.getPlayerById(id));
    }

    @PostMapping
    public ResponseEntity<Player> createPlayer(@Valid @RequestBody Player player) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(playerService.createPlayer(player));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Player> updatePlayer(
            @PathVariable Long id,
            @Valid @RequestBody Player updatedPlayer) {
        return ResponseEntity.ok(playerService.updatePlayer(id, updatedPlayer));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivatePlayer(@PathVariable Long id) {
        playerService.deactivatePlayer(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<PlayerStatsResponse> getPlayerStats(@PathVariable Long id) {
        Player player = playerService.getPlayerById(id);
        return ResponseEntity.ok(PlayerStatsResponse.builder()
                .playerId(player.getId())
                .name(player.getName())
                .winRate(playerService.calculateWinRate(player))
                .contributionScore(playerService.calculateContributionScore(player))
                .build());
    }

    @PostMapping("/{id}/ratings")
    public ResponseEntity<Player> ratePlayer(
        @PathVariable Long id,
        @Valid @RequestBody PlayerRatingRequest request) {
            return ResponseEntity.ok(playerService.ratePlayer(id, request));
        }
        
    @PutMapping("/{id}/ratings")
    public ResponseEntity<Player> updateRatings(
            @PathVariable Long id,
            @Valid @RequestBody PlayerRatingRequest request) {
        return ResponseEntity.ok(playerService.ratePlayer(id, request));
    }    

    @GetMapping("/leaderboard")
    public ResponseEntity<List<PlayerLeaderboardEntry>> getLeaderboard(
        @RequestParam(required = false) Integer seasonYear) {
            return ResponseEntity.ok(playerService.getLeaderboard(seasonYear));
        }

    @GetMapping("/{id}/profile")
    public ResponseEntity<PlayerProfileResponse> getPlayerProfile(@PathVariable Long id) {
        return ResponseEntity.ok(playerService.getPlayerProfile(id));
    }
}