package com.mnfmanager.milestone;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/draft")
@RequiredArgsConstructor
public class MilestoneController {

    private final MilestoneService milestoneService;

    @PostMapping("/milestones")
    public ResponseEntity<List<Fact>> milestones(@Valid @RequestBody MilestoneRequest request) {
        return ResponseEntity.ok(
                milestoneService.factsFor(request.playerIds(), request.captainIds()));
    }
}