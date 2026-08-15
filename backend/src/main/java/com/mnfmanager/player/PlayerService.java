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
    playerRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Player", id));
    playerRepository.deleteById(id);
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
}
