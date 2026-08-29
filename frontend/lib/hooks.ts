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