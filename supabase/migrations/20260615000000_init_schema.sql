-- ============================================================================
-- Fantasy League Tracking System — V1 schema
-- Tables, helper functions, triggers, RLS policies, and reporting views
-- implementing the domain model described in plan.md.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  email text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Keep a profile row in sync with auth.users on signup.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', new.email),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- leagues
-- ----------------------------------------------------------------------------

create function public.generate_invite_code()
returns text
language sql
as $$
  select substr(md5(random()::text || clock_timestamp()::text), 1, 8);
$$;

create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active' check (status in ('active', 'closed', 'deleted')),
  invite_code text not null unique default public.generate_invite_code(),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.leagues enable row level security;

-- ----------------------------------------------------------------------------
-- league_memberships
-- ----------------------------------------------------------------------------

create table public.league_memberships (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('admin', 'player')),
  created_at timestamptz not null default now(),
  unique (league_id, user_id)
);

alter table public.league_memberships enable row level security;

-- ----------------------------------------------------------------------------
-- matches
-- ----------------------------------------------------------------------------

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues (id) on delete cascade,
  match_date date not null,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (league_id, match_date)
);

alter table public.matches enable row level security;

-- ----------------------------------------------------------------------------
-- stat_submissions
-- ----------------------------------------------------------------------------

create table public.stat_submissions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  player_id uuid not null references public.profiles (id) on delete cascade,
  submitted_by uuid not null references public.profiles (id),
  goals integer not null default 0 check (goals >= 0),
  assists integer not null default 0 check (assists >= 0),
  result text not null check (result in ('win', 'loss', 'draw')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, player_id)
);

alter table public.stat_submissions enable row level security;

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger stat_submissions_set_updated_at
  before update on public.stat_submissions
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Membership helper functions (security definer to avoid recursive RLS)
-- ----------------------------------------------------------------------------

create function public.is_league_member(p_league_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.league_memberships
    where league_id = p_league_id and user_id = auth.uid()
  );
$$;

create function public.is_league_admin(p_league_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.league_memberships
    where league_id = p_league_id and user_id = auth.uid() and role = 'admin'
  );
$$;

-- Look up an active league by invite code without requiring membership.
create function public.get_league_by_invite_code(p_invite_code text)
returns table (id uuid, name text)
language sql
security definer
set search_path = ''
stable
as $$
  select id, name from public.leagues
  where invite_code = p_invite_code and status = 'active';
$$;

-- ----------------------------------------------------------------------------
-- leagues policies
-- ----------------------------------------------------------------------------

create policy "Members can view their leagues"
  on public.leagues for select
  to authenticated
  using (public.is_league_member(id));

create policy "Authenticated users can create leagues"
  on public.leagues for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "Admins can update their league"
  on public.leagues for update
  to authenticated
  using (public.is_league_admin(id))
  with check (public.is_league_admin(id));

-- ----------------------------------------------------------------------------
-- league_memberships policies
-- ----------------------------------------------------------------------------

create policy "Members can view memberships in their leagues"
  on public.league_memberships for select
  to authenticated
  using (public.is_league_member(league_id));

-- The league creator adds themselves as the first admin.
create policy "League creator can add themselves as first admin"
  on public.league_memberships for insert
  to authenticated
  with check (
    role = 'admin'
    and user_id = auth.uid()
    and exists (
      select 1 from public.leagues l
      where l.id = league_id and l.created_by = auth.uid()
    )
    and not exists (
      select 1 from public.league_memberships m where m.league_id = league_id
    )
  );

-- Anyone can join an active league as a player (after resolving an invite code).
create policy "Users can join active leagues as players"
  on public.league_memberships for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and role = 'player'
    and exists (select 1 from public.leagues l where l.id = league_id and l.status = 'active')
  );

-- Admins manage memberships (add/remove players, promote/demote admins).
create policy "Admins can manage memberships"
  on public.league_memberships for all
  to authenticated
  using (public.is_league_admin(league_id))
  with check (public.is_league_admin(league_id));

-- Admin safety rule: a league must always retain at least one admin.
create function public.enforce_admin_safety()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  remaining_admins integer;
  league_status text;
begin
  if (tg_op = 'DELETE' and old.role = 'admin')
     or (tg_op = 'UPDATE' and old.role = 'admin' and new.role <> 'admin') then

    select status into league_status from public.leagues where id = old.league_id;

    -- Skip the check while the league itself is being torn down.
    if league_status <> 'deleted' then
      select count(*) into remaining_admins
      from public.league_memberships
      where league_id = old.league_id and role = 'admin' and id <> old.id;

      if remaining_admins = 0 then
        raise exception 'A league must always have at least one admin';
      end if;
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger enforce_admin_safety_trigger
  before update or delete on public.league_memberships
  for each row execute function public.enforce_admin_safety();

-- League deletion: status -> 'deleted' purges matches/memberships (and, via
-- cascade, stat_submissions). The league row itself is kept with status
-- 'deleted' so leaderboard/history references don't dangle.
create function public.handle_league_deletion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'deleted' and old.status <> 'deleted' then
    delete from public.matches where league_id = new.id;
    delete from public.league_memberships where league_id = new.id;
  end if;
  return new;
