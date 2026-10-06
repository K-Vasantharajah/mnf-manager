"""
Generate the synthetic group used by the public demo.

Invents players with a hidden skill and attendance rate, then simulates weekly
matches the way MNF runs: the challenging captain picks first, picks alternate,
the winning captain keeps the armband. Output is a fixture the backend's demo
profile seeds through MatchService, so derived stats stay consistent.

Dates are stored as weeks ago and resolved when the demo seeds, so the demo's
history always ends last Monday.

    python demo/generate_demo_data.py

Fixed seed: the same fixture every run. Change SEED for a different history.
"""

import json
import math
import random
from pathlib import Path

SEED = 42
WEEKS = 60
SQUAD_SIZE = 18
EXHIBITION_EVERY = 20  # one friendly roughly every twenty weeks
OUTPUT = (
    Path(__file__).resolve().parents[2]
    / "backend/src/main/resources/demo/demo-data.json"
)

# Invented players. None of these names appear in the real group.
PLAYERS = [
    ("Rohan", "CB"),
    ("Dev", "CB"),
    ("Tariq", "CB"),
    ("Callum", "CB"),
    ("Nikhil", "LB"),
    ("Zak", "LB"),
    ("Omar", "RB"),
    ("Liam", "RB"),
    ("Arjun", "CDM"),
    ("Kieran", "CDM"),
    ("Bilal", "CDM"),
    ("Rehan", "CM"),
    ("Theo", "CM"),
    ("Marcus", "CM"),
    ("Imran", "CAM"),
    ("Sami", "CAM"),
    ("Hamid", "CAM"),
    ("Ethan", "LW"),
    ("Kai", "LW"),
    ("Leon", "RW"),
    ("Yasin", "RW"),
    ("Owen", "ST"),
    ("Farhan", "ST"),
    ("Dan", "ST"),
    ("Rory", "ST"),
    ("Adil", "GK"),
    ("Tom", "CB"),
    ("Jude", "CM"),
    ("Sunny", "LW"),
    ("Nathan", "RB"),
    ("Waqas", "ST"),
    ("Luca", "CAM"),
]

# Relative chance of scoring, by position
SCORING = {
    "GK": 0.1,
    "CB": 0.4,
    "LB": 0.5,
    "RB": 0.5,
    "CDM": 0.8,
    "CM": 1.0,
    "CAM": 1.6,
    "LW": 1.8,
    "RW": 1.8,
    "ST": 2.4,
}


def poisson(rng: random.Random, mean: float) -> int:
    """Knuth's method; fine for the small means used here."""
    limit, k, p = math.exp(-mean), 0, 1.0
    while True:
        p *= rng.random()
        if p <= limit:
            return k
        k += 1


def main() -> None:
    rng = random.Random(SEED)

    players = [
        {
            "name": name,
            "position": position,
            "skill": rng.gauss(0, 1),
            # The last six are occasional players, so some stay below the
            # 20 appearances needed for a rating, like newer members of a real group
            "attendance": (
                rng.uniform(0.05, 0.2)
                if i >= len(PLAYERS) - 6
                else rng.uniform(0.35, 0.95)
            ),
        }
        for i, (name, position) in enumerate(PLAYERS)
    ]

    matches = []
    holder, challenger = None, None  # winning captain keeps the armband
    last_captained = {p["name"]: -1 for p in players}

    for week in range(WEEKS):
        weeks_ago = WEEKS - 1 - week
        exhibition = week > 0 and week % EXHIBITION_EVERY == 0

        # Who turns up: weighted by attendance, always a full squad
        weights = [p["attendance"] for p in players]
        squad = []
        pool = list(players)
        while len(squad) < SQUAD_SIZE:
            pick = rng.choices(pool, weights=[p["attendance"] for p in pool])[0]
            squad.append(pick)
            pool.remove(pick)
        names = {p["name"] for p in squad}

        # Captains: the holder stays if present; the challenger is whoever
        # has gone longest without captaining
        if holder not in names:
            holder = None
        candidates = sorted(
            (p for p in squad if p["name"] != holder),
            key=lambda p: (last_captained[p["name"]], rng.random()),
        )
        if holder is None:
            holder = candidates.pop(0)["name"]
        challenger = candidates[0]["name"]
        last_captained[holder] = last_captained[challenger] = week

        by_name = {p["name"]: p for p in squad}
        team_a, team_b = [by_name[holder]], [by_name[challenger]]

        # Draft: challenger (B) picks first, then alternate, by perceived skill
        remaining = sorted(
            (p for p in squad if p["name"] not in (holder, challenger)),
            key=lambda p: p["skill"] + rng.gauss(0, 0.6),
            reverse=True,
        )
        for i, p in enumerate(remaining):
            (team_b if i % 2 == 0 else team_a).append(p)

        def strength(team):
            return sum(p["skill"] for p in team) / len(team)

        gap = strength(team_a) - strength(team_b)
        score_a = poisson(rng, max(0.5, 3.0 + 0.8 * gap))
        score_b = poisson(rng, max(0.5, 3.0 - 0.8 * gap))

        def scorers(team, team_label, goals, opponents):
            tally = {}
            for _ in range(goals):
                if rng.random() < 0.03:  # occasional own goal by the opposition
                    who = rng.choice(opponents)["name"]
                    key = (who, True)
                else:
                    who = rng.choices(
                        team,
                        weights=[
                            SCORING[p["position"]] * math.exp(0.3 * p["skill"])
                            for p in team
                        ],
                    )[0]["name"]
                    key = (who, False)
                tally[key] = tally.get(key, 0) + 1
            return [
                {
                    "player": who,
                    "goals": n,
                    "team": (
                        team_label if not own else ("B" if team_label == "A" else "A")
                    ),
                    "ownGoal": own,
                }
                for (who, own), n in tally.items()
            ]

        goals = scorers(team_a, "A", score_a, team_b) + scorers(
            team_b, "B", score_b, team_a
        )

        matches.append(
            {
                "weeksAgo": weeks_ago,
                "exhibition": exhibition,
                "captainA": holder,
                "captainB": challenger,
                "scoreA": score_a,
                "scoreB": score_b,
                "teamA": [p["name"] for p in team_a],
                "teamB": [p["name"] for p in team_b],
                "goals": goals,
            }
        )

        # The winner keeps the armband; after a draw, the holder stays
        if not exhibition and score_b > score_a:
            holder = challenger

    fixture = {
        "players": [{"name": p["name"], "position": p["position"]} for p in players],
        "matches": matches,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(fixture, indent=2))
    print(f"Wrote {len(players)} players and {len(matches)} matches to {OUTPUT}")


if __name__ == "__main__":
    main()
