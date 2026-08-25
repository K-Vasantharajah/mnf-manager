package com.mnfmanager.player;

import com.mnfmanager.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PlayerService {

    private final PlayerRepository playerRepository;

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
        existing.setNotes(updatedPlayer.getNotes());
        existing.setActive(updatedPlayer.getActive());
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

    @Transactional
    public Player ratePlayer(Long id, PlayerRatingRequest request) {

        log.info("Rating player with id: {}", id);
        Player player = getPlayerById(id);

        PlayerRating rating = player.getRating();
        if (rating == null) {
            rating = PlayerRating.builder()
                    .player(player)
                    .build();
        }

        rating.setAbility(request.getAbility());
        rating.setReliability(request.getReliability());
        rating.setGoalThreat(request.getGoalThreat());
        rating.setRatedBy(request.getRatedBy());

        player.setRating(rating);
        return playerRepository.save(player);
    }

    public double calculateWinRate(Player player) {
        int totalPlayed = player.getSeasonStats().stream()
                .mapToInt(s -> s.getMatchesPlayed())
                .sum();
        if (totalPlayed == 0) return 0.0;
        int totalWins = player.getSeasonStats().stream()
                .mapToInt(s -> s.getWins())
                .sum();
        return Math.round((totalWins * 100.0 / totalPlayed) * 10.0) / 10.0;
    }

    public double calculateContributionScore(Player player) {
        if (player.getRating() == null) return 0.0;
        int totalGoals = player.getSeasonStats().stream()
                .mapToInt(s -> s.getGoals()).sum();
        int totalAssists = player.getSeasonStats().stream()
                .mapToInt(s -> s.getAssists()).sum();
        int totalWins = player.getSeasonStats().stream()
                .mapToInt(s -> s.getWins()).sum();
        double reliability = player.getRating().getReliability();
        double ability = player.getRating().getAbility();
        double goalThreat = player.getRating().getGoalThreat();
        return Math.round(
                (totalGoals * 1.5 + totalAssists + totalWins * 0.5
                        + reliability * 2.5 + ability + goalThreat) / 4.0 * 10.0
        ) / 10.0;
    }

    public List<PlayerLeaderboardEntry> getLeaderboard(Integer seasonYear) {
        List<Player> players = playerRepository.findAllActiveWithRatingsAndStats();
        return players.stream()
            .map(p -> buildLeaderboardEntry(p, seasonYear))
            .filter(e -> seasonYear == null || e.getMatchesPlayed() > 0)
            .sorted((a, b) -> Double.compare(b.getWinRate(), a.getWinRate()))
            .toList();
        }

    private PlayerLeaderboardEntry buildLeaderboardEntry(Player player, Integer seasonYear) {
        var stats = player.getSeasonStats().stream()
            .filter(s -> seasonYear == null || s.getSeasonYear() == seasonYear.shortValue())
            .toList();

        int matchesPlayed = stats.stream().mapToInt(s -> s.getMatchesPlayed()).sum();
        int wins = stats.stream().mapToInt(s -> s.getWins()).sum();
        int draws = stats.stream().mapToInt(s -> s.getDraws()).sum();
        int losses = stats.stream().mapToInt(s -> s.getLosses()).sum();
        int goals = stats.stream().mapToInt(s -> s.getGoals()).sum();
        int assists = stats.stream().mapToInt(s -> s.getAssists()).sum();

        double winRate = matchesPlayed == 0 ? 0.0 :
            Math.round((wins * 100.0 / matchesPlayed) * 10.0) / 10.0;
        double goalsPerGame = matchesPlayed == 0 ? 0.0 :
            Math.round((goals * 1.0 / matchesPlayed) * 10.0) / 10.0;

        return PlayerLeaderboardEntry.builder()
            .playerId(player.getId())
            .name(player.getName())
            .matchesPlayed(matchesPlayed)
            .wins(wins)
            .draws(draws)
            .losses(losses)
            .goals(goals)
            .assists(assists)
            .winRate(winRate)
            .goalsPerGame(goalsPerGame)
            .ability(player.getRating() != null ? player.getRating().getAbility() : null)
            .reliability(player.getRating() != null ? player.getRating().getReliability() : null)
            .goalThreat(player.getRating() != null ? player.getRating().getGoalThreat() : null)
            .seasonYear(seasonYear)
            .build();
    }


    public PlayerProfileResponse getPlayerProfile(Long id) {
        Player player = playerRepository.findByIdWithFullDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player", id));

        List<PlayerProfileResponse.SeasonStatsDetail> seasonStats = player.getSeasonStats()
                .stream()
                .sorted((a, b) -> Short.compare(b.getSeasonYear(), a.getSeasonYear()))
                .map(s -> {
                    double winRate = s.getMatchesPlayed() == 0 ? 0.0 :
                            Math.round((s.getWins() * 100.0 / s.getMatchesPlayed()) * 10.0) / 10.0;
                    double goalsPerGame = s.getMatchesPlayed() == 0 ? 0.0 :
                            Math.round((s.getGoals() * 1.0 / s.getMatchesPlayed()) * 10.0) / 10.0;
                    return PlayerProfileResponse.SeasonStatsDetail.builder()
                    .seasonYear(s.getSeasonYear())
                    .matchesPlayed((int) s.getMatchesPlayed())
                    .wins((int) s.getWins())
                    .draws((int) s.getDraws())
                    .losses((int) s.getLosses())
                    .goals((int) s.getGoals())
                    .assists((int) s.getAssists())
                    .winRate(winRate)
                    .goalsPerGame(goalsPerGame)
                    .build();
                })
                .toList();

        int totalMatches = seasonStats.stream().mapToInt(PlayerProfileResponse.SeasonStatsDetail::getMatchesPlayed).sum();
        int totalWins = seasonStats.stream().mapToInt(PlayerProfileResponse.SeasonStatsDetail::getWins).sum();
        int totalDraws = seasonStats.stream().mapToInt(PlayerProfileResponse.SeasonStatsDetail::getDraws).sum();
        int totalLosses = seasonStats.stream().mapToInt(PlayerProfileResponse.SeasonStatsDetail::getLosses).sum();
        int totalGoals = seasonStats.stream().mapToInt(PlayerProfileResponse.SeasonStatsDetail::getGoals).sum();
        int totalAssists = seasonStats.stream().mapToInt(PlayerProfileResponse.SeasonStatsDetail::getAssists).sum();

        double careerWinRate = totalMatches == 0 ? 0.0 :
                Math.round((totalWins * 100.0 / totalMatches) * 10.0) / 10.0;
        double careerGoalsPerGame = totalMatches == 0 ? 0.0 :
                Math.round((totalGoals * 1.0 / totalMatches) * 10.0) / 10.0;

        return PlayerProfileResponse.builder()
                .id(player.getId())
                .name(player.getName())
                .strongFoot(player.getStrongFoot())
                .notes(player.getNotes())
                .active(player.getActive())
                .ability(player.getRating() != null ? player.getRating().getAbility() : null)
                .reliability(player.getRating() != null ? player.getRating().getReliability() : null)
                .goalThreat(player.getRating() != null ? player.getRating().getGoalThreat() : null)
                .seasonStats(seasonStats)
                .careerStats(PlayerProfileResponse.CareerStats.builder()
                        .totalMatches(totalMatches)
                        .totalWins(totalWins)
                        .totalDraws(totalDraws)
                        .totalLosses(totalLosses)
                        .totalGoals(totalGoals)
                        .totalAssists(totalAssists)
                        .careerWinRate(careerWinRate)
                        .careerGoalsPerGame(careerGoalsPerGame)
                        .build())
                .build();
    }
}
