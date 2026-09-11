import { useQuery } from '@tanstack/react-query';
import api from './api';
import { Player, PlayerStats, Match, PlayerLeaderboardEntry, MatchDetail, PlayerProfile, CaptainStats } from './types';

export function usePlayers() {
  return useQuery<Player[]>({
    queryKey: ['players'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/players');
      return data;
    },
  });
}

export function usePlayer(id: number) {
  return useQuery<Player>({
    queryKey: ['players', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/players/${id}`);
      return data;
    },
  });
}

export function usePlayerStats(id: number) {
  return useQuery<PlayerStats>({
    queryKey: ['players', id, 'stats'],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/players/${id}/stats`);
      return data;
    },
  });
}

export function useMatches() {
  return useQuery<Match[]>({
    queryKey: ['matches'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/matches');
      return data;
    },
  });
}

export function useLeaderboard(seasonYear?: number) {
  return useQuery<PlayerLeaderboardEntry[]>({
    queryKey: ['leaderboard', seasonYear],
    queryFn: async () => {
      const url = seasonYear
        ? `/api/v1/players/leaderboard?seasonYear=${seasonYear}`
        : '/api/v1/players/leaderboard';
      const { data } = await api.get(url);
      return data;
    },
  });
}

export function useMatch(id: number) {
  return useQuery<Match>({
    queryKey: ['matches', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/matches/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useMatchDetail(id: number) {
  return useQuery<MatchDetail>({
    queryKey: ['matches', id, 'detail'],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/matches/${id}/detail`);
      return data;
    },
    enabled: !!id,
  });
}

export function usePlayerProfile(id: number) {
  return useQuery<PlayerProfile>({
    queryKey: ['players', id, 'profile'],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/players/${id}/profile`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCaptainStats(seasonYear?: number) {
  return useQuery<CaptainStats[]>({
    queryKey: ['captains', seasonYear],
    queryFn: async () => {
      const url = seasonYear
        ? `/api/v1/players/captains/stats?seasonYear=${seasonYear}`
        : '/api/v1/players/captains/stats';
      const { data } = await api.get(url);
      return data;
    },
  });
}

export function useDashboardStats() {
  return useQuery<{
    currentWinningCaptain: string;
    currentStreakCaptain: string;
    currentStreak: number;
    longestCurrentSeasonStreakCaptain: string;
    longestCurrentSeasonStreak: number;
    longestAllTimeStreakCaptain: string;
    longestAllTimeStreak: number;
  }>({
    queryKey: ['stats-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/dashboard/stats');
      return data;
    },
  });
}

export function useAllPlayers() {
  return useQuery<Player[]>({
    queryKey: ['players', 'all'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/players/all');
      return data;
    },
  });
}

export interface PlayerMatchEntry {
  id: number;
  gameWeek: string;
  seasonYear: number;
  captainAName: string;
  captainBName: string;
  scoreA: number;
  scoreB: number;
  isDraw: boolean;
  winnerName: string | null;
  playerTeam: string;
  result: 'WIN' | 'DRAW' | 'LOSS';
}

export function usePlayerMatches(playerId: number, seasonYear: number) {
  return useQuery<PlayerMatchEntry[]>({
    queryKey: ['players', playerId, 'matches', seasonYear],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/players/${playerId}/matches?seasonYear=${seasonYear}`);
      return data;
    },
    enabled: !!playerId && !!seasonYear,
  });
}

export function useCaptainRecommendations() {
  return useMutation({
    mutationFn: async (availablePlayerIds: number[]) => {
      const { data } = await api.post('/api/v1/draft/captain-recommendations', {
        availablePlayerIds,
      });
      return data.recommendations as {
        player_id: number;
        name: string;
        position: string;
        times_captained_this_season: number;
        last_match_id_captained: number;
      }[];
    },
  });
}

