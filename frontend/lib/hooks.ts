import { useQuery } from '@tanstack/react-query';
import api from './api';
import { Player, PlayerStats, Match, PlayerLeaderboardEntry } from './types';

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