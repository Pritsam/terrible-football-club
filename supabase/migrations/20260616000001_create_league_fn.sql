-- Atomic league creation: inserts league + admin membership in one transaction.
-- SECURITY DEFINER bypasses RLS for the insert pair, auth.uid() enforces auth.
-- Revoke from anon/public so only authenticated users can call this via RPC.

create or replace function public.create_league(p_name text)
  returns uuid
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_user_id uuid;
  v_league_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_league_id := gen_random_uuid();

  insert into public.leagues (id, name, created_by)
  values (v_league_id, p_name, v_user_id);

  insert into public.league_memberships (league_id, user_id, role)
  values (v_league_id, v_user_id, 'admin');

  return v_league_id;
end;
$$;

revoke execute on function public.create_league(text) from public, anon;
grant execute on function public.create_league(text) to authenticated;
