-- ============================================================================
-- Harden function security per Supabase advisor recommendations:
-- - Pin search_path on plain (non security-definer) functions
-- - Trigger-only functions should not be exposed via the PostgREST RPC API
-- ============================================================================

create or replace function public.generate_invite_code()
returns text
language sql
set search_path = ''
as $$
  select substr(md5(random()::text || clock_timestamp()::text), 1, 8);
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.enforce_admin_safety() from public, anon, authenticated;
revoke execute on function public.handle_league_deletion() from public, anon, authenticated;
