# MNF Manager — Ratings and evaluation

Despite the folder name, this is no longer a service. It holds:

- **`update_ratings.py`**: recalculates player ratings. Runs in production as a
  daily Azure Container Apps Job.
- **`models/ratings.py`**: the ratings model.
- **`evaluation/`**: the harness that compares rating models against held-out
  matches, and the chemistry permutation test.
- **`demo/`**: the generator for the public demo's synthetic group.

The folder and image are still called `ml-service` from when this was a Flask
service. Renaming would touch CI, the image name and the job configuration at
once, so it hasn't been done.

## Setup

Requires Python 3.11.

```bash
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

The database connection comes from `DATABASE_URL`, falling back to the local
development database.

## Updating ratings

```bash
DATABASE_URL='postgresql://user:password@host:5432/mnfmanager?sslmode=require' python update_ratings.py
```

It only recalculates if a competitive match has been recorded since the last
update. Running twice for the same match night would compare ratings against
themselves and reset every delta to zero. `--force` overrides the check, for
example after correcting a result.

In production, `mnf-ratings-job` runs this daily at 06:00 UTC, so ratings from a
Monday match are ready by Tuesday morning. It uses the same image CI builds from
this folder.

Deltas are only stored for players who played in the latest match: ratings are
relative, so an absent player's rating can move when others' results change.

## How ratings are calculated

Each player is compared with others in the same position group (defence,
midfield or attack) on four statistics, each converted to a percentile within
the group and weighted by position:

|          | Points % | Goals | Clean sheets | Goals conceded |
| -------- | -------- | ----- | ------------ | -------------- |
| Attack   | 50%      | 40%   | 0%           | 10%            |
| Midfield | 50%      | 20%   | 15%          | 15%            |
| Defence  | 50%      | 10%   | 20%          | 20%            |

- **Attack** blends points and goals; **defence** blends points, clean sheets and
  goals conceded; **overall** blends the two by position (65/35 for forwards to
  35/65 for defenders)
- **Recency**: a player's own appearances decay with a 40-appearance half-life,
  and all matches decay with a 60-match-week half-life, so stale evidence counts
  for less
- **Shrinkage** pulls ratings towards the middle in proportion to how little is
  known about a player
- **Minimum**: 20 appearances before a player is rated
- **Scale**: 60–95, so no rating reads as a verdict
- **Reliability** is attendance, scaled separately and kept out of overall

Ratings describe recorded results, not ability.

## Evaluation

```bash
python -m evaluation.run             # compare models on held-out weeks
python -m evaluation.chemistry_null  # permutation test for pair chemistry
python -m evaluation.tune            # see how each parameter moves the table
```

`evaluation.run` trains each candidate on all matches before a given week and
predicts that week, then measures rank stability on random subsamples. The
findings that shaped the app:

- No model, including the original ridge regression, predicted results better
  than chance
- The percentile model's ranks are about as stable as the ridge model's, compared
  over the same eligible players
- Chemistry scores were indistinguishable from chance in a permutation test that
  swaps match results while keeping line-ups fixed (spread p = 0.44)

The ridge model (`models/impact.py`) and the chemistry calculation
(`models/chemistry.py`) stay as baselines for the harness.

`tune.py` reads an optional `WATCH` environment variable of comma-separated
names to highlight, so no names live in the code.

## Demo data

The public demo uses an invented group:

```bash
python demo/generate_demo_data.py    # writes the fixture the demo backend seeds from
```

To refresh the demo's ratings, seed a local demo database by running the backend
with the `demo` profile, then:

```bash
DATABASE_URL='postgresql://mnf:mnf_local_password@localhost:5432/mnfmanager_demo' python update_ratings.py --force
DATABASE_URL='postgresql://mnf:mnf_local_password@localhost:5432/mnfmanager_demo' python demo/export_demo_ratings.py
```

The exporter refuses any database not ending in `_demo`, so real ratings can never
be written into the repository.

## Tests

```bash
python -m pytest tests/
```
