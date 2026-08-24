# MNF Manager — Product Roadmap

## Core intelligence features

### Draft prediction engine
**Problem:** Draft pick order is confidential — captains jumble names after selection so players aren't disheartened by their pick position.

**Solution:** Infer draft preference from team co-occurrence data.
- Track how many times Player X appears on Captain A's team
- Calculate co-occurrence rate: appearances on captain's team / total matches captained
- Players with 80%+ rate are near-certain early picks
- Players with 20% or below are likely avoided picks
- At scale, noise averages out and preference patterns emerge clearly

**Why this works:** Consistent team selection across many matches is a stronger signal than a single pick order data point. A captain who always picks the same 3-4 players regardless of who else is available is revealing their true preferences.

**Known limitation:** Cannot distinguish early picks from late picks — only that a player consistently ends up on that captain's team.

**Exception:** Kobi has kept a personal record of his own draft pick order when captaining. This can be imported later to validate the co-occurrence model.

---

### Goals against analysis
**Problem:** Goals scored tells half the story — who concedes matters as much as who scores.

**Feature:** Track which defensive combinations concede the most goals.
- When a goal is recorded, we know the scorer and the opposing team's players
- Over time, identify which defensive setups are most/least vulnerable
- Identify players who concede the most when on the pitch

**Use case for draft simulator:** A captain who knows certain defensive combinations are vulnerable can target them during team building. Picking a high goal threat player against a weak defensive setup is a high-value move.

---

### Reliability score — derived from attendance
**Current approach:** Subjective rating (1-10) assigned by Kobi.

**Better approach:** Derive reliability from actual match participation data.
- Reliability = matches played / total matches available during active period
- Objective, automatically updated, impossible to game
- More predictive than a subjective score

**Transition plan:** Once enough historical match data is loaded, calculate derived reliability and compare against subjective ratings. Use derived score as primary metric going forward.

---

### First pick advantage analysis
**Context:** The challenging captain (who won the previous week) picks first in the draft.

**Question:** Does picking first actually correlate with winning?

**Data needed:** Track which captain picked first per match.

**Hypothesis:** If first-picking captain wins significantly more than 50% of the time, the pick order advantage is real and should be weighted in the prediction engine. If it's close to 50/50, team composition and player quality matter more than pick order.

---

### Captain preference tracking
**Insight from Akshay example:** When Akshay was captain last season he consistently picked Kobi first. This kind of preference can be inferred from co-occurrence data even without explicit pick order records.

**Implementation:** For each captain, rank all players by co-occurrence rate. Display as "most likely picks" in the draft simulator with confidence percentages.

---

## Data backlog

### 2025 historical season
- Full season data held by another MNF member in spreadsheets
- Need to build CSV/Excel import endpoint to bulk load historical data
- This will unlock meaningful statistical analysis and trend detection

### 2026 current season
- Weekly results entered manually via the match recording form
- Goal scorers tracked per match
- Building up week by week

---

## Future features

### CSV / Excel import
Allow bulk import of historical match data from spreadsheets.
- Parse player names, match dates, scores, goal scorers
- Map to existing player records by name matching
- Flag unrecognised player names for manual resolution
- Preview import before committing to database

### Goalkeeper tracking
Track who played in goal per match.
- Nim was dedicated goalkeeper until earlier this year
- Now rotates between players
- Enables goals conceded per goalkeeper analysis
- Feeds into defensive strength calculations

### AI generated match reports
Post-match narrative generated from match data.
- "Kobi's team dominated with a high-reliability defensive core"
- "Ibrahim's individual brilliance couldn't overcome collective reliability deficit"

### Live draft assistant
Real-time pick suggestions during the actual Monday night draft.
- Input: captains and available players
- Output: ranked pick suggestions with reasoning
- Updates in real time as picks are made

### Player availability tracking
Track who is available each week before the draft.
- Reduces uncertainty in draft prediction
- Enables "who should I pick given tonight's availability" queries

### Team balancing recommendations
Given a pool of available players, suggest the most balanced two teams.
- Uses ability, reliability, goal threat ratings
- Weighted by historical co-occurrence and chemistry data
- Output: two balanced squads with predicted match outcome