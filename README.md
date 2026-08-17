# MNF Manager

![CI](https://github.com/K-Vasantharajah/mnf-manager/actions/workflows/ci.yml/badge.svg)
![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Kafka](https://img.shields.io/badge/Kafka-7.6-red)

Monday Night Football draft and match prediction platform.

A full-stack analytics application for tracking player statistics,
predicting draft selections, analysing team chemistry, and forecasting
match outcomes — built as a Moneyball-style decision support system
for a weekly 9-a-side football session.

## Architecture

See the [system architecture diagram](docs/architecture.md) for the full design — planned before a single line of code was written.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 · TypeScript · Tailwind CSS · React Query |
| Backend | Java 21 · Spring Boot 3 · Spring Data JPA |
| Database | PostgreSQL 16 · Flyway migrations |
| Messaging | Apache Kafka |
| Security | Spring Security · JWT · Google OAuth 2.0 |
| Infrastructure | Docker · Testcontainers · GitHub Actions |

## Key Features

- **Player profiles** with ability, reliability, and goal threat ratings
- **Reliability score** — the metric that predicts results better than goals alone
- **Draft intelligence engine** — predicts captain pick order based on historical behaviour
- **Match prediction engine** — win probability based on team composition and chemistry
- **Season stats** — goals, assists, win rate tracked per season
- **Chemistry analysis** — best and worst player partnerships

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

Backend runs on `http://localhost:8080`
Frontend runs on `http://localhost:3000`
Kafka UI runs on `http://localhost:8090`

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/players` | Get all active players |
| GET | `/api/v1/players/{id}` | Get player by id |
| POST | `/api/v1/players` | Create a player |
| PUT | `/api/v1/players/{id}` | Update a player |
| DELETE | `/api/v1/players/{id}` | Deactivate a player |
| POST | `/api/v1/players/{id}/ratings` | Add or update player ratings |
| GET | `/api/v1/players/{id}/stats` | Get calculated player stats |

## Project Status

Currently in active development. Backend Player Service complete. Match Service, Draft Intelligence Engine, and Prediction Engine in progress.