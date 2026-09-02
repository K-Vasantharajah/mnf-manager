package com.mnfmanager.imports;

import com.mnfmanager.match.CreateMatchRequest;
import com.mnfmanager.match.MatchService;
import com.mnfmanager.player.Player;
import com.mnfmanager.player.PlayerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImportService {

    private final PlayerRepository playerRepository;
    private final MatchService matchService;

    public ImportResult importFromExcel(MultipartFile file, Integer seasonYearFilter) {
        List<String> playersNotFound = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int matchesImported = 0;

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet matchSheet = workbook.getSheet("Match Results");
            Sheet perfSheet = workbook.getSheet("Player Performance");

            if (matchSheet == null || perfSheet == null) {
                errors.add("Could not find required sheets: 'Match Results' and 'Player Performance'");
                return ImportResult.builder()
                        .matchesImported(0)
                        .playersNotFound(playersNotFound)
                        .errors(errors)
                        .build();
            }

            // Build player lookup map from database
            Map<String, Long> playerIdMap = buildPlayerIdMap();

            // Build performance data map keyed by match sequence
            Map<Integer, List<PlayerPerformance>> perfByMatch = buildPerfMap(perfSheet);

            // Process each match row
            Iterator<Row> matchRows = matchSheet.iterator();
            matchRows.next(); // skip header

            while (matchRows.hasNext()) {
                Row row = matchRows.next();
                try {
                    int matchSeq = (int) row.getCell(0).getNumericCellValue();
                    int seasonNum = (int) row.getCell(1).getNumericCellValue();
                    String gameWeek = getCellString(row.getCell(2));
                    String captainAName = getCellString(row.getCell(7));
                    int scoreA = (int) row.getCell(8).getNumericCellValue();
                    int scoreB = (int) row.getCell(9).getNumericCellValue();
                    String captainBName = getCellString(row.getCell(10));
                    String winnerCaptain = getCellString(row.getCell(14));

                    // Filter by season if specified
                    if (seasonYearFilter != null) {
                        int seasonYear = seasonNum == 1 ? 2025 : 2026;
                        if (seasonYear != seasonYearFilter) continue;
                    }

                    int seasonYear = seasonNum == 1 ? 2025 : 2026;

                    // Resolve captain ids
                    String mappedCaptainA = mapName(captainAName);
                    String mappedCaptainB = mapName(captainBName);

                    Long captainAId = playerIdMap.get(mappedCaptainA);
                    Long captainBId = playerIdMap.get(mappedCaptainB);

                    if (captainAId == null) {
                        playersNotFound.add("Captain not found: " + captainAName + " (match " + matchSeq + ")");
                        continue;
                    }
                    if (captainBId == null) {
                        playersNotFound.add("Captain not found: " + captainBName + " (match " + matchSeq + ")");
                        continue;
                    }

                    // Get players for this match
                    List<PlayerPerformance> matchPerf = perfByMatch.getOrDefault(matchSeq, List.of());

                    List<Long> teamAIds = new ArrayList<>();
                    List<Long> teamBIds = new ArrayList<>();
                    List<CreateMatchRequest.GoalScorerRequest> goalScorers = new ArrayList<>();

                    for (PlayerPerformance perf : matchPerf) {
                        String mappedName = mapName(perf.playerName);
                        Long playerId = playerIdMap.get(mappedName);

                        if (playerId == null) {
                            if (!playersNotFound.contains("Player not found: " + perf.playerName)) {
                                playersNotFound.add("Player not found: " + perf.playerName);
                            }
                            continue;
                        }

                        if ("A".equals(perf.team)) {
                            teamAIds.add(playerId);
                        } else {
                            teamBIds.add(playerId);
                        }

                        if (perf.goals > 0) {
                            CreateMatchRequest.GoalScorerRequest gs = new CreateMatchRequest.GoalScorerRequest();
                            gs.setPlayerId(playerId);
                            gs.setGoals((short) perf.goals);
                            gs.setTeam(perf.team.charAt(0));
                            goalScorers.add(gs);
                        }
                    }

                    // Build and save match
                    CreateMatchRequest request = new CreateMatchRequest();
                    request.setMatchDate(LocalDate.of(seasonYear, 1, 1)); // placeholder date
                    request.setSeasonYear((short) seasonYear);
                    request.setGameWeek(gameWeek);
                    request.setCaptainAId(captainAId);
                    request.setCaptainBId(captainBId);
                    request.setScoreA((short) scoreA);
                    request.setScoreB((short) scoreB);
                    request.setTeamAPlayerIds(teamAIds);
                    request.setTeamBPlayerIds(teamBIds);
                    request.setGoalScorers(goalScorers);

                    matchService.createMatch(request);
                    matchesImported++;
                    log.info("Imported match {} - {} vs {} ({}-{})",
                            gameWeek, captainAName, captainBName, scoreA, scoreB);

                } catch (Exception e) {
                    errors.add("Error processing row: " + e.getMessage());
                    log.error("Error processing match row", e);
                }
            }

        } catch (IOException e) {
            errors.add("Failed to read Excel file: " + e.getMessage());
        }

        return ImportResult.builder()
                .matchesImported(matchesImported)
                .playersNotFound(playersNotFound)
                .errors(errors)
                .build();
    }

    private Map<String, Long> buildPlayerIdMap() {
        Map<String, Long> map = new HashMap<>();
        List<Player> allPlayers = playerRepository.findAll();
        for (Player player : allPlayers) {
            map.put(player.getName(), player.getId());
        }
        return map;
    }

    private Map<Integer, List<PlayerPerformance>> buildPerfMap(Sheet perfSheet) {
        Map<Integer, List<PlayerPerformance>> map = new HashMap<>();
        Iterator<Row> rows = perfSheet.iterator();
        rows.next(); // skip header

        while (rows.hasNext()) {
            Row row = rows.next();
            try {
                int matchSeq = (int) row.getCell(2).getNumericCellValue();
                String playerName = getCellString(row.getCell(1));
                String teamAB = getCellString(row.getCell(7));
                int goals = (int) row.getCell(8).getNumericCellValue();

                PlayerPerformance perf = new PlayerPerformance(playerName, teamAB, goals);
                map.computeIfAbsent(matchSeq, k -> new ArrayList<>()).add(perf);
            } catch (Exception e) {
                log.warn("Skipping performance row: {}", e.getMessage());
            }
        }
        return map;
    }

    private String mapName(String name) {
        return NAME_MAPPING.getOrDefault(name, name);
    }

    private String getCellString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((int) cell.getNumericCellValue());
            default -> "";
        };
    }

    record PlayerPerformance(String playerName, String team, int goals) {}
}