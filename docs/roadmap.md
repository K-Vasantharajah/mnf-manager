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
- 69 players across two seasons
- Player profiles with career stats, pt% and season breakdown
- Position tracking with filter by position group
- Edit player profile — name, position, strong foot, active status
- Player match history — click season row to view all matches
- Own goal tracking — excluded from player goal tallies

### ML ratings ✅
- Ridge regression adjusted plus-minus impact model (α=50)
- Attack and defence ratings on a shared scale — comparable across positions
- Reliability rating from attendance rate scaled independently
- Minimum 10 appearances threshold — below threshold receives NULL
- Weekly delta tracking — shows rating changes since last update
- Ratings updated via protected POST endpoint after each match night

### Leaderboard ✅
- Points percentage: (W×3 + D) / (MP×3) × 100
- Minimum match threshold (14 season, 28 all time)
- ML ratings tables: attack, defence, reliability
- Expandable modals for full rankings
- Clickable player names navigate to profile

### Captain stats ✅
- Pt% per captain with W/D/L record
- Most picked players (captain excluded from own list)
- Match history modal per captain
- Unbeaten streak tracking — season and all time
- Captain rotation recommendations (who should captain next)

### Draft simulator ✅
- Squad selection up to 18 players
- Captain preference recommendations from historical co-occurrence
- Live win probability bar using ridge regression impact coefficients
- Team chemistry scores — pairwise win rate vs expected
- Last-3-players rule auto-assignment
- Undo last pick support

### Chemistry analysis ✅
- Pairwise chemistry scores for all player combinations with 5+ matches together
- Chemistry score = win rate together − average individual win rate
- Team chemistry score for any group of players
- Exposed via draft simulator UI with colour-coded badges

### Dashboard ✅
- Current winning captain and unbeaten streak
- Season longest streak and all time record
- Top performers — pt% leader, top scorer, most played
- Recent match results in GW format

### Authentication ✅
- Google OAuth 2.0 via GoogleIdTokenVerifier
- JWT stateless sessions
- Admin role via email whitelist
- Edit buttons and protected endpoints visible only to admins

### Testing ✅
- 71 integration tests running against real PostgreSQL via Testcontainers
- Service layer, domain logic, HTTP layer and auth covered
- Tests run in CI via GitHub Actions on every push

### Data ✅
- 57 matches imported (28 × 2025, 29 × 2026) + 2 additional 2026 matches
- 195 goal scorer records
- 7 historical own goals recorded

---

## Up next

### Azure deployment
- Azure Container Apps (backend + ML service, scale to zero)
- Azure Static Web Apps (frontend, free tier)
- Azure PostgreSQL Flexible Server (~£12-16/month)
- pg_dump data migration from local PostgreSQL
- GitHub Actions auto-deploy on push to main
- Environment variables and secrets via Azure Key Vault

---

## Future features

### Frontend redesign — football analytics UI
- Dark mode with navy/slate background and neon green accents
- Draft simulator pitch view — top-down SVG with formation slots
- Players animate into position as they are picked
- Chemistry badges and win probability panel alongside the pitch

### Goals against analysis
Track which defensive combinations concede the most goals.
- Identify players who concede most when on the pitch
- Identify vulnerable defensive setups for opposing captains to target
- Feeds into draft simulator recommendations

### First pick advantage analysis
Does picking first actually correlate with winning?
- The challenging captain picks first — is this a meaningful advantage?
- If first-picking captain wins >50% significantly, weight the prediction engine accordingly

### Goalkeeper tracking
Track who played in goal per match.
- Enables goals conceded per goalkeeper analysis
- Feeds into defensive strength calculations

### Player availability tracking
Track who is available each week before the draft.
- Reduces uncertainty in draft prediction
- Enables "who should I pick given tonight's availability" queries

### AI generated match reports
Post-match narrative generated from match data.
- "Kobi's team dominated with a high-reliability defensive core"
- "Ibrahim's individual brilliance couldn't overcome collective reliability deficit"

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