package com.mnfmanager.imports;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/import")
@RequiredArgsConstructor
@Slf4j
public class ImportController {

    private final ImportService importService;

    @PostMapping("/excel")
    public ResponseEntity<Map<String, Object>> importExcel(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "seasonYear", required = false) Integer seasonYear) {
        log.info("Received Excel import request, file: {}, seasonYear: {}",
                file.getOriginalFilename(), seasonYear);
        ImportResult result = importService.importFromExcel(file, seasonYear);
        return ResponseEntity.ok(Map.of(
                "matchesImported", result.getMatchesImported(),
                "playersNotFound", result.getPlayersNotFound(),
                "errors", result.getErrors(),
                "message", "Import completed"
        ));
    }
}