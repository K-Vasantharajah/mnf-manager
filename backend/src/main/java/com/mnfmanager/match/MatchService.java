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

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MatchService {

    private final MatchRepository matchRepository;
    private final PlayerRepository playerRepository;

    @PersistenceContext
    private EntityManager entityManager;

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

    @Transactional
    public Match createMatch(CreateMatchRequest request) {
        log.info("Recording match on {} season {}", request.getMatchDate(), request.getSeasonYear());

        Player captainA = playerRepository.findById(request.getCaptainAId())
                .orElseThrow(() -> new ResourceNotFoundException("Player", request.getCaptainAId()));
        Player captainB = playerRepository.findById(request.getCaptainBId())
                .orElseThrow(() -> new ResourceNotFoundException("Player", request.getCaptainBId()));

        boolean isDraw = request.getScoreA().equals(request.getScoreB());
        Player winner = isDraw ? null :
                request.getScoreA() > request.getScoreB() ? captainA : captainB;

        // Auto-calculate game week if not provided
        List<String> gameWeeks = matchRepository.findLastGameWeekForSeason(request.getSeasonYear());
        String lastGameWeek = gameWeeks.isEmpty() ? null : gameWeeks.get(0);
        if (lastGameWeek != null && lastGameWeek.startsWith("GW")) {
            try {
                int lastGW = Integer.parseInt(lastGameWeek.substring(2));
                request.setGameWeek("GW" + (lastGW + 1));
            } catch (NumberFormatException e) {
                log.warn("Could not parse game week: {}", lastGameWeek);
            }
        } else {
            request.setGameWeek("GW1");
        }

        Match match = Match.builder()
                .matchDate(request.getMatchDate())
                .seasonYear(request.getSeasonYear())
                .gameWeek(request.getGameWeek())
                .captainA(captainA)
                .captainB(captainB)
                .scoreA(request.getScoreA())
                .scoreB(request.getScoreB())
                .winner(winner)
                .isDraw(isDraw)
                .durationMins(request.getDurationMins())
                .build();

        if (request.getTeamAPlayerIds() != null) {
            request.getTeamAPlayerIds().forEach(playerId -> {
                Player player = playerRepository.findById(playerId)
                        .orElseThrow(() -> new ResourceNotFoundException("Player", playerId));
                match.getMatchPlayers().add(MatchPlayer.builder()
                        .id(new MatchPlayerId(null, playerId))
                        .match(match)
                        .player(player)
                        .team('A')
                        .build());
            });
        }

        if (request.getTeamBPlayerIds() != null) {
            request.getTeamBPlayerIds().forEach(playerId -> {
                Player player = playerRepository.findById(playerId)
                        .orElseThrow(() -> new ResourceNotFoundException("Player", playerId));
                match.getMatchPlayers().add(MatchPlayer.builder()
                        .id(new MatchPlayerId(null, playerId))
                        .match(match)
                        .player(player)
                        .team('B')
                        .build());
            });
        }

        if (request.getGoalScorers() != null) {
            for (CreateMatchRequest.GoalScorerRequest gs : request.getGoalScorers()) {
                Player scorer = playerRepository.findById(gs.getPlayerId())
                .orElseThrow(() -> new ResourceNotFoundException("Player", gs.getPlayerId()));
                GoalScorer goalScorer = new GoalScorer();
                goalScorer.setMatch(match);
                goalScorer.setPlayer(scorer);
                goalScorer.setGoals(gs.getGoals());
                goalScorer.setTeam(gs.getTeam());
                match.getGoalScorers().add(goalScorer);
            }
        }

        Match saved = matchRepository.save(match);
        updatePlayerSeasonStats(saved);
        return saved;
    }

    @Transactional
    public Match updateMatch(Long id, CreateMatchRequest request) {
        log.info("Updating match with id: {}", id);

        Match match = matchRepository.findByIdWithFullDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Match", id));

        Player captainA = playerRepository.findById(request.getCaptainAId())
                .orElseThrow(() -> new ResourceNotFoundException("Player", request.getCaptainAId()));
        Player captainB = playerRepository.findById(request.getCaptainBId())
                .orElseThrow(() -> new ResourceNotFoundException("Player", request.getCaptainBId()));

        // Reverse stats FIRST using the OLD match state
        reversePlayerSeasonStats(match);
        entityManager.flush();
        entityManager.clear();

        // NOW mutate the match with new data
        boolean isDraw = request.getScoreA().equals(request.getScoreB());
        Player winner = isDraw ? null :
                request.getScoreA() > request.getScoreB() ? captainA : captainB;

        // Only auto-calculate if no game week provided AND match doesn't already have one
        if ((request.getGameWeek() == null || request.getGameWeek().isBlank()) 
                && (match.getGameWeek() == null || match.getGameWeek().isBlank())) {
            List<String> gameWeeksUpdate = matchRepository.findLastGameWeekForSeason(request.getSeasonYear());
            String lastGameWeek = gameWeeksUpdate.isEmpty() ? null : gameWeeksUpdate.get(0);
            if (lastGameWeek != null && lastGameWeek.startsWith("GW")) {
                try {
                    int lastGW = Integer.parseInt(lastGameWeek.substring(2));
                    request.setGameWeek("GW" + (lastGW + 1));
                } catch (NumberFormatException e) {
                    log.warn("Could not parse game week: {}", lastGameWeek);
                }
            } else {
                request.setGameWeek("GW1");
            }
        } else if (request.getGameWeek() == null || request.getGameWeek().isBlank()) {
            // Keep existing game week if no new one provided
            request.setGameWeek(match.getGameWeek());
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

        if (request.getTeamAPlayerIds() != null) {
            request.getTeamAPlayerIds().forEach(playerId -> {
                Player player = playerRepository.findById(playerId)
                        .orElseThrow(() -> new ResourceNotFoundException("Player", playerId));
                MatchPlayer mp = new MatchPlayer();
                mp.setId(new MatchPlayerId(match.getId(), playerId));
                mp.setMatch(match);
                mp.setPlayer(player);
                mp.setTeam('A');
                match.getMatchPlayers().add(mp);
            });
        }

        if (request.getTeamBPlayerIds() != null) {
            request.getTeamBPlayerIds().forEach(playerId -> {
                Player player = playerRepository.findById(playerId)
                        .orElseThrow(() -> new ResourceNotFoundException("Player", playerId));
                MatchPlayer mp = new MatchPlayer();
                mp.setId(new MatchPlayerId(match.getId(), playerId));
                mp.setMatch(match);
                mp.setPlayer(player);
                mp.setTeam('B');
                match.getMatchPlayers().add(mp);
            });
        }

        if (request.getGoalScorers() != null) {
            for (CreateMatchRequest.GoalScorerRequest gs : request.getGoalScorers()) {
                Player scorer = playerRepository.findById(gs.getPlayerId())
                        .orElseThrow(() -> new ResourceNotFoundException("Player", gs.getPlayerId()));
                GoalScorer goalScorer = new GoalScorer();
                goalScorer.setMatch(match);
                goalScorer.setPlayer(scorer);
                goalScorer.setGoals(gs.getGoals());
                goalScorer.setTeam(gs.getTeam());
                match.getGoalScorers().add(goalScorer);
            }
        }

        Match saved = matchRepository.save(match);
        updatePlayerSeasonStats(saved);
        return saved;
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

    public MatchDetailResponse getMatchDetail(Long id) {
        Match match = matchRepository.findByIdWithFullDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Match", id));
        
        Match matchWithGoals = matchRepository.findByIdWithGoalScorers(id)
                .orElseThrow(() -> new ResourceNotFoundException("Match", id));

        List<Long> teamAPlayerIds = match.getMatchPlayers().stream()
                .filter(mp -> mp.getTeam() == 'A')
                .map(mp -> mp.getPlayer().getId())
                .toList();

        List<Long> teamBPlayerIds = match.getMatchPlayers().stream()
                .filter(mp -> mp.getTeam() == 'B')
                .map(mp -> mp.getPlayer().getId())
                .toList();

        List<MatchDetailResponse.GoalScorerDetail> goalScorers = matchWithGoals.getGoalScorers().stream()
                .map(gs -> MatchDetailResponse.GoalScorerDetail.builder()
                        .playerId(gs.getPlayer().getId())
                        .playerName(gs.getPlayer().getName())
                        .goals(gs.getGoals())
                        .team(gs.getTeam())
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
                .teamAPlayerIds(teamAPlayerIds)
                .teamBPlayerIds(teamBPlayerIds)
                .goalScorers(goalScorers)
                .build();
    }

    private void updatePlayerSeasonStats(Match match) {
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

    public List<CaptainStatsResponse> getCaptainStats(Integer seasonYear) {
        List<Match> matches = seasonYear != null
                ? matchRepository.findBySeasonWithDetails((short) seasonYear.shortValue())
                : matchRepository.findAllByOrderByMatchDateDesc();

        Map<Long, List<Match>> matchesByCaptain = new java.util.HashMap<>();

        matches.forEach(m -> {
            matchesByCaptain.computeIfAbsent(m.getCaptainA().getId(), k -> new java.util.ArrayList<>()).add(m);
            matchesByCaptain.computeIfAbsent(m.getCaptainB().getId(), k -> new java.util.ArrayList<>()).add(m);
        });

        return matchesByCaptain.entrySet().stream()
                .map(entry -> {
                    Long captainId = entry.getKey();
                    List<Match> captainMatches = entry.getValue();

                    Match firstMatch = captainMatches.get(0);
                    String captainName = firstMatch.getCaptainA().getId().equals(captainId)
                            ? firstMatch.getCaptainA().getName()
                            : firstMatch.getCaptainB().getName();

                    int wins = (int) captainMatches.stream()
                            .filter(m -> m.getWinner() != null && m.getWinner().getId().equals(captainId))
                            .count();
                    int draws = (int) captainMatches.stream()
                            .filter(Match::getIsDraw)
                            .count();
                    int losses = captainMatches.size() - wins - draws;

                    double winRate = captainMatches.isEmpty() ? 0.0 :
                            Math.round((wins * 100.0 / captainMatches.size()) * 10.0) / 10.0;

                    Map<String, Long> playerCounts = new java.util.HashMap<>();
                    captainMatches.forEach(m -> {
                        boolean isCaptainA = m.getCaptainA().getId().equals(captainId);
                        m.getMatchPlayers().stream()
                                .filter(mp -> isCaptainA ? mp.getTeam() == 'A' : mp.getTeam() == 'B')
                                .forEach(mp -> playerCounts.merge(mp.getPlayer().getName(), 1L, Long::sum));
                    });

                    List<String> mostPicked = playerCounts.entrySet().stream()
                            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                            .limit(5)
                            .map(Map.Entry::getKey)
                            .toList();

                    return CaptainStatsResponse.builder()
                            .playerId(captainId)
                            .name(captainName)
                            .matchesCaptained(captainMatches.size())
                            .wins(wins)
                            .draws(draws)
                            .losses(losses)
                            .winRate(winRate)
                            .mostPickedPlayers(mostPicked)
                            .seasonYear(seasonYear)
                            .build();
                })
                .sorted((a, b) -> Double.compare(b.getWinRate(), a.getWinRate()))
                .toList();
    }
}