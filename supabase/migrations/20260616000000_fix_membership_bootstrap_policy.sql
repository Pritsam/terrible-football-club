-- Fix self-comparison bug in the membership bootstrap RLS policy.
-- The original policy had `m.league_id = m.league_id` (always true),
-- which blocked all first-admin inserts whenever any memberships existed.

drop policy if exists "League creator can add themselves as first admin" on public.league_memberships;

create policy "League creator can add themselves as first admin"
  on public.league_memberships
  for insert
  to authenticated
  with check (
    role = 'admin'
    and user_id = auth.uid()
    and exists (
      select 1 from public.leagues l
      where l.id = league_memberships.league_id
        and l.created_by = auth.uid()
    )
    and not exists (
      select 1 from public.league_memberships m
      where m.league_id = league_memberships.league_id
    )
  );
