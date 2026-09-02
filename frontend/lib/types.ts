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
  pointsPercentage: number;
  goalsPerGame: number;
  ability: number;
  reliability: number;
  goalThreat: number;
  seasonYear: number | null;
}

export interface GoalScorerDetail {
  playerId: number;
  playerName: string;
  goals: number;
  team: 'A' | 'B';
}

export interface MatchDetail {
  id: number;
  matchDate: string;
  seasonYear: number;
  captainAId: number;
  captainAName: string;
  captainBId: number;
  captainBName: string;
  scoreA: number;
  scoreB: number;
  winnerId: number | null;
  isDraw: boolean;
  durationMins: number;
  teamAPlayerIds: number[];
  teamBPlayerIds: number[];
  goalScorers: GoalScorerDetail[];
}

export interface SeasonStatsDetail {
  seasonYear: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goals: number;
  assists: number;
  winRate: number;
  goalsPerGame: number;
}

export interface PlayerProfile {
  id: number;
  name: string;
  strongFoot: string;
  notes: string;
  active: boolean;
  ability: number | null;
  reliability: number | null;
  goalThreat: number | null;
  seasonStats: SeasonStatsDetail[];
  careerStats: {
    totalMatches: number;
    totalWins: number;
    totalDraws: number;
    totalLosses: number;
    totalGoals: number;
    totalAssists: number;
    careerWinRate: number;
    careerGoalsPerGame: number;
  };
}

export interface CaptainStats {
  playerId: number;
  name: string;
  matchesCaptained: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  mostPickedPlayers: string[];
  seasonYear: number | null;
}