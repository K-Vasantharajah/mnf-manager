# MNF Manager — ML Service

> **Note:** the ratings model is being reworked. This document describes the
> current implementation, which will change. See "Known limitations" below.

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

Service runs on `http://localhost:5001`.

In production the service has internal ingress only — it isn't reachable from
the internet, and all calls come through the backend's `DraftController`.

## Configuration

The database connection is read from `DATABASE_URL`, falling back to a local
development database:

```bash
DATABASE_URL='postgresql://user:password@host:5432/mnfmanager?sslmode=require' python update_ratings.py
```

## Endpoints

| Method | Endpoint                             | Description                                 |
| ------ | ------------------------------------ | ------------------------------------------- |
| GET    | `/health`                            | Health check                                |
| GET    | `/api/ratings/`                      | ML-derived ratings for all players          |
| GET    | `/api/ratings/player/{id}`           | ML-derived rating for a specific player     |
| POST   | `/api/draft/preferences/{captainId}` | Captain pick preferences from co-occurrence |
| POST   | `/api/draft/predict`                 | Match outcome prediction                    |
| POST   | `/api/draft/captain-recommendations` | Captain rotation suggestions                |
| GET    | `/api/chemistry/`                    | All pairwise chemistry scores               |
| GET    | `/api/chemistry/player/{id}`         | Chemistry scores for a specific player      |
| POST   | `/api/chemistry/team`                | Team chemistry score                        |

## How ratings are calculated

### Attack and defence ratings

Ridge regression adjusted plus-minus model (α=50). Each match produces two
training rows — one per team — with binary player presence features. The model
solves for each player's individual contribution to goals scored (attack) and
goals conceded (defence), controlling for teammate quality.

Both are placed on a shared centred scale: the group average sits at 5.5, and
each standard deviation of impact moves a rating by 1.5 points, clipped to a
3–10 range. Because the scale is anchored to the group's mean and spread rather
than its extremes, one player's unusual result no longer rescales everyone else.

An 8 in attack and an 8 in defence represent the same magnitude of contribution.

### Overall rating

A position-weighted blend of attack and defence, calculated from the unrounded
values so rounding doesn't compound. Weights range from 65/35 for forwards to
35/65 for defenders. These are starting parameters rather than football truth —
they should be validated against how well they predict future results.

### Reliability rating

Attendance rate (matches played / total competitive matches), scaled
independently. Reliability measures availability, not ability, and is kept
separate from the football ratings for that reason.

### Minimum threshold

Players with fewer than 10 appearances receive no rating. A null is more honest
than a floor value.

### Delta tracking

Each update stores the previous ratings before recalculating, and writes the
change back to the database. Deltas only make sense when the script is run once
per match night: running it twice in succession compares a result against
itself and produces zeros.

## Chemistry analysis

Pairwise win rate vs expected win rate for all player combinations with 5+
matches together. Chemistry score = win rate together − average individual win
rate. Positive means they perform better together, negative means worse.

## Draft simulator

Captain preferences are inferred from historical team co-occurrence rates. Match
outcome prediction uses ridge regression impact coefficients to estimate expected
goals per team, converted to a win probability via a sigmoid function.

## Updating ratings

After each match night, once results are recorded:

```bash
source venv/bin/activate
DATABASE_URL='<connection string>' python update_ratings.py
```

This is currently a manual step; scheduling it is on the roadmap.

## Known limitations

The model measures **impact on results, not ability**. It can't distinguish a
player who performed poorly from one who performed well on a losing team.

With a squad of around thirty and teams picked by captains in alternating order,
the same players frequently appear together. Ridge regression handles the
resulting instability by shrinking coefficients toward zero, but that solves a
variance problem rather than an identification one: when two players almost
always share a team, the data can't say which of them drove the result.

Team selection isn't random either. The challenging captain picks first, so
players picked late tend to share teammates with other late picks, and the model
attributes their teams' results to them individually.

Specific gaps being addressed in the next version:

- **No opposition adjustment.** Conceding three against a strong attack counts
  the same as conceding three against a weak one.
- **No uncertainty.** A rating derived from ten appearances with the same eight
  teammates is presented as confidently as one derived from varied line-ups.
- **Goals are modelled as continuous.** They're counts, so a Poisson or negative
  binomial model would suit them better than ordinary least squares.
- **α is fixed at 50** rather than tuned against held-out matches.

## Caching

The impact model, ratings and chemistry calculations each cache their results in
module-level variables, with a `force_refresh` parameter to bust the cache. Note
that in a long-running service this means the model keeps using the data it
loaded at startup until something forces a refresh, so newly recorded matches
won't appear in predictions immediately.
