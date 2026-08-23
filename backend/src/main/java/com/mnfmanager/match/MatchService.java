package com.mnfmanager.match;

import com.mnfmanager.common.exception.ResourceNotFoundException;
import com.mnfmanager.player.Player;
import com.mnfmanager.player.PlayerRepository;
import com.mnfmanager.player.PlayerSeasonStats;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MatchService {

    private final MatchRepository matchRepository;
    private final PlayerRepository playerRepository;

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

        Match match = Match.builder()
                .matchDate(request.getMatchDate())
                .seasonYear(request.getSeasonYear())
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
}