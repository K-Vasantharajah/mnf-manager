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

- Player profiles with career stats, pt% and season breakdown
- Position tracking with filter by position group
- Edit player profile — name, position, strong foot, active status
- Player match history — click season row to view all matches
- Own goal tracking — excluded from player goal tallies

### ML ratings ✅

- Ridge regression adjusted plus-minus impact model (α=50)
- Attack and defence on a shared centred scale, so one player's outlier result
  no longer rescales everyone else's rating
- Position-weighted overall rating
- Reliability rating from attendance rate, scaled separately
- Minimum 10 appearances — below that, no rating rather than a floor value
- Delta tracking between updates
- Currently visible to admins only while the model is reworked

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

### Access and privacy ✅

- Shared access code gates all match data, exchanged for a 30-day member token
- BCrypt-hashed code held in an environment variable, rate limited per IP
- Google OAuth 2.0 for admins, with the admin list supplied by the environment
- Ratings stripped from API responses for non-admins, not just hidden in the UI
- Public privacy notice with a route to request correction or removal
- Public story page explaining what the ratings do and don't measure
- Search engine indexing disabled

### Deployment ✅

- Azure Container Apps for frontend, backend and ML service
- Azure Container Registry, PostgreSQL Flexible Server, custom domain with TLS
- Secrets held as Container App secrets rather than baked into images
- GitHub Actions: tests on every push, deploy to Azure on merge to main
- Only the services that changed are rebuilt; images tagged with the commit SHA

### Testing ✅

- 74 integration tests running against a real PostgreSQL instance
- Service layer, domain logic, HTTP layer and access rules covered
- Tests gate deployment — a failure blocks the release

---

## Up next

### Ratings V2

The current model measures impact on results, which isn't the same as ability,
and the draft's alternating pick order means late picks share teammates in ways
the regression struggles to separate. Planned work:

- Model opposition strength, so conceding against a strong attack differs from
  conceding against a weak one
- Include a challenger-side term, since the first-pick advantage belongs to the
  draft rather than to individual players
- Surface confidence, marking players with sparse or highly correlated line-ups
  as provisional rather than assigning an authoritative-looking number
- Validate against held-out weeks, and against simulated players whose true
  skill is known, before releasing ratings to the group

### Component refactor

Break the larger page components into reusable pieces.

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
- If it is, both the prediction engine and the ratings model should account for it

### Goalkeeper tracking

Track who played in goal per match.

- Enables goals conceded per goalkeeper analysis
- Feeds into defensive strength calculations

### Player availability tracking

Track who is available each week before the draft.

- Reduces uncertainty in draft prediction
- Enables "who should I pick given tonight's availability" queries

### Draft simulator pitch view

- Top-down SVG with formation slots
- Players animate into position as they are picked
- Chemistry badges and win probability panel alongside the pitch

### AI generated match reports

Post-match narrative generated from match data.

---

## Operational improvements

- Run the ML service under gunicorn rather than Flask's development server
- Reduce backend logging from DEBUG to INFO in production
- Schedule the weekly ratings update rather than running it manually
- Move the database behind a private endpoint, which needs the Container Apps
  environment rebuilt with VNet integration

---

## MNF Rules Reference

### Captaincy system

- The winning captain retains captaincy the following week
- The winning captain picks second (challenging captain picks first), and picks
  alternate from there
- On a draw: both captains return the following week, pick order reverses
- If the winning captain is absent: the most recent winning captain resumes when
  they return
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
