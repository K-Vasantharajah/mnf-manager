# MNF Manager

![CI/CD](https://github.com/K-Vasantharajah/mnf-manager/actions/workflows/ci-cd.yml/badge.svg)
![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)

Monday Night Football analytics and draft prediction platform.

A full-stack analytics application for tracking player statistics, analysing captain performance, and building towards a Moneyball-style decision support system for a weekly 9-a-side football session.

**Live at [mnfmanager.app](https://mnfmanager.app)** — match data sits behind a shared access code, since the app holds real players' records. The [story page](https://mnfmanager.app/story) and [privacy notice](https://mnfmanager.app/privacy) are public.

## Architecture

See the [system architecture diagram](docs/architecture.md) for the full design.

## Tech Stack

| Layer          | Technology                                        |
| -------------- | ------------------------------------------------- |
| Frontend       | Next.js · TypeScript · Tailwind CSS · React Query |
| Backend        | Java 21 · Spring Boot 3 · Spring Data JPA         |
| ML Service     | Python 3 · Flask · scikit-learn · pandas          |
| Database       | PostgreSQL 16 · Flyway migrations                 |
| Security       | Spring Security · JWT · Google OAuth 2.0          |
| Testing        | Testcontainers · JUnit 5 · MockMvc                |
| Infrastructure | Docker · GitHub Actions CI/CD                     |

## Features

### Match Management

- Record and edit matches with full team composition and goal scorers
- Own goal tracking — excluded from player goal tallies
- Exhibition match support — excluded from competitive statistics
- Game week auto-calculation (GW1, GW2... EX1 for exhibition)
- Season filtering (2025, 2026, All time)
- Score validation — warns if goals attributed don't match final score
- Match detail modal with team lists, goal scorers and OG indicators

### Player Management

- 69 players across two seasons including historical players
- Player profiles with career stats, season breakdown and pt%
- Position tracking (GK, CB, LB, RB, CDM, CM, CAM, LW, RW, ST)
- Edit player profile — name, position, strong foot, active status
- Player match history — click any season row to see all matches
- Show/hide inactive players toggle
- Filter by position group (GK, Defence, Midfield, Attack)

### ML ratings

- Ridge regression adjusted plus-minus impact model (α=50)
- Attack and defence on a shared centred scale: the group average sits at 5.5, each standard deviation of impact moves the rating by 1.5
- Position-weighted overall rating, capped at 65/35 either way
- Reliability from attendance rate, scaled separately
- Minimum 10 appearances — below that, no rating rather than a floor value
- Delta tracking between updates
- Ratings visible to admins only while the model is being reworked

### Leaderboard

- Points percentage ranking: (W×3 + D) / (MP×3) × 100
- Minimum match threshold (14 for season, 28 for all time)
- Goals scored and matches played tables
- ML ratings tables: attack, defence, reliability
- Expandable modals for full rankings
- Clickable player names navigate to profile

### Captain Stats

- Points percentage and win/draw/loss record per captain
- Most picked players per captain
- Match history modal per captain
- Unbeaten streak tracking (season and all time)
- Current winning captain on dashboard
- Captain rotation recommendations (who should captain next)

### Draft Simulator

- Squad selection (up to 18 players)
- Captain preference recommendations based on historical co-occurrence
- Live win probability bar using ridge regression impact coefficients
- Team chemistry scores — pairwise win rate vs expected
- Last-3-players rule auto-assignment
- Undo last pick support

### Dashboard

- Squad size, season match count, current winning captain
- Current unbeaten streak and season longest streak
- All time longest unbeaten streak
- Season top performers: pt% leader, top scorer, most played
- Recent match results

### Authentication and access

- Shared access code gates all match data; the backend issues a 30-day member JWT
- BCrypt-hashed code, read from an environment variable, rate-limited to 5 attempts per IP per 15 minutes
- Google OAuth 2.0 for admins, with the admin list in `ADMIN_EMAILS`
- Ratings stripped from API responses for non-admins, not just hidden in the UI

## Data

Two seasons of match data, collected weekly since 2025: team compositions,
scores, goal scorers and own goals. Exhibition matches are recorded but
excluded from competitive statistics and ratings.

## Getting Started

### Prerequisites

- Java 21
- Maven 3.9+
- Node.js 22+
- Python 3.11+
- Docker Desktop

### Running locally

Start the infrastructure:

```bash
docker compose up -d
```

Create the test database (first time only):

```bash
docker exec -it mnf-postgres psql -U mnf -d mnfmanager -c "CREATE DATABASE mnfmanager_test;"
```

Start the backend:

```bash
cd backend
mvn spring-boot:run
```

Start the ML service:

```bash
cd ml-service
pip install -r requirements.txt
flask run --port 5001
```

Start the frontend:

```bash
cd frontend
npm run dev
```

- Backend: `http://localhost:8080`
- ML service: `http://localhost:5001`
- Frontend: `http://localhost:3000`

### Secrets

Create `backend/src/main/resources/application-secrets.yml` (gitignored):

```yaml
google:
  client-id: YOUR_GOOGLE_CLIENT_ID

jwt:
  secret: YOUR_JWT_SECRET

admin:
  emails:
    - your@email.com
```

## Testing

74 integration tests running against a real PostgreSQL instance via Testcontainers:

```bash
cd backend
./mvnw test
```

Tests cover:

- Player service (create, update, deactivate, profile, leaderboard, match history)
- Match service (create, update, detail, season filtering, captain stats, dashboard stats)
- Player and Match controllers (HTTP layer, auth, 403 responses)

## API Endpoints

### Players

| Method | Endpoint                         | Description                               |
| ------ | -------------------------------- | ----------------------------------------- |
| GET    | `/api/v1/players`                | Get all active players                    |
| GET    | `/api/v1/players/all`            | Get all players including inactive        |
| GET    | `/api/v1/players/{id}`           | Get player by id                          |
| POST   | `/api/v1/players`                | Create a player (admin)                   |
| PUT    | `/api/v1/players/{id}`           | Update player profile (admin)             |
| DELETE | `/api/v1/players/{id}`           | Deactivate a player (admin)               |
| GET    | `/api/v1/players/{id}/profile`   | Full profile with career and season stats |
| GET    | `/api/v1/players/{id}/matches`   | Player match history by season            |
| GET    | `/api/v1/players/leaderboard`    | Rankings with pt%, goals, matches played  |
| GET    | `/api/v1/players/captains/stats` | Captain stats with match history          |

### Matches

| Method | Endpoint                          | Description                              |
| ------ | --------------------------------- | ---------------------------------------- |
| GET    | `/api/v1/matches`                 | Get all matches                          |
| POST   | `/api/v1/matches`                 | Record a new match (admin)               |
| PUT    | `/api/v1/matches/{id}`            | Update a match (admin)                   |
| GET    | `/api/v1/matches/{id}/detail`     | Full match detail with teams and scorers |
| GET    | `/api/v1/matches/stats/dashboard` | Captain streak and dashboard stats       |

### ML Service

| Method | Endpoint                                | Description                   |
| ------ | --------------------------------------- | ----------------------------- |
| POST   | `/api/v1/draft/preferences/{captainId}` | Captain pick preferences      |
| POST   | `/api/v1/draft/predict`                 | Match outcome prediction      |
| POST   | `/api/v1/draft/captain-recommendations` | Captain rotation suggestions  |
| GET    | `/api/v1/draft/chemistry`               | All pairwise chemistry scores |
| GET    | `/api/v1/draft/chemistry/player/{id}`   | Player chemistry scores       |
| POST   | `/api/v1/draft/chemistry/team`          | Team chemistry score          |

### Auth

| Method | Endpoint              | Description                      |
| ------ | --------------------- | -------------------------------- |
| POST   | `/api/v1/auth/google` | Exchange Google ID token for JWT |

## Notes on the ratings model

The model estimates each player's contribution to goals scored and conceded, controlling for who else was on the pitch. It measures impact on results rather than individual ability, and with a small squad and non-random team selection it can't fully separate the two. Teams are picked by captains in alternating order, so players picked late tend to share teammates, which the regression struggles to untangle.

Known limitations, and what's being done about them, are the current focus: opposition strength isn't yet in the model, and rating uncertainty isn't surfaced.

## Infrastructure trade-offs

The database allows connections from Azure services rather than sitting behind a private endpoint, which would need the Container Apps environment rebuilt with VNet integration. Given non-sensitive data, a rotated password and enforced TLS, this was a deliberate trade-off rather than an oversight.

## Project Status

Deployed and in weekly use by the group. Running on Azure Container Apps with GitHub Actions deploying on merge to main. Current work: reworking the ratings model to account for opposition strength and draft-order bias before ratings are shown to all members.
