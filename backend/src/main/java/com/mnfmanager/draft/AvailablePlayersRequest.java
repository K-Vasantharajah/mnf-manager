package com.mnfmanager.draft;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record AvailablePlayersRequest(@NotEmpty List<Long> availablePlayerIds) {
}