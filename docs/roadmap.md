# MNF Manager — Roadmap

## Status

In weekly use and in maintenance mode. The planned work is done; the items
below are ideas, not commitments.

## What's built

### Core platform

- Match recording with teams, goal scorers and own goals
- Exhibition matches, excluded from all competitive statistics
- Game week auto-calculation and season filtering
- Match editing with stat reversal and recalculation
- Score validation: goals must match the final score
- Team size limit of 9 per side

### Players

- Profiles with career and season stats and points percentage
- Position tracking, with filtering by position group
- Profile editing: name, position, strong foot, active status
- Match history per season

### Ratings

- Percentile model: players compared within their position group on points %,
  goals, clean sheets and goals conceded, weighted by position
- Recency weighting (form and staleness), shrinkage for thin evidence, and a
  20-appearance minimum
- 60–95 scale, with reliability (attendance) kept separate
- Updated by a daily scheduled job that only runs when there's a new match
- Admin-only for now

### Leaderboard and captains

- Points %: (W×3 + D) / (MP×3) × 100, with minimum match thresholds
- Goals and appearances tables
- Captain records, most-picked players, match history and unbeaten streaks
- Captain rotation recommendations

### Draft simulator

- Squad and captain selection
- Positional balance check per side, with average rating for admins
- How often each player has ended up on the current captain's team, with counts
  and a minimum-history threshold
- _On the night_: appearance, goal and captaincy milestones, win, scoring,
  unbeaten and attendance streaks, and pair records

### Demo

- Public, self-resetting demo with an invented group and full admin access
- Isolated by construction: own database, own database user, own JWT secret

### Access and privacy

- Shared access code for members; Google OAuth for admins
- Ratings stripped server-side for non-admins
- Public privacy notice and story page; search indexing disabled

### Deployment

- Azure Container Apps; backend and demo scale to zero
- GitHub Actions builds only the services that changed, deploys on merge to main,
  and verifies each deploy

## Removed, and why

- **Match prediction.** An evaluation harness found no model predicted results
  better than chance. Replaced by the balance check.
- **Chemistry scores.** A permutation test found them indistinguishable from luck.
  Pair records remain as plain facts.
- **The always-on ML service.** Nothing live needed it once prediction went.
  Draft queries moved into the backend; ratings became a scheduled job.

## Answered questions

- **Is picking first an advantage?** No. The challenging captain wins 40.6% of
  decisive matches.
- **Which defensive combinations concede most?** Not answerable at this scale:
  the chemistry permutation test showed combination effects are indistinguishable
  from noise.

## Ideas

### Ratings visible to all members

Remove the admin-only restriction (server-side serializer and UI condition), with
a short "how ratings work" explainer, an updated privacy notice, and a decision
on letting players opt out.

### Centre-back check in the balance panel

The balance check groups positions into defence, midfield and attack, so three
full-backs and no centre-back reads as balanced. Warn when one side has a
centre-back or goalkeeper and the other doesn't.

### Suppress deltas after a position change

Changing a player's position compares them with a different group, and the jump
appears as that week's delta, which reads as if it came from the match. Skip
deltas for players whose position changed since the last update.

### Goalkeeper tracking

Record who played in goal each match, for goals conceded per goalkeeper.

### Player availability

Record who's available before the draft, so the simulator starts from tonight's
actual squad.

### Draft pitch view

A top-down pitch with formation slots that fill as players are picked.

### Match reports

A short post-match summary generated from the recorded match.

## Housekeeping

- Check exhibition game-week numbering: `createMatch` always assigns `GW`
  numbers, while exhibitions were historically `EX`
- Give services a `java.time.Clock`, so tests can fix "today" rather than
  computing seasons relative to it
- Run the ML tests in CI, and remove the unused Testcontainers dependency (tests
  use a local or CI service container)
- Consider renaming `ml-service/` to reflect what it now holds
- Move the database behind a private endpoint, which needs the Container Apps
  environment rebuilt with VNet integration
- Give the rating opt-out its own admin endpoint and a checkbox in the UI. For
  now an admin sets it with
  `UPDATE players SET rating_hidden = true WHERE name = '...';`. It's
  deliberately not part of the general player edit, which would clear it.

## MNF rules reference

### Captaincy

- The winning captain keeps the captaincy the following week
- The challenging captain picks first; picks alternate from there
- On a draw, both captains return the following week and pick order reverses
- If the winning captain is absent, the most recent winning captain resumes when
  they return
- Streaks carry forward through absences

### Streaks

- Unbeaten streak: consecutive matches as captain without a loss (draws count)
- Winning streak: consecutive wins as captain (draws break it)
- The dashboard shows the unbeaten streak as its primary metric

### Points percentage

- (Wins × 3 + Draws) / (Matches × 3) × 100
- The primary ranking metric across the leaderboard, profiles and captain stats
- Minimum 14 matches for season rankings, 28 for all time

### Exhibition matches

- Played when last-minute dropouts leave 8v8 or 8v9
- Excluded from all competitive statistics; only 9v9 matches count
