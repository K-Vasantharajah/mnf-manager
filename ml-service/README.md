# MNF Manager — ML Service

Python microservice for ML-derived player ratings, draft simulation, and chemistry analysis.

## Setup

Requires Python 3.11.

```bash
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Running

```bash
source venv/bin/activate
flask run --port 5001
```

Service runs on `http://localhost:5001`

## Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/ratings/` | ML-derived ratings for all players |
| GET | `/api/ratings/player/{id}` | ML-derived rating for a specific player |
| POST | `/api/draft/preferences/{captainId}` | Captain pick preferences from co-occurrence |
| POST | `/api/draft/predict` | Match outcome prediction |
| POST | `/api/draft/captain-recommendations` | Captain rotation suggestions |
| GET | `/api/chemistry/` | All pairwise chemistry scores |
| GET | `/api/chemistry/player/{id}` | Chemistry scores for a specific player |
| POST | `/api/chemistry/team` | Team chemistry score |

## How ratings are calculated

### Attack and defence ratings
Ridge regression adjusted plus-minus model (α=50). Each match produces two training rows — one per team — with binary player presence features. The model solves for each player's individual contribution to goals scored (attack) and goals conceded (defence), controlling for teammate quality.

Attack and defence are scaled on a shared MinMaxScaler (1-10) so the scales are directly comparable.

### Reliability rating
Attendance rate (matches played / total competitive matches), scaled independently on a 1-10 MinMaxScaler.

### Overall rating
Average of attack and defence ratings, rounded to the nearest integer.

### Minimum threshold
Players with fewer than 10 appearances receive no rating. A null is more honest than a floor value.

### Delta tracking
Each weekly update stores the previous ratings before recalculating, and writes the delta (change since last update) back to the database.

## Chemistry analysis

Pairwise win rate vs expected win rate for all player combinations with 5+ matches together. Chemistry score = win rate together − average individual win rate. Positive = perform better together, negative = perform worse.

## Draft simulator

Captain preferences inferred from historical team co-occurrence rates. Match outcome prediction uses ridge regression impact coefficients to estimate expected goals per team, converted to win probability via sigmoid function.