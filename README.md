# MNF Manager

![CI](https://github.com/K-Vasantharajah/mnf-manager/actions/workflows/ci.yml/badge.svg)
![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)

Monday Night Football analytics and draft prediction platform.

A full-stack analytics application for tracking player statistics, analysing captain performance, and building towards a Moneyball-style decision support system for a weekly 9-a-side football session.

## Architecture

See the [system architecture diagram](docs/architecture.md) for the full design.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 · TypeScript · Tailwind CSS · React Query |
| Backend | Java 21 · Spring Boot 3 · Spring Data JPA |
| Database | PostgreSQL 16 · Flyway migrations |
| Messaging | Apache Kafka (draft simulator and match prediction engine) |
| Security | Spring Security · JWT · Google OAuth 2.0 (planned pre-deployment) |
| Testing | Testcontainers · JUnit 5 · MockMvc |
| Infrastructure | Docker · GitHub Actions CI/CD |

## Current Features

### Match Management
- Record and edit matches with full team composition and goal scorers
- Own goal tracking — excluded from player goal tallies
- Exhibition match support — excluded from competitive statistics
- Game week auto-calculation (GW1, GW2... EX1 for exhibition)
- Season filtering (2025, 2026, All time)
- Score validation — warns if goals attributed don't match final score
- Match detail modal with team lists, goal scorers and OG indicators

### Player Management
- 67 players across two seasons including historical players
- Player profiles with career stats, season breakdown and pt% 
- Position tracking (GK, CB, LB, RB, CDM, CM, CAM, LW, RW, ST)
- Edit player profile — name, position, strong foot, active status
- Edit subjective ratings — ability, reliability, goal threat
- Player match history — click any season row to see all matches
- Show/hide inactive players toggle
- Filter by position group (GK, Defence, Midfield, Attack)

### Leaderboard
- Points percentage ranking: (W×3 + D×1) / (MP×3) × 100
- Minimum match threshold (14 for season, 28 for all time)
- Goals scored and matches played tables with no threshold
- Subjective ratings tables (ability, reliability, goal threat)
- Expandable modals for full rankings
- Clickable player names navigate to profile

### Captain Stats
- Win/draw/loss record and pt% per captain
- Most picked players (captain excluded from own list)
- Match history modal per captain
- Unbeaten streak tracking (season and all time)
- Current winning captain on dashboard

### Dashboard
- Squad size, season match count, current winning captain
- Current unbeaten streak and season longest streak
- All time longest unbeaten streak (Akshay — 15 matches)
- Season top performers: pt% leader, top scorer, most played
- Recent match results in GW format

### Data Import
- Excel import endpoint for bulk historical data loading
- 57 matches imported across Season 2025 and 2026
- 195 goal scorer records
- Exhibition match auto-detection from EX-prefixed game weeks

## Data

- **Season 2025** — 28 matches (including 3 exhibition)
- **Season 2026** — 29 matches (including 1 exhibition), ongoing
- **67 players** — 40 active, 27 inactive historical players
- **7 historical own goals** recorded

## Getting Started

### Prerequisites
- Java 21
- Maven 3.9+
- Node.js 22+
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

Start the frontend:
```bash
cd frontend
npm run dev
```

- Backend: `http://localhost:8080`
- Frontend: `http://localhost:3000`

## Testing

52 integration tests running against a real PostgreSQL instance via Testcontainers:

```bash
cd backend
mvn test
```

Tests cover:
- Player service (create, rate, deactivate, profile, leaderboard)
- Match service (create, update, detail, season filtering, captain stats)
- Player and Match controllers (HTTP layer via MockMvc)

## API Endpoints

### Players
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/players` | Get all active players |
| GET | `/api/v1/players/all` | Get all players including inactive |
| GET | `/api/v1/players/{id}` | Get player by id |
| POST | `/api/v1/players` | Create a player |
| PUT | `/api/v1/players/{id}` | Update player profile |
| DELETE | `/api/v1/players/{id}` | Deactivate a player |
| POST | `/api/v1/players/{id}/ratings` | Update player ratings |
| GET | `/api/v1/players/{id}/profile` | Full profile with career and season stats |
| GET | `/api/v1/players/{id}/matches` | Player match history by season |
| GET | `/api/v1/players/leaderboard` | Rankings with pt%, goals, matches played |
| GET | `/api/v1/players/captains/stats` | Captain stats with match history |

### Matches
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/matches` | Get all matches |
| POST | `/api/v1/matches` | Record a new match |
| PUT | `/api/v1/matches/{id}` | Update a match |
| GET | `/api/v1/matches/{id}/detail` | Full match detail with teams and scorers |
| GET | `/api/v1/matches/stats/dashboard` | Captain streak and dashboard stats |

### Import
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/import/excel` | Import matches from Excel spreadsheet |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/dashboard/stats` | Aggregated dashboard statistics |

## Roadmap

See [docs/roadmap.md](docs/roadmap.md) for planned features including:
- Derived ratings algorithm from match data
- Draft simulator using team co-occurrence analysis
- Azure deployment with Spring Security JWT authentication
- Chemistry analysis — best and worst player partnerships

## Project Status

Active development. Core platform fully functional with two seasons of historical data loaded. Authentication and deployment planned as next major milestone.