"""
Permutation test: is there more chemistry in the data than luck would produce?

Keeps every real lineup and randomly swaps which team won each match, which
breaks any link between who played together and how they did. If the real
chemistry scores look like the swapped ones, the scores are noise.

Lineups never change between permutations, so the pair structure is built
once and only the wins are recomputed. The fast path is checked against
models.chemistry.chemistry_from on the real data before anything is reported.

    python -m evaluation.chemistry_null
"""

from itertools import combinations

import numpy as np
import pandas as pd

from data.loader import load_team_compositions
from models.chemistry import MIN_MATCHES_TOGETHER, chemistry_from

N_PERMUTATIONS = 2000
EXTREME = 20.0  # points above or below expected, roughly what the UI highlights
SEED = 0


class FastChemistry:
    """Chemistry scores for fixed lineups under any set of swapped results."""

    def __init__(self, comps: pd.DataFrame, min_matches: int = MIN_MATCHES_TOGETHER):
        match_ids = np.sort(comps["match_id"].unique())
        self.n_matches = len(match_ids)
        match_code = {m: i for i, m in enumerate(match_ids)}

        player_ids = np.sort(comps["player_id"].unique())
        player_code = {p: i for i, p in enumerate(player_ids)}

        # One row per player per match
        self.row_player = comps["player_id"].map(player_code).to_numpy()
        self.row_match = comps["match_id"].map(match_code).to_numpy()
        self.row_win = (comps["result"] == "WIN").to_numpy(dtype=float)
        self.row_decisive = (comps["result"] != "DRAW").to_numpy()
        self.player_matches = np.bincount(self.row_player)

        # One row per pair per match they shared a team
        pair_code: dict[tuple[int, int], int] = {}
        pair_rows = []
        for (match_id, _), group in comps.groupby(["match_id", "team"]):
            result = group["result"].iloc[0]
            players = sorted(group["player_id"].tolist())
            for a, b in combinations(players, 2):
                code = pair_code.setdefault((a, b), len(pair_code))
                pair_rows.append((code, match_code[match_id], result))

        pr = np.array([r[0] for r in pair_rows])
        self.pair_row_code = pr
        self.pair_row_match = np.array([r[1] for r in pair_rows])
        results = np.array([r[2] for r in pair_rows])
        self.pair_row_win = (results == "WIN").astype(float)
        self.pair_row_decisive = results != "DRAW"

        n_pairs = len(pair_code)
        self.matches_together = np.bincount(pr, minlength=n_pairs)
        self.keep = self.matches_together >= min_matches

        pairs = np.array(list(pair_code.keys()))
        self.pair_a = np.array([player_code[p] for p in pairs[:, 0]])
        self.pair_b = np.array([player_code[p] for p in pairs[:, 1]])

    def scores(self, flip: np.ndarray | None = None) -> np.ndarray:
        """Chemistry scores for kept pairs, with results swapped where flip is True."""
        if flip is None:
            flip = np.zeros(self.n_matches, dtype=bool)

        swap_rows = self.row_decisive & flip[self.row_match]
        row_win = np.where(swap_rows, 1 - self.row_win, self.row_win)
        wins = np.bincount(self.row_player, weights=row_win)
        rate = np.round(wins / self.player_matches * 100, 1)

        swap_pairs = self.pair_row_decisive & flip[self.pair_row_match]
        pair_win = np.where(swap_pairs, 1 - self.pair_row_win, self.pair_row_win)
        wins_together = np.bincount(
            self.pair_row_code, weights=pair_win, minlength=len(self.matches_together)
        )
        together = np.round(wins_together / self.matches_together * 100, 1)
        expected = (rate[self.pair_a] + rate[self.pair_b]) / 2

        return np.round(together - expected, 1)[self.keep]


def statistics(scores: np.ndarray) -> dict:
    return {
        "pairs": len(scores),
        "spread": float(np.std(scores, ddof=1)),
        "top": float(scores.max()),
        "bottom": float(scores.min()),
        "extreme": int((np.abs(scores) >= EXTREME).sum()),
    }


def main() -> None:
    comps = load_team_compositions()
    fast = FastChemistry(comps)

    # The fast path must reproduce the production calculation exactly
    reference = np.sort(chemistry_from(comps)["chemistry_score"].to_numpy())
    real_scores = fast.scores()
    if not np.allclose(np.sort(real_scores), reference):
        raise SystemExit("Fast chemistry doesn't match chemistry_from — not reporting.")

    rng = np.random.default_rng(SEED)
    real = statistics(real_scores)
    null = pd.DataFrame(
        [
            statistics(fast.scores(rng.random(fast.n_matches) < 0.5))
            for _ in range(N_PERMUTATIONS)
        ]
    )

    print(
        f"{real['pairs']} pairs with {MIN_MATCHES_TOGETHER}+ matches together, "
        f"{N_PERMUTATIONS} permutations\n"
    )

    rows = []
    for stat, higher_is_extreme in (
        ("spread", True),
        ("top", True),
        ("extreme", True),
        ("bottom", False),
    ):
        as_extreme = (
            null[stat] >= real[stat] if higher_is_extreme else null[stat] <= real[stat]
        )
        rows.append(
            {
                "statistic": stat,
                "real": round(real[stat], 1),
                "null_median": round(float(null[stat].median()), 1),
                "null_5%": round(float(null[stat].quantile(0.05)), 1),
                "null_95%": round(float(null[stat].quantile(0.95)), 1),
                "p_value": round((1 + as_extreme.sum()) / (1 + N_PERMUTATIONS), 3),
            }
        )
    print(pd.DataFrame(rows).to_string(index=False))


if __name__ == "__main__":
    main()
