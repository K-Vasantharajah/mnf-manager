"""
Chemistry analysis — identifies player pairs who consistently
win or lose together.

For each pair of players who have played on the same team,
we calculate:
- matches_together: how many times they played on the same team
- wins_together: how many of those matches they won
- win_rate_together: wins / matches as a percentage
- chemistry_score: win_rate vs each player's individual win_rate
  positive = they perform better together than apart
  negative = they perform worse together than apart
"""

import pandas as pd
import numpy as np
from data.loader import load_team_compositions, load_all_players
from itertools import combinations

MIN_MATCHES_TOGETHER = 5


def calculate_chemistry():
    """
    Calculate pairwise chemistry scores for all player combinations.
    Returns DataFrame sorted by chemistry score descending.
    """
    comps = load_team_compositions()
    all_players = load_all_players()

    # Individual win rates
    individual = comps.groupby('player_id').agg(
        total_matches=('match_id', 'nunique'),
        wins=('result', lambda x: (x == 'WIN').sum())
    ).reset_index()
    individual['individual_win_rate'] = (
        individual['wins'] / individual['total_matches'] * 100
    ).round(1)

    # For each match, get list of players per team
    team_matches = comps.groupby(['match_id', 'team'])['player_id'].apply(list).reset_index()

    # Generate all pairs within each team per match
    pair_results = []
    for _, row in team_matches.iterrows():
        players = row['player_id']
        result_for_team = comps[
            (comps['match_id'] == row['match_id']) &
            (comps['team'] == row['team'])
        ]['result'].iloc[0]

        for p1, p2 in combinations(sorted(players), 2):
            pair_results.append({
                'player_a': p1,
                'player_b': p2,
                'match_id': row['match_id'],
                'result': result_for_team
            })

    pairs_df = pd.DataFrame(pair_results)

    if pairs_df.empty:
        return pd.DataFrame()

    # Aggregate pair stats
    chemistry = pairs_df.groupby(['player_a', 'player_b']).agg(
        matches_together=('match_id', 'nunique'),
        wins_together=('result', lambda x: (x == 'WIN').sum()),
        draws_together=('result', lambda x: (x == 'DRAW').sum()),
    ).reset_index()

    chemistry['win_rate_together'] = (
        chemistry['wins_together'] / chemistry['matches_together'] * 100
    ).round(1)

    # Filter minimum matches
    chemistry = chemistry[chemistry['matches_together'] >= MIN_MATCHES_TOGETHER].copy()

    # Merge individual win rates
    chemistry = chemistry.merge(
        individual[['player_id', 'individual_win_rate']].rename(
            columns={'player_id': 'player_a', 'individual_win_rate': 'win_rate_a'}
        ),
        on='player_a', how='left'
    )
    chemistry = chemistry.merge(
        individual[['player_id', 'individual_win_rate']].rename(
            columns={'player_id': 'player_b', 'individual_win_rate': 'win_rate_b'}
        ),
        on='player_b', how='left'
    )

    # Chemistry score: how much better/worse they perform together vs individually
    chemistry['expected_win_rate'] = (
        (chemistry['win_rate_a'] + chemistry['win_rate_b']) / 2
    )
    chemistry['chemistry_score'] = (
        chemistry['win_rate_together'] - chemistry['expected_win_rate']
    ).round(1)

    # Merge player names
    players_dict = all_players.set_index('id')['name'].to_dict()
    chemistry['player_a_name'] = chemistry['player_a'].map(players_dict)
    chemistry['player_b_name'] = chemistry['player_b'].map(players_dict)

    return chemistry[[
        'player_a', 'player_a_name',
        'player_b', 'player_b_name',
        'matches_together', 'wins_together', 'draws_together',
        'win_rate_together', 'expected_win_rate', 'chemistry_score'
    ]].sort_values('chemistry_score', ascending=False).reset_index(drop=True)


def get_player_chemistry(player_id: int, min_matches: int = MIN_MATCHES_TOGETHER):
    """Get chemistry scores for a specific player with all teammates."""
    chemistry = calculate_chemistry()
    if chemistry.empty:
        return []

    player_chem = chemistry[
        (chemistry['player_a'] == player_id) |
        (chemistry['player_b'] == player_id)
    ].copy()

    # Normalise so the player is always in player_a column
    player_chem['partner_id'] = np.where(
        player_chem['player_a'] == player_id,
        player_chem['player_b'],
        player_chem['player_a']
    )
    player_chem['partner_name'] = np.where(
        player_chem['player_a'] == player_id,
        player_chem['player_b_name'],
        player_chem['player_a_name']
    )

    return player_chem[[
        'partner_id', 'partner_name',
        'matches_together', 'wins_together',
        'win_rate_together', 'chemistry_score'
    ]].sort_values('chemistry_score', ascending=False).to_dict(orient='records')