# MNF Manager

![CI/CD](https://github.com/K-Vasantharajah/mnf-manager/actions/workflows/ci-cd.yml/badge.svg)
![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Python](https://img.shields.io/badge/Python-3.11-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)

Stats, player ratings and a draft simulator for a weekly 9-a-side football group,
in use every Monday since 2025.

**[Try the live demo](https://mnfmanager.app/access)**: invented players, full
admin access, and it resets itself. The demo sleeps when idle, so the first visit
can take up to 30 seconds. The real group's data sits behind an access code; the
[story page](https://mnfmanager.app/story) and
[privacy notice](https://mnfmanager.app/privacy) are public.

## What it does

- **Match records**: teams, scores, goal scorers and own goals, with exhibition
  matches kept out of competitive stats
- **Player profiles**: career and season stats, match history, position
- **Ratings**: a 60–95 rating per player, compared within position and weighted
  towards recent form (see [how ratings work](#how-ratings-work))
- **Draft simulator**: pick tonight's squad and captains, then draft with a live
  check on each side's positional balance, how often each player has ended up on
  the current captain's team, and an _On the night_ panel of milestones and
  streaks ("Sam's 50th MNF match", "unbeaten in their last 6 together")
- **Captain stats**: records, unbeaten runs, and who should captain next

## What the data said, and what changed because of it

The first version had a ridge-regression player model that predicted match
results, and a "chemistry" score for pairs of players. Before trusting either,
I built an evaluation harness (`ml-service/evaluation/`) that trains on past
weeks and predicts the next one.

- **Match prediction didn't work.** No model, including the one in production,
  predicted results better than chance. The ridge model predicted a draw in every
  held-out week. Teams picked by alternating captains are close to balanced by
  construction, so results are mostly luck. The win-probability feature was
  removed and replaced by a positional balance check.
- **Chemistry was noise.** A permutation test that swaps match results while
  keeping line-ups fixed found pair scores indistinguishable from chance
  (spread p = 0.44). Chemistry scores were removed. Pair records survive as plain
  facts ("unbeaten in their last 6 together"), worded as what happened, not why.
- **Ratings stayed, rebuilt as a transparent model.** The replacement ranks players
  on stats they can check, within their position. It's no better at predicting
  results, since nothing is, but it's as stable as the old model and explainable
  to the people it rates.
- **The architecture shrank to match.** With prediction gone, the Python service
  had no live work left. The draft endpoints moved into the backend, ratings became
  a daily scheduled job, and the always-on ML container was removed. Together with
  scale-to-zero, running costs fell from about £30 to under £10 a month.

## Architecture

| Component | Technology                                    | Runs as                                        |
| --------- | --------------------------------------------- | ---------------------------------------------- |
| Frontend  | Next.js · TypeScript · Tailwind · React Query | Container App, always on                       |
| Backend   | Java 21 · Spring Boot 3 · Spring Data JPA     | Container App, scales to zero                  |
| Database  | PostgreSQL 16 · Flyway migrations             | Azure Database for PostgreSQL                  |
| Ratings   | Python 3.11 · pandas                          | Container Apps Job, daily at 06:00 UTC         |
| Demo      | The backend image under a `demo` profile      | Container App, scales to zero                  |
| CI/CD     | GitHub Actions                                | Builds changed services only, verifies deploys |

See the [architecture notes](docs/architecture.md) for the full design,
[secrets and configuration](docs/secrets.md) for where each secret lives, and the
[roadmap](docs/roadmap.md) for ideas and housekeeping.

The ratings job runs daily but only recalculates when a match has been recorded
since the last run, so running twice for one match night can't zero the weekly
deltas.

## How ratings work

Each player is compared with others in the same position group (defence,
midfield or attack) on four recorded statistics, weighted by position:

|          | Points % | Goals | Clean sheets | Goals conceded |
| -------- | -------- | ----- | ------------ | -------------- |
| Attack   | 50%      | 40%   | 0%           | 10%            |
| Midfield | 50%      | 20%   | 15%          | 15%            |
| Defence  | 50%      | 10%   | 20%          | 20%            |

- Recent appearances count for more (half-life of 40 appearances), and evidence
  from players who stopped turning up fades over time (60 match weeks)
- Ratings are shrunk towards the middle when there's little evidence, and players
  need 20 appearances before they're rated at all
- Ratings are relative, so a player's rating can move after a match even if they
  didn't play, or won

They describe recorded results, not ability: a good night on a losing team doesn't
show up.

## Privacy and security

- A shared access code gates all match data; the backend issues a 30-day member
  token. The code is stored only as a BCrypt hash and attempts are rate-limited.
- Admins sign in with Google; the admin list is configuration, not code.
- Ratings are stripped from API responses for non-admins on the server, not just
  hidden in the page.
- **The demo is isolated by construction.** It runs on its own database, as its own
  database user with no access to real data, and signs tokens with its own secret,
  so demo tokens are rejected by the real backend. It refuses to start unless its
  database name ends in `_demo`, because it wipes that database on every startup.

## Testing

- **Backend**: integration tests against a real PostgreSQL (a local container,
  or a service container in CI). Each run rebuilds the schema from the Flyway
  migrations, so a migration that fails on a fresh database fails the build.
- **Milestones**: the rules are pure Java, unit tested against made-up match
  histories.
- **Ratings**: Python tests, plus the evaluation harness for comparing models.

```bash
cd backend && ./mvnw clean verify -Dspring.profiles.active=test
cd ml-service && python -m pytest tests/
cd ml-service && python -m evaluation.run            # model comparison
cd ml-service && python -m evaluation.chemistry_null # permutation test
```

## Running locally

Prerequisites: Java 21, Node.js 22, Python 3.11, Docker.

```bash
docker compose up -d postgres                         # PostgreSQL only

cd backend && ./mvnw spring-boot:run                  # http://localhost:8080
cd frontend && npm run dev                            # http://localhost:3000
```

The test and demo databases are created automatically on first start. On an
older local volume, create any that are missing:

```bash
docker exec -it mnf-postgres psql -U mnf -d postgres -c "CREATE DATABASE mnfmanager_demo;"
```

Update ratings by hand. It only recalculates if there's a new match; `--force`
overrides:

```bash
docker compose run --rm ratings
```

or, from a Python environment:

```bash
cd ml-service
python3.11 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
DATABASE_URL='postgresql://mnf:mnf_local_password@localhost:5432/mnfmanager' python update_ratings.py
```

Run the demo locally on port 8081, with `NEXT_PUBLIC_DEMO_API_URL=http://localhost:8081`
in `frontend/.env.local`:

```bash
cd backend
SERVER_PORT=8081 SPRING_PROFILES_ACTIVE=demo \
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/mnfmanager_demo \
JWT_SECRET=local-demo-secret-that-is-at-least-32-bytes-long \
./mvnw spring-boot:run
```

### Local secrets

Create `backend/src/main/resources/application-secrets.yml` (gitignored):

```yaml
google:
  client-id: YOUR_GOOGLE_CLIENT_ID

jwt:
  secret: AT_LEAST_32_RANDOM_BYTES

app:
  admin-emails:
    - you@example.com

mnf:
  access-code-hash: BCRYPT_HASH_OF_THE_ACCESS_CODE
```

For the frontend, see the [frontend README](frontend/README.md).

## API

| Method          | Endpoint                                | Description                                        |
| --------------- | --------------------------------------- | -------------------------------------------------- |
| POST            | `/api/v1/access`                        | Exchange the access code for a member token        |
| POST            | `/api/v1/auth/google`                   | Exchange a Google ID token for an admin token      |
| GET             | `/api/v1/players`                       | Active players                                     |
| GET             | `/api/v1/players/all`                   | All players, including inactive                    |
| GET             | `/api/v1/players/{id}/profile`          | Career and season stats                            |
| GET             | `/api/v1/players/{id}/matches`          | Match history by season                            |
| GET             | `/api/v1/players/leaderboard`           | Points %, goals and appearances                    |
| GET             | `/api/v1/players/captains/stats`        | Captain records and match history                  |
| POST/PUT/DELETE | `/api/v1/players…`                      | Manage players (admin)                             |
| GET             | `/api/v1/matches`                       | All matches                                        |
| GET             | `/api/v1/matches/{id}/detail`           | Teams, scorers and result                          |
| POST/PUT        | `/api/v1/matches…`                      | Record and edit matches (admin)                    |
| GET             | `/api/v1/dashboard/stats`               | Current captain and unbeaten streaks               |
| POST            | `/api/v1/draft/preferences/{captainId}` | How often each player has been on a captain's team |
| POST            | `/api/v1/draft/captain-recommendations` | Who should captain next                            |
| POST            | `/api/v1/draft/milestones`              | Milestones, streaks and pair records for a squad   |
| POST            | `/api/v1/demo/enter`                    | Demo sign-in (demo deployment only)                |

## Trade-offs

- **Cold starts.** The backend and demo scale to zero, so the first request after
  a quiet spell waits 20–30 seconds. For a group that meets once a week, that
  was worth the running cost it saves.
- **Database networking.** The database accepts connections from Azure services
  rather than sitting behind a private endpoint, which would mean rebuilding the
  Container Apps environment with VNet integration. With TLS enforced and separate
  least-privilege users for the demo, this was a deliberate choice.
- **Rate limiting is per replica.** Access-code attempts are counted in memory,
  which only holds while the backend runs a single replica.

## Status

In weekly use and in maintenance mode: the planned work is done.
