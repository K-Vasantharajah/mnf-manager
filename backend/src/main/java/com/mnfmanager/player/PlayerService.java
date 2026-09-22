package com.mnfmanager.player;

import com.mnfmanager.common.exception.ResourceNotFoundException;
import com.mnfmanager.common.security.SecurityUtils;
import com.mnfmanager.match.Match;
import com.mnfmanager.match.MatchPlayer;
import com.mnfmanager.match.MatchRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final MatchRepository matchRepository;

    public List<Player> getAllPlayers() {
        log.debug("Fetching all players including inactive");
        return playerRepository.findAll(Sort.by(Sort.Direction.ASC, "name"));
    }

    public List<Player> getAllActivePlayers() {
        log.debug("Fetching all active players with ratings");
        return playerRepository.findAllActiveWithRatings();
    }

    public Player getPlayerById(Long id) {
        log.debug("Fetching player with id: {}", id);
        return playerRepository.findByIdWithFullDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player", id));
    }

    @Transactional
    public Player createPlayer(Player player) {
        log.info("Creating new player: {}", player.getName());
        return playerRepository.save(player);
    }

    @Transactional
    public Player updatePlayer(Long id, Player updatedPlayer) {
        log.info("Updating player with id: {}", id);
        Player existing = getPlayerById(id);
        existing.setName(updatedPlayer.getName());
        existing.setStrongFoot(updatedPlayer.getStrongFoot());
        existing.setActive(updatedPlayer.getActive());
        existing.setPosition(updatedPlayer.getPosition());
        return playerRepository.save(existing);
    }

    @Transactional
    public void deactivatePlayer(Long id) {
        log.info("Deactivating player with id: {}", id);
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player", id));
        player.setActive(false);
        playerRepository.save(player);
    }

    public double calculatePointsPercentage(Player player) {
        int totalMatches = player.getSeasonStats().stream()
                .mapToInt(s -> s.getMatchesPlayed()).sum();
        if (totalMatches == 0)
            return 0.0;
        int totalWins = player.getSeasonStats().stream()
                .mapToInt(s -> s.getWins()).sum();
        int totalDraws = player.getSeasonStats().stream()
                .mapToInt(s -> s.getDraws()).sum();
        return Math.round(((totalWins * 3.0 + totalDraws) / (totalMatches * 3.0)) * 100.0 * 10.0) / 10.0;
    }

    public List<PlayerLeaderboardEntry> getLeaderboard(Integer seasonYear) {
        List<Player> players = playerRepository.findAllActiveWithRatingsAndStats();
        return players.stream()
                .map(p -> buildLeaderboardEntry(p, seasonYear))
                .filter(e -> seasonYear == null || e.getMatchesPlayed() > 0)
                .sorted((a, b) -> Double.compare(b.getPointsPercentage(), a.getPointsPercentage()))
                .toList();
    }

    private PlayerLeaderboardEntry buildLeaderboardEntry(Player player, Integer seasonYear) {
        PlayerRating rating = SecurityUtils.isAdmin() ? player.getRating() : null;
        var stats = player.getSeasonStats().stream()
                .filter(s -> seasonYear == null || s.getSeasonYear() == seasonYear.shortValue())
                .toList();

        int matchesPlayed = stats.stream().mapToInt(s -> s.getMatchesPlayed()).sum();
        int wins = stats.stream().mapToInt(s -> s.getWins()).sum();
        int draws = stats.stream().mapToInt(s -> s.getDraws()).sum();
        int losses = stats.stream().mapToInt(s -> s.getLosses()).sum();
        int goals = stats.stream().mapToInt(s -> s.getGoals()).sum();
        int assists = stats.stream().mapToInt(s -> s.getAssists()).sum();

        double pointsPercentage = matchesPlayed == 0 ? 0.0
                : Math.round(((wins * 3.0 + draws * 1.0) / (matchesPlayed * 3.0)) * 100.0 * 10.0) / 10.0;
        double goalsPerGame = matchesPlayed == 0 ? 0.0 : Math.round((goals * 1.0 / matchesPlayed) * 10.0) / 10.0;

        return PlayerLeaderboardEntry.builder()
                .playerId(player.getId())
                .name(player.getName())
                .matchesPlayed(matchesPlayed)
                .wins(wins)
                .draws(draws)
                .losses(losses)
                .goals(goals)
                .assists(assists)
                .pointsPercentage(pointsPercentage)
                .goalsPerGame(goalsPerGame)
                .ability(rating != null ? rating.getAbility() : null)
                .reliability(rating != null ? rating.getReliability() : null)
                .goalThreat(rating != null ? rating.getGoalThreat() : null)
                .attackRating(rating != null ? rating.getAttackRating() : null)
                .defenceRating(rating != null ? rating.getDefenceRating() : null)
                .seasonYear(seasonYear)
                .build();
    }

    public PlayerProfileResponse getPlayerProfile(Long id) {
        Player player = playerRepository.findByIdWithFullDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player", id));

        PlayerRating rating = SecurityUtils.isAdmin() ? player.getRating() : null;

        List<PlayerProfileResponse.SeasonStatsDetail> seasonStats = player.getSeasonStats()
                .stream()
                .sorted((a, b) -> Short.compare(b.getSeasonYear(), a.getSeasonYear()))
                .map(s -> {
                    double goalsPerGame = s.getMatchesPlayed() == 0 ? 0.0
                            : Math.round((s.getGoals() * 1.0 / s.getMatchesPlayed()) * 10.0) / 10.0;
                    double pointsPercentage = s.getMatchesPlayed() == 0 ? 0.0
                            : Math.round(
                                    ((s.getWins() * 3.0 + s.getDraws()) / (s.getMatchesPlayed() * 3.0)) * 100.0 * 10.0)
                                    / 10.0;

                    return PlayerProfileResponse.SeasonStatsDetail.builder()
                            .seasonYear(s.getSeasonYear())
                            .matchesPlayed((int) s.getMatchesPlayed())
                            .wins((int) s.getWins())
                            .draws((int) s.getDraws())
                            .losses((int) s.getLosses())
                            .goals((int) s.getGoals())
                            .assists((int) s.getAssists())
                            .pointsPercentage(pointsPercentage)
                            .goalsPerGame(goalsPerGame)
                            .build();
                })
                .toList();

        int totalMatches = seasonStats.stream().mapToInt(PlayerProfileResponse.SeasonStatsDetail::getMatchesPlayed)
                .sum();
        int totalWins = seasonStats.stream().mapToInt(PlayerProfileResponse.SeasonStatsDetail::getWins).sum();
        int totalDraws = seasonStats.stream().mapToInt(PlayerProfileResponse.SeasonStatsDetail::getDraws).sum();
        int totalLosses = seasonStats.stream().mapToInt(PlayerProfileResponse.SeasonStatsDetail::getLosses).sum();
        int totalGoals = seasonStats.stream().mapToInt(PlayerProfileResponse.SeasonStatsDetail::getGoals).sum();
        int totalAssists = seasonStats.stream().mapToInt(PlayerProfileResponse.SeasonStatsDetail::getAssists).sum();

        double careerGoalsPerGame = totalMatches == 0 ? 0.0
                : Math.round((totalGoals * 1.0 / totalMatches) * 10.0) / 10.0;
        double careerPointsPercentage = totalMatches == 0 ? 0.0
                : Math.round(((totalWins * 3.0 + totalDraws) / (totalMatches * 3.0)) * 100.0 * 10.0) / 10.0;

        return PlayerProfileResponse.builder()
                .id(player.getId())
                .name(player.getName())
                .strongFoot(player.getStrongFoot())
                .active(player.getActive())
                .position(player.getPosition())
                .ability(rating != null ? rating.getAbility() : null)
                .reliability(rating != null ? rating.getReliability() : null)
                .goalThreat(rating != null ? rating.getGoalThreat() : null)
                .attackRating(rating != null ? rating.getAttackRating() : null)
                .defenceRating(rating != null ? rating.getDefenceRating() : null)
                .overallRating(rating != null ? rating.getOverallRating() : null)
                .attackDelta(rating != null ? rating.getAttackDelta() : null)
                .defenceDelta(rating != null ? rating.getDefenceDelta() : null)
                .reliabilityDelta(rating != null ? rating.getReliabilityDelta() : null)
                .overallDelta(rating != null ? rating.getOverallDelta() : null)
                .seasonStats(seasonStats)
                .careerStats(PlayerProfileResponse.CareerStats.builder()
                        .totalMatches(totalMatches)
                        .totalWins(totalWins)
                        .totalDraws(totalDraws)
                        .totalLosses(totalLosses)
                        .totalGoals(totalGoals)
                        .totalAssists(totalAssists)
                        .careerPointsPercentage(careerPointsPercentage)
                        .careerGoalsPerGame(careerGoalsPerGame)
                        .build())
                .ratingsVisible(SecurityUtils.isAdmin())
                .build();
    }

    public List<PlayerMatchResponse> getPlayerMatches(Long id, Integer seasonYear) {
        Player player = playerRepository.findByIdWithFullDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player", id));

        List<Match> matches = seasonYear != null
                ? matchRepository.findBySeasonWithDetails((short) seasonYear.shortValue())
                : matchRepository.findAllByOrderByMatchDateDesc();

        return matches.stream()
                .filter(m -> m.getMatchPlayers().stream()
                        .anyMatch(mp -> mp.getPlayer().getId().equals(id)))
                .map(m -> {
                    MatchPlayer mp = m.getMatchPlayers().stream()
                            .filter(p -> p.getPlayer().getId().equals(id))
                            .findFirst().orElseThrow();

                    String result;
                    if (m.getIsDraw()) {
                        result = "DRAW";
                    } else if (m.getWinner() != null) {
                        boolean onWinningTeam = (m.getWinner().getId().equals(m.getCaptainA().getId())
                                && mp.getTeam() == 'A') ||
                                (m.getWinner().getId().equals(m.getCaptainB().getId()) && mp.getTeam() == 'B');
                        result = onWinningTeam ? "WIN" : "LOSS";
                    } else {
                        result = "UNKNOWN";
                    }

                    return PlayerMatchResponse.builder()
                            .id(m.getId())
                            .gameWeek(m.getGameWeek())
                            .seasonYear((int) m.getSeasonYear())
                            .captainAName(m.getCaptainA().getName())
                            .captainBName(m.getCaptainB().getName())
                            .scoreA((int) m.getScoreA())
                            .scoreB((int) m.getScoreB())
                            .result(result)
                            .build();
                })
                .toList();
    }
}