end;
$$;

create trigger handle_league_deletion_trigger
  after update on public.leagues
  for each row execute function public.handle_league_deletion();

-- ----------------------------------------------------------------------------
-- matches policies
-- ----------------------------------------------------------------------------

create policy "Members can view matches"
  on public.matches for select
  to authenticated
  using (public.is_league_member(league_id));

-- Matches can only be created/edited/deleted by admins, and only while the
-- league is active.
create policy "Admins can manage matches in active leagues"
  on public.matches for all
  to authenticated
  using (
    public.is_league_admin(league_id)
    and exists (select 1 from public.leagues l where l.id = league_id and l.status = 'active')
  )
  with check (
    public.is_league_admin(league_id)
    and exists (select 1 from public.leagues l where l.id = league_id and l.status = 'active')
  );

-- ----------------------------------------------------------------------------
-- stat_submissions policies
-- ----------------------------------------------------------------------------

create policy "Members can view submissions in their league"
  on public.stat_submissions for select
  to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.is_league_member(m.league_id)
    )
  );

-- Players submit their own stats; submission starts pending and the match's
-- league must be active.
create policy "Players can submit their own stats"
  on public.stat_submissions for insert
  to authenticated
  with check (
    player_id = auth.uid()
    and submitted_by = auth.uid()
    and status = 'pending'
    and exists (
      select 1 from public.matches m
      join public.leagues l on l.id = m.league_id
      where m.id = match_id and l.status = 'active' and public.is_league_member(m.league_id)
    )
  );

-- Players can freely edit their own pending submissions.
create policy "Players can edit their own pending submissions"
  on public.stat_submissions for update
  to authenticated
  using (player_id = auth.uid() and status = 'pending')
  with check (player_id = auth.uid() and submitted_by = auth.uid() and status = 'pending');

-- Players can request an edit on an approved submission, which reopens it
-- into pending state for re-approval.
create policy "Players can request edits on approved submissions"
  on public.stat_submissions for update
  to authenticated
  using (player_id = auth.uid() and status = 'approved')
  with check (player_id = auth.uid() and submitted_by = auth.uid() and status = 'pending');

-- Admins manage all submissions for matches in leagues they administer
-- (approve/reject/edit/revert). Admin-created submissions are auto-approved
-- by the application layer.
create policy "Admins can manage submissions in their league"
  on public.stat_submissions for all
  to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.is_league_admin(m.league_id)
    )
  )
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.is_league_admin(m.league_id)
    )
  );

-- ----------------------------------------------------------------------------
-- Reporting views (security_invoker so caller's RLS applies)
-- ----------------------------------------------------------------------------

-- Per-member league leaderboard: totals + final rating from approved stats.
create view public.league_leaderboard
with (security_invoker = true) as
select
  lm.league_id,
  lm.user_id,
  p.name,
  p.avatar_url,
  count(ss.id) filter (where ss.status = 'approved') as matches_played,
  coalesce(sum(ss.goals) filter (where ss.status = 'approved'), 0) as goals,
  coalesce(sum(ss.assists) filter (where ss.status = 'approved'), 0) as assists,
  coalesce(count(*) filter (where ss.status = 'approved' and ss.result = 'win'), 0) as wins,
  coalesce(count(*) filter (where ss.status = 'approved' and ss.result = 'loss'), 0) as losses,
  coalesce(count(*) filter (where ss.status = 'approved' and ss.result = 'draw'), 0) as draws,
  coalesce(sum(
    case when ss.status = 'approved'
      then ss.goals * 2 + ss.assists * 1 + (case when ss.result = 'win' then 5 else 0 end)
      else 0
    end
  ), 0) as total_points,
  case when count(ss.id) filter (where ss.status = 'approved') = 0 then 0
    else coalesce(sum(
      case when ss.status = 'approved'
        then ss.goals * 2 + ss.assists * 1 + (case when ss.result = 'win' then 5 else 0 end)
        else 0
      end
    ), 0)::numeric / count(ss.id) filter (where ss.status = 'approved')
  end as final_rating
from public.league_memberships lm
join public.profiles p on p.id = lm.user_id
left join public.matches m on m.league_id = lm.league_id
left join public.stat_submissions ss on ss.match_id = m.id and ss.player_id = lm.user_id
group by lm.league_id, lm.user_id, p.name, p.avatar_url;

-- Per-match MVP(s): highest points, then result (win > draw > loss), then
-- goals, then assists. Ties produce multiple rows for the same match.
create view public.match_mvps
with (security_invoker = true) as
with scored as (
  select
    ss.match_id,
    ss.player_id,
    ss.goals,
    ss.assists,
    ss.result,
    ss.goals * 2 + ss.assists * 1 + (case when ss.result = 'win' then 5 else 0 end) as points,
    case ss.result when 'win' then 2 when 'draw' then 1 else 0 end as result_rank
  from public.stat_submissions ss
  where ss.status = 'approved'
),
ranked as (
  select
    scored.*,
    rank() over (
      partition by match_id
      order by points desc, result_rank desc, goals desc, assists desc
    ) as mvp_rank
  from scored
)
select match_id, player_id, points, goals, assists
from ranked
where mvp_rank = 1;
