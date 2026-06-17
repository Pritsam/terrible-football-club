# Feature Checklist

Step-by-step build plan for the Fantasy League Tracking System (V1), derived from `plan.md`. Mark items `[x]` as they're completed. Keep this in sync with `PROGRESS.md`.

## 1. Project Setup

- [x] Next.js (App Router) + TypeScript + Tailwind scaffold
- [x] ESLint + Prettier configured
- [x] shadcn/ui (Nova preset) installed
- [x] Zod + React Hook Form installed
- [x] Pitch-themed design system (`globals.css`, fonts, backdrop)
- [ ] Docker / Docker Compose for local dev

## 2. Supabase Setup

- [x] Local Supabase CLI config (`supabase/config.toml`)
- [x] Supabase client/server/middleware helpers (`src/lib/supabase/*`)
- [x] Session-refresh middleware (`src/middleware.ts`)
- [x] DB schema migration: profiles, leagues, league_memberships, matches, stat_submissions
- [x] RLS policies for all tables
- [x] `league_leaderboard` view (point system + final rating)
- [x] `match_mvps` view (MVP logic)
- [x] Admin-safety trigger (league always has >= 1 admin)
- [x] League-deletion trigger (purges matches/memberships on delete)
- [x] Schema applied to hosted Supabase project (`upxtoabbikplrousvuuv`)
- [x] Security advisor warnings addressed (search_path, RPC exposure)
- [ ] Google OAuth credentials configured (Google Cloud Console + Supabase env vars)

## 3. Authentication

- [x] `/login` page (email/password)
- [x] `/signup` page (email/password)
- [x] "Continue with Google" UI (scaffolded, needs real OAuth credentials)
- [x] `/auth/callback` OAuth callback route
- [x] Server actions: login, signup, signInWithGoogle, logout
- [x] Authenticated dashboard placeholder (`/`, welcome + sign-out)
- [ ] Profile page (view/edit name, avatar)

## 4. League Management

- [x] Create league (admin becomes first member automatically)
- [x] List leagues the user belongs to (dashboard)
- [x] League detail page stub (overview; leaderboard/matches in next PR)
- [x] Join league via invite code
- [x] Join league via invite link (`/join/[code]` style route)
- [x] Display/copy invite code & invite link (admin view)
- [x] League settings: close league (read-only state)
- [x] League settings: delete league (cascades per schema trigger)
- [x] Membership management: list members, roles
- [x] Promote/demote admin (enforcing "at least one admin" rule)
- [x] Remove player (preserve historical stats)

## 5. Match System

- [x] Create match (admin only, one per date per league, active leagues only)
- [x] List matches in a league
- [x] Match detail page (submissions, MVP)
- [x] Edit match date (admin)
- [x] Delete match (admin) — cascades submissions, recalculates leaderboard/MVPs

## 6. Stat Submission & Approval

- [ ] Player: submit own stats for a match (goals, assists, result) — one per player per match
- [ ] Player: edit pending submission
- [ ] Player: request edit on approved submission (reopens to pending)
- [ ] Admin: create submission for any player (auto-approved)
- [ ] Admin: approve submission
- [ ] Admin: reject submission (with required rejection reason)
- [ ] Admin: directly edit/revert approved submission (no re-approval needed)
- [ ] Pending-approvals queue/view for admins
- [ ] Validation: no duplicates, no negative values, valid result enum

## 7. Leaderboard & Stats

- [ ] League leaderboard UI (ranked by final rating, then goals) — backed by `league_leaderboard` view
- [ ] Player stats display: goals, assists, wins, losses, draws, matches played, total points, final rating, MVP count
- [ ] Match MVP display — backed by `match_mvps` view
- [ ] Leaderboard updates reflected immediately after approval/edit/delete/revert

## 8. Testing

- [ ] Vitest + React Testing Library setup
- [ ] Unit tests for point system / final rating / MVP logic
- [ ] Unit tests for validation schemas
- [ ] Playwright setup
- [ ] E2E: login/signup (done ad-hoc, needs formalizing)
- [ ] E2E: league create/join, match + submission flow, leaderboard

## 9. Deployment

- [ ] Vercel project configured
- [ ] Production Supabase env vars wired to Vercel
- [ ] Production build verified (`pnpm build`)

---

## Out of Scope (V1)

Notifications, public leagues, team management, match score tracking, chat/messaging, live updates/WebSockets, advanced analytics, mobile app, push notifications, audit logs, player transfers.
