# Architecture

Reference document for Terrible FC — a fantasy league tracker. Read this before implementing any new feature or making structural changes.

---

## Table of Contents

1. [High-Level Overview](#1-high-level-overview)
2. [Deployment Architecture](#2-deployment-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Directory Structure](#4-directory-structure)
5. [Authentication](#5-authentication)
6. [Middleware & Route Protection](#6-middleware--route-protection)
7. [Database Schema](#7-database-schema)
8. [Row Level Security (RLS)](#8-row-level-security-rls)
9. [SECURITY DEFINER Functions](#9-security-definer-functions)
10. [Reporting Views](#10-reporting-views)
11. [Next.js App Structure](#11-nextjs-app-structure)
12. [Server Actions Pattern](#12-server-actions-pattern)
13. [Form Pattern](#13-form-pattern)
14. [Supabase Client Helpers](#14-supabase-client-helpers)
15. [Point System & Scoring](#15-point-system--scoring)
16. [Design System](#16-design-system)
17. [Testing](#17-testing)
18. [Adding a New Feature — Checklist](#18-adding-a-new-feature--checklist)

---

## 1. High-Level Overview

The app is a private fantasy league tracker for a group of friends. Key domain concepts:

- **League** — a group with a name, status (`active` / `closed` / `deleted`), and invite code
- **Membership** — links a user to a league with a role (`admin` or `player`)
- **Match** — a single game day inside a league, identified by date (one per league per day)
- **Stat submission** — a player's goals / assists / result for a match; goes through a pending → approved / rejected approval flow
- **Leaderboard** — ranked standings per league, computed from approved submissions
- **MVP** — highest-scoring player(s) per match, computed from approved submissions

There is no public content. Every page requires authentication. Every query is scoped to leagues the user belongs to.

---

## 2. Deployment Architecture

```
Browser
  │
  ▼
Vercel (Next.js 16, App Router)
  │  Serverless functions — one per route/page
  │  Edge Middleware — session refresh on every request
  │
  ├── Supabase Auth  ──► Google OAuth (via PKCE)
  │
  └── Supabase Database (PostgreSQL)
        ├── Tables: profiles, leagues, league_memberships, matches, stat_submissions
        └── Views:  league_leaderboard, match_mvps
```

**Key deployment facts:**
- Next.js runs on Vercel's serverless infrastructure, not as a long-lived process. Each request is a cold function invocation.
- Supabase is the hosted database and auth service (project ID: `upxtoabbikplrousvuuv`).
- There is no separate API server — all backend logic lives in Next.js Server Actions and Route Handlers.
- Docker Compose exists for optional local dev but is not used in production.

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| UI components | shadcn/ui (Nova preset — Radix UI + Lucide React) |
| Database / Auth | Supabase (PostgreSQL + Supabase Auth) |
| Auth providers | Email/password, Google OAuth (PKCE flow) |
| Forms | React Hook Form + Zod (`zod` pinned to `4.0.17`) |
| Testing | Vitest + React Testing Library (unit), Playwright (E2E) |
| Package manager | pnpm |
| Linting / formatting | ESLint + Prettier |

**Zod pin note:** `zod` is pinned exactly to `4.0.17` via `dependencies` + `pnpm.overrides`. Zod 4.1+ breaks `@hookform/resolvers@5.x` type overloads. Do not upgrade zod until `@hookform/resolvers` publishes a fix.

---

## 4. Directory Structure

```
src/
├── app/                          # Next.js App Router pages and route handlers
│   ├── api/
│   │   └── auth/
│   │       └── google/route.ts   # OAuth initiation route handler
│   ├── auth/
│   │   └── callback/route.ts     # OAuth callback — exchanges code for session
│   ├── join/[code]/page.tsx      # Invite link landing page
│   ├── leagues/
│   │   ├── [id]/
│   │   │   ├── matches/
│   │   │   │   └── [matchId]/page.tsx  # Match detail + submissions
│   │   │   └── page.tsx          # League detail — leaderboard, matches, members
│   │   └── new/page.tsx          # Create league form
│   ├── login/page.tsx
│   ├── profile/page.tsx
│   ├── signup/page.tsx
│   ├── globals.css               # Design system tokens + utility classes
│   ├── layout.tsx                # Root layout — fonts, dark mode, PitchBackdrop
│   └── page.tsx                  # Dashboard — "My Leagues" + join form
│
├── components/
│   ├── auth/                     # Login form, signup form, Google button
│   ├── leaderboard/              # LeaderboardSection (display only)
│   ├── leagues/                  # Create, join, invite, members, settings panels
│   ├── matches/                  # MatchesSection, MatchActions, MatchMvp
│   ├── profile/                  # ProfileForm
│   ├── submissions/              # SubmissionsSection, SubmissionForm
│   ├── ui/                       # shadcn/ui primitives (Button, Card, Field, etc.)
│   ├── pitch-backdrop.tsx        # Decorative diagonal-stripe background
│   └── site-header.tsx           # Top nav — logo + profile/sign-out
│
├── lib/
│   ├── auth/actions.ts           # login, signup, logout server actions
│   ├── leagues/actions.ts        # createLeague, joinLeague, updateMemberRole, etc.
│   ├── matches/actions.ts        # createMatch, updateMatchDate, deleteMatch
│   ├── profile/actions.ts        # updateProfile server action
│   ├── submissions/actions.ts    # submitStats, approveSubmission, rejectSubmission, etc.
│   ├── supabase/
│   │   ├── client.ts             # createBrowserClient (for Client Components)
│   │   ├── server.ts             # createServerClient (for Server Components + Actions)
│   │   └── middleware.ts         # updateSession — session refresh in middleware
│   ├── validations/              # Zod schemas for every form (auth, leagues, matches, etc.)
│   ├── points.ts                 # Pure JS scoring logic (mirrors DB view formulas)
│   └── utils.ts                  # cn() — Tailwind class merger
│
├── __tests__/                    # Vitest unit tests (inside lib/)
└── middleware.ts                  # (at project root, not in src/) — wraps updateSession
```

**Important:** The root-level `middleware.ts` is at `/src/middleware.ts` — check the actual project for the exact path if this moves.

---

## 5. Authentication

### Email / Password

Standard flow: `LoginForm` (Client Component) → React Hook Form validates → Server Action `login()` → `supabase.auth.signInWithPassword()` → on success, the form's `useEffect` calls `router.push("/")`.

### Google OAuth (PKCE)

This flow is more complex because PKCE requires a code verifier cookie to survive the full redirect chain.

```
User clicks "Continue with Google"
        │
        ▼
GoogleButton (Client Component)
  window.location.href = "/api/auth/google"
        │
        ▼
GET /api/auth/google  (Route Handler — src/app/api/auth/google/route.ts)
  createServerClient().signInWithOAuth({ provider: "google", redirectTo: "/auth/callback" })
  → Supabase generates PKCE code verifier, stores it in Set-Cookie header
  → Returns Supabase authorize URL
  Route Handler responds: 307 → Supabase /auth/v1/authorize
  Browser stores the PKCE verifier cookie
        │
        ▼
Supabase /auth/v1/authorize → Google sign-in page
        │
        ▼ (user signs in)
Google → Supabase /auth/v1/callback  (Supabase exchanges with Google)
        │
        ▼
Supabase → GET /auth/callback?code=...  (our app)
  Route Handler reads code from query params
  createServerClient().exchangeCodeForSession(code)
  → Supabase JS reads PKCE verifier cookie, verifies it matches, exchanges code for session
  → Session cookies are set
  307 → /  (dashboard)
```

**Why a Route Handler (not a Server Action) for OAuth initiation:**
Server Actions call Next.js's `redirect()` internally which throws before response cookies are flushed. The PKCE verifier cookie never reaches the browser. A Route Handler returns a real HTTP Response with `Set-Cookie` headers, so the browser stores the cookie before following the redirect.

**Why not the browser client:**
`createBrowserClient` stores the PKCE verifier in `localStorage`. The callback is a server-side Route Handler that uses `createServerClient`, which reads from cookies — it cannot access localStorage. This mismatch causes `exchangeCodeForSession` to fail.

### Session Management

Supabase sessions are stored in cookies (managed by `@supabase/ssr`). Middleware refreshes the session on every request, which re-issues the access token before it expires and keeps Server Components from seeing a stale session.

---

## 6. Middleware & Route Protection

`src/lib/supabase/middleware.ts` — the `updateSession` function:

1. Creates a `createServerClient` that reads/writes cookies from the incoming request
2. Calls `supabase.auth.getUser()` — this validates and refreshes the session
3. If the user is not authenticated AND the path is not public → redirects to `/login`

**Public paths** (no auth required):
```ts
const PUBLIC_PATHS = ["/login", "/signup", "/auth", "/api/auth"];
```

`/api/auth` must be public so `/api/auth/google` (the OAuth initiator) can be reached before the user is authenticated. If you add new unauthenticated routes (e.g. a public landing page), add them here.

The middleware runs on every request matched by the `config.matcher` in the root `middleware.ts`.

---

## 7. Database Schema

All tables are in the `public` schema with RLS enabled.

### profiles
Mirrors `auth.users`. Created automatically by the `handle_new_user` trigger on signup.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | References `auth.users(id)`, cascade delete |
| `name` | text | From Google `full_name` / `name` metadata or email |
| `email` | text NOT NULL | |
| `avatar_url` | text | From Google metadata |
| `created_at` | timestamptz | |

### leagues

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text NOT NULL | |
| `status` | text | `active` / `closed` / `deleted` |
| `invite_code` | text UNIQUE | Auto-generated 8-char hex |
| `created_by` | uuid | References `profiles(id)` |
| `created_at` | timestamptz | |

Setting `status = 'deleted'` triggers `handle_league_deletion`, which purges all matches and memberships (stat_submissions cascade from matches). The league row is kept so history doesn't dangle.

### league_memberships

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `league_id` | uuid | References `leagues(id)`, cascade delete |
| `user_id` | uuid | References `profiles(id)`, cascade delete |
| `role` | text | `admin` / `player` |
| `created_at` | timestamptz | |
| — | UNIQUE | `(league_id, user_id)` — one membership per user per league |

### matches

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `league_id` | uuid | References `leagues(id)`, cascade delete |
| `match_date` | date NOT NULL | |
| `created_by` | uuid | References `profiles(id)` |
| `created_at` | timestamptz | |
| — | UNIQUE | `(league_id, match_date)` — one match per day per league |

### stat_submissions

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `match_id` | uuid | References `matches(id)`, cascade delete |
| `player_id` | uuid | The player these stats are for |
| `submitted_by` | uuid | Who submitted (player or admin) |
| `goals` | integer ≥ 0 | |
| `assists` | integer ≥ 0 | |
| `result` | text | `win` / `loss` / `draw` |
| `status` | text | `pending` / `approved` / `rejected` |
| `rejection_reason` | text | Nullable |
| `reviewed_by` | uuid | Admin who approved/rejected |
| `reviewed_at` | timestamptz | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | Auto-updated by trigger |
| — | UNIQUE | `(match_id, player_id)` — one submission per player per match |

---

## 8. Row Level Security (RLS)

All access is scoped to league membership. Helper functions (`is_league_member`, `is_league_admin`) are `SECURITY DEFINER` to avoid recursive RLS lookups.

### Key rules summary

| Table | Who can SELECT | Who can INSERT | Who can UPDATE | Who can DELETE |
|---|---|---|---|---|
| `profiles` | Any authenticated user | — (trigger only) | Own profile | — |
| `leagues` | Members of that league | Any auth user (via `create_league` RPC) | Admins | — (use `status='deleted'`) |
| `league_memberships` | Members of that league | Creator (first admin) or RPC | Admins | Admins |
| `matches` | Members | Admins (active league only) | Admins (active league only) | Admins (active league only) |
| `stat_submissions` | Members of the league | Players (own, active league) + Admins | Players (own pending) + Admins | Admins |

### Stat submission lifecycle (RLS perspective)

```
Player submits → status = 'pending', player_id = auth.uid() (enforced by RLS)
Admin approves → status = 'approved', reviewed_by/at set
Admin rejects  → status = 'rejected', rejection_reason set
Player edits pending → can update goals/assists/result while status = 'pending'
Player requests re-edit of approved → sets status back to 'pending' (triggers re-review)
Player resubmits rejected → sets status back to 'pending', clears rejection_reason
Admin creates submission for player → inserts with status = 'approved' (auto-approved)
```

---

## 9. SECURITY DEFINER Functions

These functions run with the privileges of the function owner (superuser), bypassing RLS. They are used in two situations:

1. **Bootstrap ordering problems** — RLS on `leagues` requires the user to be a member to SELECT, but the membership row can't be inserted until the league exists. `create_league()` handles both atomically.
2. **Helper predicates used inside RLS policies** — `is_league_member()`, `is_league_admin()`, `get_league_by_invite_code()` must be `SECURITY DEFINER` to query `league_memberships` without triggering the very policies they're used by.

| Function | Purpose |
|---|---|
| `handle_new_user()` | Trigger — creates a `profiles` row on `auth.users` INSERT |
| `create_league(p_name)` | RPC — atomically inserts league + admin membership; returns league ID |
| `join_league_by_invite_code(p_invite_code)` | RPC — validates code, inserts player membership; returns league ID |
| `is_league_member(p_league_id)` | RLS helper — returns bool |
| `is_league_admin(p_league_id)` | RLS helper — returns bool |
| `get_league_by_invite_code(p_invite_code)` | Returns league id/name for an active league by code (no membership required) |
| `generate_invite_code()` | Generates an 8-char hex code for new leagues |
| `enforce_admin_safety()` | Trigger — prevents removing the last admin from a league |
| `handle_league_deletion()` | Trigger — purges matches/memberships when status → 'deleted' |

**Adding new RPCs:** Always use `security definer set search_path = ''` and explicitly schema-qualify all table references (`public.table_name`). Revoke `EXECUTE` from `public`/`anon`/`authenticated` for trigger-only functions (see migration `20260615000001`).

---

## 10. Reporting Views

These views are queried directly from Server Components — never recompute their logic in app code.

### `public.league_leaderboard`

One row per `(league_id, user_id)`. Aggregates approved submissions across all matches in the league.

Key columns: `matches_played`, `goals`, `assists`, `wins`, `losses`, `draws`, `total_points`, `final_rating`, `mvp_count`

**Point formula (same as `points.ts`):**
```
match_points = goals × 2 + assists × 1 + (win ? 5 : 0)
total_points = SUM(match_points) across approved submissions
final_rating = total_points / matches_played
```

Uses `security_invoker = true` so the querying user's RLS applies — users can only see leaderboards for leagues they're members of.

### `public.match_mvps`

One row per MVP player per match (ties produce multiple rows). Only considers approved submissions.

**MVP ranking:** points DESC → result rank (win=2, draw=1, loss=0) DESC → goals DESC → assists DESC

Queried on the match detail page to display MVP badges.

---

## 11. Next.js App Structure

### Server Components (default)

All pages are async Server Components unless they need interactivity. They:
- Fetch data directly via `createClient()` (server Supabase client)
- Call `supabase.auth.getUser()` to get the current user (not `getSession()` — getSession can be spoofed client-side)
- Pass data down to Client Components as props
- Do parallel data fetching with `Promise.all()`

### Client Components (`"use client"`)

Used only when interactivity is required: forms with validation, confirm dialogs, copy buttons, toggles. They receive all data as props from the Server Component above.

### Route Handlers

| Route | Purpose |
|---|---|
| `GET /api/auth/google` | Initiates Google OAuth — sets PKCE cookie, redirects to Supabase |
| `GET /auth/callback` | Exchanges OAuth code for session after Google sign-in |

### URL structure

| URL | Description |
|---|---|
| `/` | Dashboard — user's leagues |
| `/login` | Sign in |
| `/signup` | Create account |
| `/profile` | Edit name and avatar |
| `/leagues/new` | Create a league |
| `/leagues/[id]` | League detail — leaderboard, matches, members |
| `/leagues/[id]/matches/[matchId]` | Match detail — submissions, MVP |
| `/join/[code]` | Invite link landing page |

---

## 12. Server Actions Pattern

All mutations are Server Actions in `src/lib/<domain>/actions.ts`. Every action follows this contract:

```ts
"use server";

export type SomeActionResult = { error: string } | undefined;

export async function doSomething(
  _prevState: SomeActionResult,
  formData: FormData,
): Promise<SomeActionResult> {
  // 1. Validate inputs with Zod
  const parsed = schema.safeParse({ field: formData.get("field") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // 2. Get authenticated user
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { error: "Not authenticated." };

  // 3. Perform the mutation
  const { error } = await supabase.from("table").insert({ ... });
  if (error) return { error: error.message };

  // 4. On success: redirect (never return success — just navigate)
  redirect("/destination");
}
```

**Return type convention:**
- `undefined` — no state yet (initial render)
- `{ error: string }` — validation or DB error to display
- Never `{ success: true }` from actions that redirect — use `redirect()` directly

**Exception:** `login` and `signup` return `{ success: true }` instead of calling `redirect()` because the form uses `useActionState` + RHF `handleSubmit`, and `redirect()` inside a Server Action called via that pattern gets swallowed. The form's `useEffect` watches for `state.success` and calls `router.push("/")`.

---

## 13. Form Pattern

All forms use React Hook Form + Zod client-side validation, with the validated data dispatched to a Server Action.

```tsx
"use client";

const form = useForm<Schema>({ resolver: zodResolver(schema) });
const [state, formAction, isPending] = useActionState(serverAction, undefined);

const onValid = (data: Schema) => {
  const fd = new FormData();
  fd.append("field", data.field);
  startTransition(() => formAction(fd));
};

<form onSubmit={form.handleSubmit(onValid)}>
  <FieldGroup>
    <FieldLabel htmlFor="field">Label</FieldLabel>
    <Input id="field" {...form.register("field")} />
    <FieldError>{form.formState.errors.field?.message}</FieldError>
  </FieldGroup>
  {state?.error && <FieldError role="alert">{state.error}</FieldError>}
  <Button type="submit" disabled={isPending}>Submit</Button>
</form>
```

**Key points:**
- RHF validates client-side before the Server Action is called
- `FormData` is built manually in `onValid` — do not pass RHF values as-is to the action
- Use `Field` / `FieldGroup` / `FieldLabel` / `FieldError` from `src/components/ui/field.tsx`, not the old `form` component
- Server-returned errors appear via `state?.error` with `role="alert"` for accessibility

---

## 14. Supabase Client Helpers

Three different clients for three different contexts — never mix them up.

| File | Function | Used in | Behaviour |
|---|---|---|---|
| `src/lib/supabase/client.ts` | `createBrowserClient()` | Client Components | Reads/writes cookies in the browser |
| `src/lib/supabase/server.ts` | `createServerClient()` | Server Components, Server Actions, Route Handlers | Reads/writes cookies via Next.js `cookies()` |
| `src/lib/supabase/middleware.ts` | `updateSession()` | Root `middleware.ts` | Refreshes session from request/response cookies |

**Always call `supabase.auth.getUser()` (not `getSession()`) to get the current user in server code.** `getSession()` reads from the cookie without re-validating against Supabase's server — it can be spoofed. `getUser()` makes a network call to verify.

---

## 15. Point System & Scoring

The scoring formula is defined in two places that must stay in sync:

1. **`src/lib/points.ts`** — pure TypeScript, used for unit tests and any client-side preview
2. **`supabase/migrations/…_init_schema.sql`** — SQL in the `league_leaderboard` and `match_mvps` views

```
match_points  = (goals × 2) + (assists × 1) + (result === 'win' ? 5 : 0)
total_points  = SUM(match_points) over all approved submissions
final_rating  = total_points / matches_played   (0 if no matches)
```

**MVP tiebreaker** (applied per match, from approved submissions):
1. Most points
2. Best result (win > draw > loss)
3. Most goals
4. Most assists
5. Ties at all levels → multiple MVPs

If you change the point formula, update **both** `points.ts` and the SQL views in a new migration.

---

## 16. Design System

Configured in `src/app/globals.css` with CSS custom properties and Tailwind v4 utilities.

### Theme

Dark-only (`dark` class on `<html>`). The palette uses oklch colour space for perceptually uniform pitch greens.

| Token | Usage |
|---|---|
| `--color-primary` | Pitch green — CTAs, active badges, highlights |
| `--color-background` | Near-black page background |
| `--color-card` | Slightly lighter card surface |
| `--color-muted` | Subtle UI chrome, secondary text |
| `--color-foreground` | Primary text |

### Typography

| Variable | Font | Usage |
|---|---|---|
| `--font-display` | Anton | Headings — use via `font-heading` Tailwind class |
| `--font-sans` | Geist | Body text, UI |
| `--font-geist-mono` | Geist Mono | Code/numbers |

All page headings use `font-heading text-3xl tracking-wide uppercase`.

### Utilities

| Class | Effect |
|---|---|
| `animate-fade-up` | Staggered entrance animation |
| `bg-pitch-stripes` | Diagonal stripe pattern (used on `PitchBackdrop`) |

### Components

shadcn/ui Nova preset. Key additions beyond shadcn defaults:

- `Field`, `FieldGroup`, `FieldLabel`, `FieldError`, `FieldSeparator` — form layout primitives (use these, not the shadcn `form` component)
- `PitchBackdrop` — full-screen decorative background rendered in the root layout

---

## 17. Testing

### Unit tests — Vitest

Located in `src/lib/__tests__/`. Run with `pnpm test`.

Covers:
- `points.test.ts` — 22 tests for `calculatePoints`, `calculateFinalRating`, `getMvps`
- `validations.test.ts` — 22 tests for all Zod schemas

When adding new pure logic (point formula changes, new validation rules), add unit tests here.

### E2E tests — Playwright

Located in `e2e/`. Run with `pnpm exec playwright test`.

Covers:
- `auth.spec.ts` — login, signup, logout, Google OAuth PKCE flow
- `dashboard.spec.ts` — My Leagues page rendering
- `league.spec.ts` — create league, validation, invite link, leaderboard

E2E tests run against the dev server (`pnpm dev`) which must be pointed at the **hosted Supabase project** (not local) for tests that require Google OAuth or a real test user account. The test account is `test@tfc.com` / `123456`.

**Google OAuth E2E test** (`auth.spec.ts` — "Google OAuth button initiates PKCE flow via route handler"):
- Clicks the button, waits for navigation to `accounts.google.com`
- Verifies the route handler returned a 307
- Verifies the PKCE verifier cookie (`sb-...-auth-token-code-verifier`) is set in the browser

---

## 18. Adding a New Feature — Checklist

Use this as a mental model when implementing anything new.

### 1. Does it need a DB change?

- Write a new migration file in `supabase/migrations/` with the next timestamp
- Enable RLS on any new table
- Add RLS policies following the existing pattern (member-scoped SELECT, admin-scoped mutations)
- Apply to the hosted project via `supabase db push` or the Supabase SQL Editor
- If the feature has aggregation/ranking logic, consider whether a new view belongs in the migration

### 2. Does it need new validation?

- Add a Zod schema in `src/lib/validations/<domain>.ts`
- Add unit tests in `src/lib/__tests__/validations.test.ts`

### 3. Does it need a Server Action?

- Add to `src/lib/<domain>/actions.ts` following the action pattern in §12
- Validate with Zod → verify auth → mutate → redirect on success, return `{ error }` on failure
- If it requires bypassing RLS (bootstrap problem), write a `SECURITY DEFINER` RPC instead and call it via `supabase.rpc()`

### 4. Does it need a new page?

- Create `src/app/<path>/page.tsx` as an async Server Component
- Fetch all data with `Promise.all()` at the top of the component
- Pass data down to Client Components as props — keep data fetching in the Server Component
- Add the path to `PUBLIC_PATHS` in middleware only if it should be accessible without auth

### 5. Does it need new UI?

- Build in `src/components/<domain>/`
- Use `"use client"` only if the component needs interactivity
- Use `Field`/`FieldGroup`/`FieldLabel`/`FieldError` for any form fields
- Follow the dark pitch-green theme; use `font-heading` for display text
- Use `animate-fade-up` with staggered `animation-delay` for page sections

### 6. Does it need a Route Handler?

- Only for: OAuth flows, webhooks, or any endpoint that needs to set cookies before redirecting
- Use `createClient()` from `src/lib/supabase/server.ts`
- Ensure the path is in `PUBLIC_PATHS` in middleware if it must be reachable unauthenticated

### 7. Test coverage

- Pure logic → Vitest unit test in `src/lib/__tests__/`
- New page/flow → Playwright E2E test in `e2e/`
