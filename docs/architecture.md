# MNF Manager — System Architecture

Designed before development began as the blueprint for the full system.

## System Diagram

```mermaid
graph TD
    subgraph Client["Client Layer"]
        FE["Next.js 14\nTypeScript · Tailwind"]
        RQ["React Query\nServer state · caching"]
        AUTH["NextAuth.js\nGoogle OAuth · email login"]
    end

    subgraph Gateway["API Gateway · Spring Boot 3"]
        GW["JWT filter · rate limiting\nCORS · request routing"]
    end

    subgraph Services["Backend Services · Java 21 · Spring Boot 3"]
        PS["Player Service\nProfiles · ratings · stats"]
        MS["Match Service\nResults · scorers · captains"]
        DE["Draft Intelligence Engine\nPick prediction · confidence scores"]
        PE["Prediction Engine\nWin probability · chemistry · team strength"]
    end

    subgraph Messaging["Messaging · Apache Kafka"]
        K1["match.completed"]
        K2["draft.picked"]
        K3["player.rated"]
        SC["Stats Consumer\nAggregates player stats"]
        AU["Audit Logger\nEvent trail"]
    end

    subgraph Data["Data Layer"]
        DB[("PostgreSQL\nPlayers · matches · drafts\nratings · chemistry")]
        FW["Flyway\nVersioned migrations"]
        JPA["Spring Data JPA\nRepositories · entity mapping"]
    end

    subgraph Security["Security"]
        SEC["Spring Security · JWT\nRole-based access"]
        OA["Google OAuth 2.0"]
        TLS["HTTPS · CORS\nEnv secrets"]
    end

    subgraph Infra["Infrastructure · CI/CD"]
        DC["Docker Compose\nLocal development"]
        TC["Testcontainers\nIntegration testing"]
        GA["GitHub Actions\nBuild · test · deploy"]
        AZ["Azure App Service\nAzure PostgreSQL Flexible"]
    end

    FE --> RQ
    FE --> AUTH
    RQ -->|HTTPS REST| GW
    AUTH --> GW

    GW --> PS
    GW --> MS
    GW --> DE
    GW --> PE

    PS -->|player.rated| K3
    MS -->|match.completed| K1
    MS -->|draft.picked| K2

    K1 --> SC
    K2 --> SC
    K3 --> SC
    K1 --> AU

    PS --> JPA
    MS --> JPA
    DE --> JPA
    PE --> JPA

    JPA --> DB
    FW --> DB

    SEC --> GW
    OA --> AUTH
    TLS --> GW

    DC --> DB
    TC --> GA
    GA --> AZ
```

## Key Design Decisions

**Flyway over Hibernate auto-DDL** — every schema change is a versioned migration file. Safe for production, auditable, and reversible.

**Reliability as a first-class metric** — player ratings are deliberately simplified to three scores: ability, reliability, and goal threat. Complex subjective attributes were rejected in favour of fewer, more honest data points. Reliability is hypothesised to be more predictive of match outcomes than raw ability scores alone.

**Kafka from day one** — event-driven architecture is not a v2 addition. Match and draft events flow through Kafka from the first match recorded, giving the system an audit trail and enabling decoupled consumers from the start.

**Set over List for JPA collections** — Hibernate's MultipleBagFetchException is avoided by using Set for all OneToMany relationships, allowing multiple simultaneous JOIN FETCH operations without cartesian product issues.

**Simplified ratings model** — a deliberate decision to avoid FIFA-style multi-attribute complexity. Three meaningful scores per player rather than ten subjective ones means the data is actually filled in accurately and consistently.
