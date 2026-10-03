package com.mnfmanager.draft;

import com.mnfmanager.player.Player;
import com.mnfmanager.player.PlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DraftService {

    static final int MIN_CAPTAINCIES_WITH_PLAYER = 5;

    private final DraftQueryRepository draftQueries;
    private final PlayerRepository playerRepository;

    public List<CaptainPreference> captainPreferences(Long captainId, List<Long> availableIds) {
        Map<Long, DraftQueryRepository.CaptainHistoryRow> history = draftQueries
                .findCaptainHistory(captainId).stream()
                .collect(Collectors.toMap(DraftQueryRepository.CaptainHistoryRow::getPlayerId,
                        Function.identity()));
        Map<Long, String> names = namesOf(availableIds);

        List<CaptainPreference> rows = new ArrayList<>();
        for (Long playerId : availableIds.stream().distinct().toList()) {
            var row = history.get(playerId);
            int captaincies = row == null ? 0 : row.getCaptaincies().intValue();
            int picked = row == null ? 0 : row.getPicked().intValue();
            Double rate = captaincies >= MIN_CAPTAINCIES_WITH_PLAYER
                    ? Math.round(picked * 1000.0 / captaincies) / 10.0
                    : null;
            rows.add(new CaptainPreference(
                    playerId, names.getOrDefault(playerId, ""), picked, captaincies, rate));
        }

        rows.sort(Comparator
                .comparing((CaptainPreference p) -> p.togetherRate() == null)
                .thenComparing(Comparator.comparingDouble(
                        (CaptainPreference p) -> p.togetherRate() == null ? 0 : p.togetherRate())
                        .reversed())
                .thenComparing(Comparator.comparingInt(
                        CaptainPreference::captainciesWithPlayer).reversed()));
        return rows;
    }

    public List<CaptainRecommendation> captainRecommendations(List<Long> availableIds) {
        Map<Long, DraftQueryRepository.CaptaincyRow> captaincies = draftQueries
                .findCaptaincies(LocalDate.now().getYear()).stream()
                .collect(Collectors.toMap(DraftQueryRepository.CaptaincyRow::getPlayerId,
                        Function.identity()));

        return playerRepository.findAllById(availableIds).stream()
                .map(player -> {
                    var row = captaincies.get(player.getId());
                    return new CaptainRecommendation(
                            player.getId(),
                            player.getName(),
                            player.getPosition(),
                            row == null ? 0 : row.getTimesCaptained().intValue(),
                            row == null ? 0 : row.getLastMatchId());
                })
                .sorted(Comparator
                        .comparingInt(CaptainRecommendation::timesCaptainedThisSeason)
                        .thenComparingLong(CaptainRecommendation::lastMatchIdCaptained)
                        .thenComparing(CaptainRecommendation::name))
                .toList();
    }

    private Map<Long, String> namesOf(List<Long> playerIds) {
        return playerRepository.findAllById(playerIds).stream()
                .collect(Collectors.toMap(Player::getId, Player::getName));
    }
}