package com.mnfmanager.milestone;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record MilestoneRequest(
        @NotEmpty @Size(max = 30) List<Long> playerIds,
        List<Long> captainIds) {
}