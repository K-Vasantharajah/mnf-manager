package com.mnfmanager.imports;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class ImportResult {
    private int matchesImported;
    private List<String> playersNotFound;
    private List<String> errors;
}