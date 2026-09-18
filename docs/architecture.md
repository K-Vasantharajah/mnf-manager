# MNF Manager — System Architecture

## System Diagram

```mermaid
graph TD
    subgraph Client["Client Layer"]
        FE["Next.js · TypeScript · Tailwind"]
        RQ["React Query · server state · caching"]
        AUTH["Google OAuth 2.0 · JWT · localStorage"]
    end

    subgraph Backend["Backend · Java 21 · Spring Boot 3"]
        SEC["Spring Security · JWT filter · CORS"]
        PS["Player Service\nProfiles · stats · leaderboard"]
        MS["Match Service\nResults · scorers · captains · dashboard"]
        AC["Auth Controller\nGoogle token verification · JWT issue"]
        DC["Draft Controller\nML proxy · security boundary"]
    end

    subgraph ML["ML Service · Python · Flask"]
        IM["Impact Model\nRidge regression α=50"]
        RA["Ratings\nAttack · defence · reliability"]
        CH["Chemistry\nPairwise win rate vs expected"]
        DR["Draft Simulator\nCo-occurrence · win probability"]
    end

    subgraph Data["Data Layer"]
        DB[("PostgreSQL 16\nPlayers · matches · ratings\nseason stats · goal scorers")]
        FW["Flyway · V1–V9 migrations"]
        JPA["Spring Data JPA · repositories"]
    end

    subgraph Infra["Infrastructure · CI/CD"]
        DC2["Docker Compose · local development"]
        TC["Testcontainers · 71 integration tests"]
        GA["GitHub Actions · build · test"]
        AZ["Azure Container Apps\nAzure PostgreSQL Flexible Server\nAzure Static Web Apps"]
    end

    FE --> RQ
    RQ -->|HTTPS REST| SEC
    FE -->|Google ID token| AC
    AC -->|JWT| FE

    SEC --> PS
    SEC --> MS
    SEC --> DC

    DC -->|proxy| DR
    DC -->|proxy| CH

    PS --> JPA
    MS --> JPA
    JPA --> DB
    FW --> DB

    IM --> RA
    IM --> DR
    RA -->|weekly POST| MS
    CH --> DR
    ML --> DB

    DC2 --> DB
    TC --> GA
    GA --> AZ
```

## Key Design Decisions

**Flyway over Hibernate auto-DDL** — every schema change is a versioned migration file (V1–V9). Safe for production, auditable, and reversible.

**ML service behind Spring Boot proxy** — the frontend never calls the Python service directly. All ML endpoints are proxied through `DraftController`, keeping the security boundary at the Spring layer and preventing unauthenticated access to the model.

**Ridge regression over subjective ratings** — adjusted plus-minus style impact model controls for teammate quality. A player's attack rating reflects their contribution to goals scored after accounting for who else was on the pitch. Minimum 10 appearances threshold — null is more honest than a floor value.

**Points percentage over win rate** — (W×3 + D) / (MP×3) × 100 rewards draws appropriately and matches the football points system the players already understand.

**Set over List for JPA collections** — Hibernate's MultipleBagFetchException is avoided by using Set for all OneToMany relationships, allowing multiple simultaneous JOIN FETCH operations without cartesian product issues.

**Stateless JWT authentication** — no server-side session state. Google OAuth exchanges an ID token for a signed JWT; the JWT is stored in localStorage and sent via Axios interceptor on every request. Admin access is controlled by an email whitelist in application-secrets.yml.

**Chemistry caching** — pairwise chemistry, impact model, and ratings all cache their results in module-level variables. A `force_refresh` parameter allows the weekly ratings update to bust the cache without restarting the service.