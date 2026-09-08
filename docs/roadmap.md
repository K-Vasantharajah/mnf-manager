# MNF Manager — Product Roadmap

## What's been built

### Core platform ✅
- Full match recording with team composition, goal scorers and own goals
- Exhibition match support — excluded from all competitive statistics
- Game week auto-calculation and season filtering
- Edit match feature with stat reversal and recalculation
- Score validation — blocks submission if goals don't match score
- Team size limit — maximum 9 players per team

### Player management ✅
- 67 players across two seasons (40 active, 27 inactive)
- Player profiles with career stats, pt% and season breakdown
- Position tracking with filter by position group
- Edit player profile — name, position, strong foot, active status
- Subjective ratings — ability, reliability, goal threat
- Player match history — click season row to view all matches
- Own goal tracking — excluded from player goal tallies

### Leaderboard ✅
- Points percentage: (W×3 + D×1) / (MP×3) × 100
- Minimum match threshold (14 season, 28 all time)
- Expandable modals for full rankings
- Clickable player names navigate to profile

### Captain stats ✅
- Pt% per captain with W/D/L record
- Most picked players (captain excluded from own list)
- Match history modal per captain
- Unbeaten streak tracking — season and all time

### Dashboard ✅
- Current winning captain and unbeaten streak
- Season longest streak and all time record
- Top performers — pt% leader, top scorer, most played
- Recent match results in GW format

### Data ✅
- 57 matches imported (28 × 2025, 29 × 2026)
- 195 goal scorer records
- 7 historical own goals recorded
- Excel import endpoint for bulk data loading

### Testing ✅
- 52 integration tests running against real PostgreSQL
- Service layer, domain logic and HTTP layer covered
- Tests run in CI via GitHub Actions on every push

---

## Up next

### Derived ratings algorithm
Replace subjective ratings with data-driven scores:

**Goal threat** — goals per game relative to squad average. Top scorers get higher ratings automatically.

**Reliability** — matches attended / total matches available during active period. Objective, automatically updated, impossible to game.

**Ability** — composite of win rate + goal contribution + defensive record. Weighted and normalised across the squad.

All ratings auto-recalculated after each match is recorded.

---

### Draft prediction engine
**Problem:** Draft pick order is confidential — captains jumble names after selection so players aren't disheartened by their pick position.

**Solution:** Infer draft preference from team co-occurrence data.
- Track how many times Player X appears on Captain A's team
- Calculate co-occurrence rate: appearances on captain's team / total matches captained
- Players with 80%+ rate are near-certain early picks
- Players with 20% or below are likely avoided picks
- At scale, noise averages out and preference patterns emerge clearly

**Why this works:** Consistent team selection across many matches is a stronger signal than a single pick order data point.

**Known limitation:** Cannot distinguish early picks from late picks — only that a player consistently ends up on that captain's team.

**Exception:** Kobi has kept a personal record of his own draft pick order when captaining. This can be imported later to validate the co-occurrence model.

---

### Match prediction engine
Real-time win probability as teams are drafted:
- Publish pick events to Kafka as the draft progresses
- Prediction engine consumes events and updates win probability
- Output: predicted score, win probability per team, key player matchups
- Powered by historical team composition and chemistry data

---

### Authentication and authorisation (pre-deployment)
Required before Azure deployment:
- Spring Security JWT authentication
- Google OAuth 2.0 login via NextAuth.js
- Role-based access: ADMIN and USER roles
- Admin-only features: delete match, manage players
- Protected API endpoints

---

## Future features

### Goals against analysis
Track which defensive combinations concede the most goals.
- Identify players who concede most when on the pitch
- Identify vulnerable defensive setups for opposing captains to target
- Feeds into draft simulator recommendations

### First pick advantage analysis
Does picking first actually correlate with winning?
- The challenging captain picks first — is this a meaningful advantage?
- If first-picking captain wins >50% significantly, weight the prediction engine accordingly

### Captain preference tracking
For each captain, rank all players by co-occurrence rate.
- Display as "most likely picks" in the draft simulator with confidence percentages
- Akshay example: consistently picked Kobi first in Season 2025

### Goalkeeper tracking
Track who played in goal per match.
- Nimanka was dedicated goalkeeper, now rotates
- Enables goals conceded per goalkeeper analysis
- Feeds into defensive strength calculations

### Live draft assistant
Real-time pick suggestions during the actual Monday night draft.
- Input: captains and available players
- Output: ranked pick suggestions with reasoning
- Updates in real time as picks are made via Kafka events

### Player availability tracking
Track who is available each week before the draft.
- Reduces uncertainty in draft prediction
- Enables "who should I pick given tonight's availability" queries

### Team balancing recommendations
Given a pool of available players, suggest the most balanced two teams.
- Uses derived ratings and historical co-occurrence data
- Output: two balanced squads with predicted match outcome

### AI generated match reports
Post-match narrative generated from match data.
- "Kobi's team dominated with a high-reliability defensive core"
- "Ibrahim's individual brilliance couldn't overcome collective reliability deficit"

### Azure deployment
- Azure App Service + Azure PostgreSQL Flexible Server
- GitHub Actions auto-deploy on push to main
- Password protected until ready for public access

---

## MNF Rules Reference

### Captaincy system
- The winning captain retains captaincy the following week
- The winning captain picks second (challenging captain picks first)
- On a draw: both captains return the following week, pick order reverses
- If the winning captain is absent: the most recent winning captain resumes when they return
- Streaks carry forwards through absences

### Streak definitions
- Undefeated streak: consecutive matches as captain without a loss (draws count)
- Winning streak: consecutive wins as captain (draws break the streak)
- Dashboard shows undefeated streak as primary metric

### Points percentage
- Formula: (Wins × 3 + Draws × 1) / (Matches × 3) × 100
- Primary ranking metric across leaderboard, player profiles and captain stats
- Minimum 14 matches for season rankings, 28 for all time

### Exhibition matches
- Prefixed with EX (EX1, EX2 etc.)
- Played when there are last minute dropouts (8v8 or 8v9)
- Excluded from all competitive statistics
- Only 9v9 matches count towards rankings