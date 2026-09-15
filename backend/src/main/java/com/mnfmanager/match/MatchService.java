package com.mnfmanager.match;

import com.mnfmanager.common.exception.ResourceNotFoundException;
import com.mnfmanager.player.Player;
import com.mnfmanager.player.PlayerRepository;
import com.mnfmanager.player.PlayerSeasonStats;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MatchService {

    private final MatchRepository matchRepository;
    private final PlayerRepository playerRepository;

    @PersistenceContext
    private EntityManager entityManager;

    private static final int CURRENT_YEAR = LocalDate.now().getYear();

    // ─── Public query methods ────────────────────────────────────────────────

    public List<Match> getAllMatches() {
        return matchRepository.findAllByOrderByMatchDateDesc();
    }

    public List<Match> getMatchesBySeason(Short seasonYear) {
        return matchRepository.findBySeasonWithDetails(seasonYear);
    }

    public Match getMatchById(Long id) {
        return matchRepository.findByIdWithFullDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Match", id));
    }

    public MatchDetailResponse getMatchDetail(Long id) {
        Match match = matchRepository.findByIdWithFullDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Match", id));

        Match matchWithGoals = matchRepository.findByIdWithGoalScorers(id)
                .orElseThrow(() -> new ResourceNotFoundException("Match", id));

        List<MatchDetailResponse.GoalScorerDetail> goalScorers = matchWithGoals.getGoalScorers().stream()
                .map(gs -> MatchDetailResponse.GoalScorerDetail.builder()
                        .playerId(gs.getPlayer().getId())
                        .playerName(gs.getPlayer().getName())
                        .goals(gs.getGoals())
                        .team(gs.getTeam())
                        .isOwnGoal(gs.getIsOwnGoal())
                        .build())
                .toList();

        List<MatchDetailResponse.TeamPlayer> teamAPlayers = match.getMatchPlayers().stream()
                .filter(mp -> mp.getTeam() == 'A')
                .map(mp -> MatchDetailResponse.TeamPlayer.builder()
                        .playerId(mp.getPlayer().getId())
                        .playerName(mp.getPlayer().getName())
                        .build())
                .toList();

        List<MatchDetailResponse.TeamPlayer> teamBPlayers = match.getMatchPlayers().stream()
                .filter(mp -> mp.getTeam() == 'B')
                .map(mp -> MatchDetailResponse.TeamPlayer.builder()
                        .playerId(mp.getPlayer().getId())
                        .playerName(mp.getPlayer().getName())
                        .build())
                .toList();

        return MatchDetailResponse.builder()
                .id(match.getId())
                .matchDate(match.getMatchDate())
                .seasonYear(match.getSeasonYear())
                .gameWeek(match.getGameWeek())
                .captainAId(match.getCaptainA().getId())
                .captainAName(match.getCaptainA().getName())
                .captainBId(match.getCaptainB().getId())
                .captainBName(match.getCaptainB().getName())
                .scoreA(match.getScoreA())
                .scoreB(match.getScoreB())
                .winnerId(match.getWinner() != null ? match.getWinner().getId() : null)
                .isDraw(match.getIsDraw())
                .durationMins(match.getDurationMins())
                .teamAPlayers(teamAPlayers)
                .teamBPlayers(teamBPlayers)
                .goalScorers(goalScorers)
                .build();
    }

    // ─── Write methods ───────────────────────────────────────────────────────

    @Transactional
    public Match createMatch(CreateMatchRequest request) {
        log.info("Recording match on {} season {}", request.getMatchDate(), request.getSeasonYear());

        Player captainA = findPlayerById(request.getCaptainAId());
        Player captainB = findPlayerById(request.getCaptainBId());

        boolean isDraw = request.getScoreA().equals(request.getScoreB());
        Player winner = isDraw ? null :
                request.getScoreA() > request.getScoreB() ? captainA : captainB;

        request.setGameWeek(calculateNextGameWeek(request.getSeasonYear()));

        Match match = Match.builder()
                .matchDate(request.getMatchDate())
                .seasonYear(request.getSeasonYear())
                .gameWeek(request.getGameWeek())
                .isExhibition(request.getIsExhibition() != null ? request.getIsExhibition() : false)
                .captainA(captainA)
                .captainB(captainB)
                .scoreA(request.getScoreA())
                .scoreB(request.getScoreB())
                .winner(winner)
                .isDraw(isDraw)
                .durationMins(request.getDurationMins())
                .build();

        addMatchPlayers(match, request.getTeamAPlayerIds(), 'A');
        addMatchPlayers(match, request.getTeamBPlayerIds(), 'B');
        addGoalScorers(match, request.getGoalScorers());

        Match saved = matchRepository.save(match);
        updatePlayerSeasonStats(saved);
        return saved;
    }

    @Transactional
    public Match updateMatch(Long id, CreateMatchRequest request) {
        log.info("Updating match with id: {}", id);

        Match match = matchRepository.findByIdWithFullDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Match", id));

        if (match.getSeasonYear() < CURRENT_YEAR) {
            throw new IllegalStateException("Cannot edit matches from previous seasons");
        }

        Player captainA = findPlayerById(request.getCaptainAId());
        Player captainB = findPlayerById(request.getCaptainBId());

        // Reverse stats FIRST using the OLD match state
        reversePlayerSeasonStats(match);
        entityManager.flush();
        entityManager.clear();

        boolean isDraw = request.getScoreA().equals(request.getScoreB());
        Player winner = isDraw ? null :
                request.getScoreA() > request.getScoreB() ? captainA : captainB;

        // Preserve existing game week if none provided
        if (request.getGameWeek() == null || request.getGameWeek().isBlank()) {
            request.setGameWeek(match.getGameWeek() != null ? match.getGameWeek()
                    : calculateNextGameWeek(request.getSeasonYear()));
        }

        match.setCaptainA(captainA);
        match.setCaptainB(captainB);
        match.setMatchDate(request.getMatchDate());
        match.setSeasonYear(request.getSeasonYear());
        match.setGameWeek(request.getGameWeek());
        match.setScoreA(request.getScoreA());
        match.setScoreB(request.getScoreB());
        match.setWinner(winner);
        match.setIsDraw(isDraw);
        match.setDurationMins(request.getDurationMins());

        match.getMatchPlayers().clear();
        match.getGoalScorers().clear();

        addMatchPlayers(match, request.getTeamAPlayerIds(), 'A');
        addMatchPlayers(match, request.getTeamBPlayerIds(), 'B');
        addGoalScorers(match, request.getGoalScorers());

        Match saved = matchRepository.save(match);
        updatePlayerSeasonStats(saved);
        return saved;
    }

    // ─── Dashboard and captain stats ────────────────────────────────────────

    public List<CaptainStatsResponse> getCaptainStats(Integer seasonYear) {
        List<Match> matches = seasonYear != null
                ? matchRepository.findBySeasonWithDetails((short) seasonYear.shortValue())
                : matchRepository.findAllByOrderByMatchDateDesc();

        Map<Long, List<Match>> matchesByCaptain = new HashMap<>();
        matches.forEach(m -> {
            matchesByCaptain.computeIfAbsent(m.getCaptainA().getId(), k -> new ArrayList<>()).add(m);
            matchesByCaptain.computeIfAbsent(m.getCaptainB().getId(), k -> new ArrayList<>()).add(m);
        });

        return matchesByCaptain.entrySet().stream()
                .map(entry -> buildCaptainStats(entry.getKey(), entry.getValue(), seasonYear))
                .sorted((a, b) -> Double.compare(b.getWinRate(), a.getWinRate()))
                .toList();
    }

    public Map<String, Object> getCaptainDashboardStats() {
        List<Match> allMatches = matchRepository.findAllByOrderByMatchDateDesc();
        List<Match> allMatchesSorted = allMatches.stream()
                .sorted((a, b) -> Long.compare(a.getId(), b.getId()))
                .toList();

        String currentWinningCaptain = resolveCurrentWinningCaptain(allMatches);

        Set<Long> captainIds = new HashSet<>();
        allMatchesSorted.forEach(m -> {
            captainIds.add(m.getCaptainA().getId());
            captainIds.add(m.getCaptainB().getId());
        });

        String longestAllTimeStreakCaptain = "";
        int longestAllTimeStreak = 0;
        String longestCurrentSeasonStreakCaptain = "";
        int longestCurrentSeasonStreak = 0;
        String currentStreakCaptain = "";
        int currentStreak = 0;

        for (Long captainId : captainIds) {
            String captainName = resolveCaptainName(allMatchesSorted, captainId);

            List<Match> captainedMatches = allMatchesSorted.stream()
                    .filter(m -> m.getCaptainA().getId().equals(captainId)
                            || m.getCaptainB().getId().equals(captainId))
                    .toList();

            List<Match> captainedCurrentSeason = captainedMatches.stream()
                    .filter(m -> m.getSeasonYear() == CURRENT_YEAR)
                    .toList();

            int allTimeMax = calculateLongestStreak(captainedMatches, captainId);
            if (allTimeMax > longestAllTimeStreak) {
                longestAllTimeStreak = allTimeMax;
                longestAllTimeStreakCaptain = captainName;
            }

            int currentSeasonMax = calculateLongestStreak(captainedCurrentSeason, captainId);
            if (currentSeasonMax > longestCurrentSeasonStreak) {
                longestCurrentSeasonStreak = currentSeasonMax;
                longestCurrentSeasonStreakCaptain = captainName;
            }

            int curStreak = calculateCurrentStreak(captainedCurrentSeason, captainId);
            if (curStreak > currentStreak) {
                currentStreak = curStreak;
                currentStreakCaptain = captainName;
            }
        }

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("currentWinningCaptain", currentWinningCaptain);
        stats.put("currentStreakCaptain", currentStreakCaptain);
        stats.put("currentStreak", currentStreak);
        stats.put("longestCurrentSeasonStreakCaptain", longestCurrentSeasonStreakCaptain);
        stats.put("longestCurrentSeasonStreak", longestCurrentSeasonStreak);
        stats.put("longestAllTimeStreakCaptain", longestAllTimeStreakCaptain);
        stats.put("longestAllTimeStreak", longestAllTimeStreak);
        return stats;
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private Player findPlayerById(Long id) {
        return playerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player", id));
    }

    private String calculateNextGameWeek(Short seasonYear) {
        List<String> gameWeeks = matchRepository.findLastGameWeekForSeason(seasonYear);
        String lastGameWeek = gameWeeks.isEmpty() ? null : gameWeeks.get(0);
        if (lastGameWeek != null && lastGameWeek.startsWith("GW")) {
            try {
                int lastGW = Integer.parseInt(lastGameWeek.substring(2));
                return "GW" + (lastGW + 1);
            } catch (NumberFormatException e) {
                log.warn("Could not parse game week: {}", lastGameWeek);
            }
        }
        return "GW1";
    }

    private void addMatchPlayers(Match match, List<Long> playerIds, char team) {
        if (playerIds == null) return;
        playerIds.forEach(playerId -> {
            Player player = findPlayerById(playerId);
            MatchPlayer mp = new MatchPlayer();
            mp.setId(new MatchPlayerId(match.getId(), playerId));
            mp.setMatch(match);
            mp.setPlayer(player);
            mp.setTeam(team);
            match.getMatchPlayers().add(mp);
        });
    }

    private void addGoalScorers(Match match, List<CreateMatchRequest.GoalScorerRequest> goalScorerRequests) {
        if (goalScorerRequests == null) return;
        for (CreateMatchRequest.GoalScorerRequest gs : goalScorerRequests) {
            Player scorer = findPlayerById(gs.getPlayerId());
            GoalScorer goalScorer = new GoalScorer();
            goalScorer.setMatch(match);
            goalScorer.setPlayer(scorer);
            goalScorer.setGoals(gs.getGoals());
            goalScorer.setTeam(gs.getTeam());
            goalScorer.setIsOwnGoal(gs.getIsOwnGoal() != null ? gs.getIsOwnGoal() : false);
            match.getGoalScorers().add(goalScorer);
        }
    }

    private String resolveCurrentWinningCaptain(List<Match> allMatches) {
        Match mostRecentMatch = allMatches.stream().findFirst().orElse(null);
        if (mostRecentMatch == null) return "None";
        if (mostRecentMatch.getIsDraw()) {
            return mostRecentMatch.getCaptainA().getName()
                    + " vs " + mostRecentMatch.getCaptainB().getName() + " (Draw - replay)";
        }
        return mostRecentMatch.getWinner().getName();
    }

    private String resolveCaptainName(List<Match> matches, Long captainId) {
        return matches.stream()
                .filter(m -> m.getCaptainA().getId().equals(captainId)
                        || m.getCaptainB().getId().equals(captainId))
                .findFirst()
                .map(m -> m.getCaptainA().getId().equals(captainId)
                        ? m.getCaptainA().getName()
                        : m.getCaptainB().getName())
                .orElse("Unknown");
    }

    private CaptainStatsResponse buildCaptainStats(Long captainId, List<Match> captainMatches, Integer seasonYear) {
        String captainName = resolveCaptainName(captainMatches, captainId);

        int wins = (int) captainMatches.stream()
                .filter(m -> m.getWinner() != null && m.getWinner().getId().equals(captainId))
                .count();
        int draws = (int) captainMatches.stream()
                .filter(Match::getIsDraw)
                .count();
        int losses = captainMatches.size() - wins - draws;

        double winRate = captainMatches.isEmpty() ? 0.0 :
                Math.round((wins * 100.0 / captainMatches.size()) * 10.0) / 10.0;

        double pointsPercentage = captainMatches.isEmpty() ? 0.0 :
                Math.round(((wins * 3.0 + draws) / (captainMatches.size() * 3.0)) * 100.0 * 10.0) / 10.0;

        Map<String, Long> playerCounts = new HashMap<>();
        captainMatches.forEach(m -> {
            boolean isCaptainA = m.getCaptainA().getId().equals(captainId);
            m.getMatchPlayers().stream()
                    .filter(mp -> isCaptainA ? mp.getTeam() == 'A' : mp.getTeam() == 'B')
                    .filter(mp -> !mp.getPlayer().getId().equals(captainId))
                    .forEach(mp -> playerCounts.merge(mp.getPlayer().getName(), 1L, Long::sum));
        });

        List<String> mostPicked = playerCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(Map.Entry::getKey)
                .toList();

        List<CaptainStatsResponse.CaptainMatchResult> matchHistory = captainMatches.stream()
                .sorted((a, b) -> Long.compare(b.getId(), a.getId()))
                .map(m -> {
                    boolean isCaptainA = m.getCaptainA().getId().equals(captainId);
                    String opponent = isCaptainA ? m.getCaptainB().getName() : m.getCaptainA().getName();
                    int scoreFor = isCaptainA ? m.getScoreA() : m.getScoreB();
                    int scoreAgainst = isCaptainA ? m.getScoreB() : m.getScoreA();
                    String result = m.getIsDraw() ? "DRAW" :
                            m.getWinner() != null && m.getWinner().getId().equals(captainId) ? "WIN" : "LOSS";
                    return CaptainStatsResponse.CaptainMatchResult.builder()
                            .matchId(m.getId())
                            .gameWeek(m.getGameWeek())
                            .seasonYear((int) m.getSeasonYear())
                            .opponentName(opponent)
                            .scoreFor(scoreFor)
                            .scoreAgainst(scoreAgainst)
                            .result(result)
                            .build();
                })
                .toList();

        return CaptainStatsResponse.builder()
                .playerId(captainId)
                .name(captainName)
                .matchesCaptained(captainMatches.size())
                .wins(wins)
                .draws(draws)
                .losses(losses)
                .winRate(winRate)
                .pointsPercentage(pointsPercentage)
                .mostPickedPlayers(mostPicked)
                .seasonYear(seasonYear)
                .matchHistory(matchHistory)
                .build();
    }

    private void reversePlayerSeasonStats(Match match) {
        log.info("Reversing season stats for match id: {}", match.getId());

        match.getMatchPlayers().forEach(mp -> {
            Player player = playerRepository.findByIdWithFullDetails(mp.getPlayer().getId())
                    .orElse(null);
            if (player == null) return;

            Short seasonYear = match.getSeasonYear();
            player.getSeasonStats().stream()
                    .filter(s -> s.getSeasonYear().equals(seasonYear))
                    .findFirst()
                    .ifPresent(stats -> {
                        stats.setMatchesPlayed((short) Math.max(0, stats.getMatchesPlayed() - 1));
                        if (match.getIsDraw()) {
                            stats.setDraws((short) Math.max(0, stats.getDraws() - 1));
                        } else if (match.getWinner() != null) {
                            boolean wasOnWinningTeam =
                                    (match.getWinner().getId().equals(match.getCaptainA().getId()) && mp.getTeam() == 'A') ||
                                    (match.getWinner().getId().equals(match.getCaptainB().getId()) && mp.getTeam() == 'B');
                            if (wasOnWinningTeam) {
                                stats.setWins((short) Math.max(0, stats.getWins() - 1));
                            } else {
                                stats.setLosses((short) Math.max(0, stats.getLosses() - 1));
                            }
                        }
                    });
            playerRepository.saveAndFlush(player);
        });

        match.getGoalScorers().forEach(gs -> {
            Player scorer = playerRepository.findByIdWithFullDetails(gs.getPlayer().getId())
                    .orElse(null);
            if (scorer == null) return;

            scorer.getSeasonStats().stream()
                    .filter(s -> s.getSeasonYear().equals(match.getSeasonYear()))
                    .findFirst()
                    .ifPresent(stats ->
                            stats.setGoals((short) Math.max(0, stats.getGoals() - gs.getGoals()))
                    );
            playerRepository.saveAndFlush(scorer);
        });
    }

    private void updatePlayerSeasonStats(Match match) {
        if (Boolean.TRUE.equals(match.getIsExhibition())) {
            log.info("Skipping season stats update for exhibition match id: {}", match.getId());
            return;
        }
        log.info("Updating season stats for match id: {}", match.getId());

        match.getMatchPlayers().forEach(mp -> {
            Player player = mp.getPlayer();
            Short seasonYear = match.getSeasonYear();

            PlayerSeasonStats stats = player.getSeasonStats().stream()
                    .filter(s -> s.getSeasonYear().equals(seasonYear))
                    .findFirst()
                    .orElseGet(() -> {
                        PlayerSeasonStats newStats = PlayerSeasonStats.builder()
                                .player(player)
                                .seasonYear(seasonYear)
                                .goals((short) 0)
                                .assists((short) 0)
                                .matchesPlayed((short) 0)
                                .wins((short) 0)
                                .draws((short) 0)
                                .losses((short) 0)
                                .build();
                        player.getSeasonStats().add(newStats);
                        return newStats;
                    });

            stats.setMatchesPlayed((short) (stats.getMatchesPlayed() + 1));

            if (match.getIsDraw()) {
                stats.setDraws((short) (stats.getDraws() + 1));
            } else if (match.getWinner() != null) {
                boolean playerOnWinningTeam =
                        (match.getWinner().equals(match.getCaptainA()) && mp.getTeam() == 'A') ||
                        (match.getWinner().equals(match.getCaptainB()) && mp.getTeam() == 'B');
                if (playerOnWinningTeam) {
                    stats.setWins((short) (stats.getWins() + 1));
                } else {
                    stats.setLosses((short) (stats.getLosses() + 1));
                }
            }
        });

        match.getGoalScorers().forEach(gs -> {
            if (Boolean.TRUE.equals(gs.getIsOwnGoal())) return;
            Player scorer = gs.getPlayer();
            Short seasonYear = match.getSeasonYear();

            scorer.getSeasonStats().stream()
                    .filter(s -> s.getSeasonYear().equals(seasonYear))
                    .findFirst()
                    .ifPresent(stats ->
                            stats.setGoals((short) (stats.getGoals() + gs.getGoals()))
                    );
        });

        playerRepository.saveAll(
                match.getMatchPlayers().stream()
                        .map(MatchPlayer::getPlayer)
                        .distinct()
                        .toList()
        );
    }

    private int calculateLongestStreak(List<Match> matches, Long captainId) {
        int streak = 0;
        int maxStreak = 0;
        for (Match m : matches) {
            boolean won = m.getWinner() != null && m.getWinner().getId().equals(captainId);
            boolean drew = m.getIsDraw();
            if (won || drew) {
                streak++;
                maxStreak = Math.max(maxStreak, streak);
            } else {
                streak = 0;
            }
        }
        return maxStreak;
    }

    private int calculateCurrentStreak(List<Match> matches, Long captainId) {
        int streak = 0;
        for (int i = matches.size() - 1; i >= 0; i--) {
            Match m = matches.get(i);
            boolean won = m.getWinner() != null && m.getWinner().getId().equals(captainId);
            boolean drew = m.getIsDraw();
            if (won || drew) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }
}