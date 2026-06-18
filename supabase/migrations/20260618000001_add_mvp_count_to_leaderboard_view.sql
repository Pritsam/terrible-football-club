-- Recreate league_leaderboard view adding mvp_count column
create or replace view public.league_leaderboard
  with (security_invoker = true)
as
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
      then ss.goals * 2 + ss.assists + case when ss.result = 'win' then 5 else 0 end
      else 0
    end
  ), 0) as total_points,
  case
    when count(ss.id) filter (where ss.status = 'approved') = 0 then 0::numeric
    else coalesce(sum(
      case when ss.status = 'approved'
        then ss.goals * 2 + ss.assists + case when ss.result = 'win' then 5 else 0 end
        else 0
      end
    ), 0)::numeric / count(ss.id) filter (where ss.status = 'approved')::numeric
  end as final_rating,
  coalesce((
    select count(*)
    from public.match_mvps mv
    join public.matches m2 on m2.id = mv.match_id
    where mv.player_id = lm.user_id and m2.league_id = lm.league_id
  ), 0) as mvp_count
from public.league_memberships lm
join public.profiles p on p.id = lm.user_id
left join public.matches m on m.league_id = lm.league_id
left join public.stat_submissions ss on ss.match_id = m.id and ss.player_id = lm.user_id
group by lm.league_id, lm.user_id, p.name, p.avatar_url;
