# Fantasy League Tracking System — Business Requirements (V1)

## 1. Overview

A private fantasy-style league management web application where real players track their real match performances.

Players join leagues, submit their own match stats, and compete on a dynamically calculated leaderboard.

The system is built around:

- Self-reported player stats
- Admin approval/moderation
- Dynamic rankings based on average performance

---

# 2. Authentication

Users can authenticate using:

- Google Login
- Email & Password

Each user contains:

- Name
- Email
- Profile image
- Unique user ID

A user can:

- Create multiple leagues
- Join multiple leagues

---

# 3. League System

## League Creation

- Any authenticated user can create a league.
- The creator automatically becomes an admin.

## League Joining

Leagues are private and can be joined using:

- Invite code
- Invite link

## League States

### Active

- Matches can be created
- Stats can be submitted
- Leaderboards update normally

### Closed

- Read-only state
- No new matches or submissions allowed

### Deleted

- Permanently removes:
  - Matches
  - Stats
  - Memberships
  - Leaderboard data

---

# 4. Roles

## Admin

Admins can:

- Create/edit/delete matches
- Add/remove players
- Promote/remove admins
- Approve/reject submissions
- Edit/delete stats
- Revert incorrect data
- Close/delete leagues

## Player

Players can:

- View leaderboard and match history
- Submit their own stats
- Edit pending submissions
- Request edits for approved submissions

Restrictions:

- Players cannot submit stats for others
- Players cannot approve submissions
- Players cannot directly edit approved stats

## Admin Safety Rule

- Every league must always have at least one admin.

---

# 5. Match System

## Match Rules

- Matches are created only by admins.
- Each match contains only:
  - Match date
- Only one match can exist per date within a league.

## Participation

A player is considered part of a match once they submit stats for that match.

---

# 6. Stat Submission & Approval

## Submission Rules

Players/admins can submit:

- Goals
- Assists
- Match result:
  - Win
  - Loss
  - Draw

Each player can only have one submission per match.

---

## Approval Flow

### Player Submission

- Enters pending state
- Does not affect leaderboard until approved

### Admin Submission

- Automatically approved

### Admin Actions

Admins can:

- Approve submissions
- Reject submissions

Rejected submissions:

- Can be edited and resubmitted
- Must contain a rejection reason

---

# 7. Stat Editing Rules

## Pending Submission

Players can edit freely.

## Approved Submission

### Player Edit Request

- Reopens submission into pending state
- Requires approval again

### Admin Direct Edit

- Updates immediately
- Does not require approval

---

# 8. Player Statistics

The system tracks:

- Goals
- Assists
- Wins
- Losses
- Draws
- Matches Played
- MVPs
- Total Points
- Final Rating

---

# 9. Point System

| Action | Points |
| ------ | ------ |
| Goal   | 2      |
| Assist | 1      |
| Win    | 5      |

Draws and losses provide:

- 0 points

Points are dynamically recalculated from approved stats.

---

# 10. Final Rating Formula

The leaderboard is based on average performance to ensure fairness for players with different match counts.

## Formula

```txt
Final Rating = Total Points / Matches Played
```

If:

```txt
Matches Played = 0
```

Then:

```txt
Final Rating = 0
```

---

# 11. MVP Logic

MVP is automatically calculated for each match.

## MVP Priority Rules

1. Highest match points
2. Better match result:

```txt
Win > Draw > Loss
```

3. Higher goals scored
4. Higher assists

If all values remain equal:

- Multiple MVPs are allowed

---

# 12. Leaderboard Rules

## Ranking Priority

1. Highest Final Rating
2. Highest goals scored

Leaderboard updates immediately after:

- Submission approval
- Stat edits
- Match deletion
- Data revert

---

# 13. Match & Data Deletion Rules

## Match Deletion

Deleting a match:

- Deletes all related submissions
- Recalculates leaderboard immediately
- Recalculates MVPs immediately

## Player Removal

Removing a player:

- Removes future league access
- Preserves historical stats and match history

---

# 14. Validation Rules

The system must prevent:

- Duplicate matches
- Duplicate submissions
- Negative values
- Invalid stat combinations
- Invalid match states

---

# 15. Audit & History

- No audit logs/history tracking in V1
- Admins can manually correct/revert data

---

# 16. Expected Scale

Typical league expectations:

- 10–14 players
- 5–7 matches per month

No hard limits enforced in V1.

---

# 17. Out of Scope (V1)

The following are excluded from V1:

- Notifications
- Public leagues
- Team management
- Match score tracking
- Chat/messaging
- Live updates/WebSockets
- Advanced analytics
- Mobile app
- Push notifications
- Audit logs
- Player transfers

---

# 18. Core Product Principles

The platform is based on:

- Self-reported stats
- Admin moderation
- Dynamic leaderboard calculation
- Fair average-based ranking system

# Technology Stack

## Core

- Next.js (App Router)
- TypeScript
- Node.js

## Styling

- Tailwind CSS
- shadcn/ui
- Lucide React

## Backend & Database

- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage (future use if required)
- Supabase Realtime disabled for V1

## Authentication

Supported authentication methods:

- Google OAuth
- Email and Password

Authentication should be implemented using Supabase Auth.

## Forms & Validation

- React Hook Form
- Zod

## Testing

Unit Tests:

- Vitest
- React Testing Library

End-to-End Tests:

- Playwright

All new business logic and reusable components should be covered by tests where practical.

## Code Quality

- ESLint
- Prettier

## Package Manager

- pnpm

## Containerization

- Docker
- Docker Compose for local development

## Deployment

- Vercel for application hosting
- Supabase for database and authentication services

# Development Preferences

- Use Next.js App Router.
- Prefer Server Components by default.
- Use Client Components only when interactivity is required.
- Keep business logic on the server.
- Prefer Server Actions for mutations.
- Use TypeScript strict mode.
- Prefer composition over inheritance.
- Avoid introducing additional dependencies unless necessary.
- Keep the architecture simple and easy to maintain.
- Build mobile-first and responsive interfaces.
- Prioritize readability and correctness over premature optimizations.

# Instructions for Claude

- Think through the implementation before generating code.
- Follow existing project conventions and folder structure.
- Do not introduce new libraries without explaining why they are needed.
- Generate production-ready TypeScript code.
- Prefer simple, explicit solutions over abstractions.
- Include error handling, loading states, and empty states when building features.
- Consider accessibility and responsive design by default.
