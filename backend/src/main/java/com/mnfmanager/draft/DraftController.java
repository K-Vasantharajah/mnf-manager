package com.mnfmanager.draft;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/draft")
@RequiredArgsConstructor
@Slf4j
public class DraftController {

    private final RestTemplate restTemplate;
    private static final String ML_SERVICE_URL = "http://localhost:5000";

    @PostMapping("/preferences/{captainId}")
    public ResponseEntity<Map> getCaptainPreferences(
            @PathVariable Long captainId,
            @RequestBody Map<String, List<Long>> body) {
        log.info("Getting draft preferences for captain: {}", captainId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, List<Long>>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                ML_SERVICE_URL + "/api/draft/preferences/" + captainId,
                request,
                Map.class
        );
        return ResponseEntity.ok(response.getBody());
    }

    @PostMapping("/predict")
    public ResponseEntity<Map> predictMatch(
            @RequestBody Map<String, List<Long>> body) {
        log.info("Predicting match outcome");
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, List<Long>>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                ML_SERVICE_URL + "/api/draft/predict",
                request,
                Map.class
        );
        return ResponseEntity.ok(response.getBody());
    }

    @PostMapping("/captain-recommendations")
    public ResponseEntity<Map> getCaptainRecommendations(
            @RequestBody Map<String, List<Long>> body) {
        log.info("Getting captain recommendations");
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, List<Long>>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                ML_SERVICE_URL + "/api/draft/captain-recommendations",
                request,
                Map.class
        );
        return ResponseEntity.ok(response.getBody());
    }
}