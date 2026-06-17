create or replace function public.join_league_by_invite_code(p_invite_code text)
  returns uuid
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_user_id uuid;
  v_league_id uuid;
  v_already_member boolean;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select id into v_league_id
  from public.leagues
  where invite_code = p_invite_code and status = 'active';

  if v_league_id is null then
    raise exception 'Invalid or expired invite code';
  end if;

  select exists(
    select 1 from public.league_memberships
    where league_id = v_league_id and user_id = v_user_id
  ) into v_already_member;

  if v_already_member then
    raise exception 'already_member';
  end if;

  insert into public.league_memberships (league_id, user_id, role)
  values (v_league_id, v_user_id, 'player');

  return v_league_id;
end;
$$;

revoke execute on function public.join_league_by_invite_code(text) from public, anon;
grant execute on function public.join_league_by_invite_code(text) to authenticated;
