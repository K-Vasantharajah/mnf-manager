package com.mnfmanager.draft;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/draft")
@RequiredArgsConstructor
public class DraftController {

    private final DraftService draftService;

    @PostMapping("/preferences/{captainId}")
    public ResponseEntity<Map<String, Object>> getCaptainPreferences(
            @PathVariable Long captainId,
            @Valid @RequestBody AvailablePlayersRequest body) {
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "captainId", captainId,
                "preferences", draftService.captainPreferences(captainId, body.availablePlayerIds())));
    }

    @PostMapping("/captain-recommendations")
    public ResponseEntity<Map<String, Object>> getCaptainRecommendations(
            @Valid @RequestBody AvailablePlayersRequest body) {
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "recommendations", draftService.captainRecommendations(body.availablePlayerIds())));
    }
}