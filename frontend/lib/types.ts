export interface PlayerRating {
  id: number;
  ability: number;
  reliability: number;
  goalThreat: number;
  ratedAt: string;
  ratedBy: string;
}

export interface Player {
  id: number;
  name: string;
  active: boolean;
  strongFoot: string;
  notes: string;
  rating: PlayerRating | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerStats {
  playerId: number;
  name: string;
  winRate: number;
  contributionScore: number;
}

export interface Match {
  id: number;
  matchDate: string;
  seasonYear: number;
  captainA: Player;
  captainB: Player;
  scoreA: number;
  scoreB: number;
  winner: Player | null;
  isDraw: boolean;
  durationMins: number;
  createdAt: string;
}

export interface PlayerLeaderboardEntry {
  playerId: number;
  name: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goals: number;
  assists: number;
  winRate: number;
  goalsPerGame: number;
  ability: number;
  reliability: number;
  goalThreat: number;
  seasonYear: number | null;
}