create or replace function app.toggle_member_story_like(
  actor_uuid uuid,
  evidence_item_uuid uuid
)
returns table (
  result_code text,
  evidence_item_id uuid,
  reaction_count integer,
  liked_by_actor boolean
)
language plpgsql
security invoker
set search_path = app, public
as $$
declare
  story_liked constant text := 'story_liked';
  story_unliked constant text := 'story_unliked';
  target_profile app.profiles%rowtype;
  target_evidence app.evidence_items%rowtype;
  latest_intent app.events%rowtype;
  next_event_type text;
  next_reaction_count integer;
begin
  perform pg_advisory_xact_lock(
    hashtextextended(evidence_item_uuid::text || ':' || actor_uuid::text, 0)
  );

  select *
  into target_profile
  from app.profiles
  where id = actor_uuid
    and status = 'active';

  if not found then
    raise exception 'active member profile not found' using errcode = 'P0002';
  end if;

  select *
  into target_evidence
  from app.evidence_items
  where id = evidence_item_uuid
    and status = 'approved'
    and sharing_status = 'approved_for_sharing';

  if not found then
    raise exception 'approved story not found' using errcode = 'P0002';
  end if;

  select *
  into latest_intent
  from app.events
  where evidence_item_id = evidence_item_uuid
    and actor_user_id = actor_uuid
    and event_type in (story_liked, story_unliked)
  order by occurred_at desc, created_at desc, id desc
  limit 1;

  next_event_type := case
    when latest_intent.id is not null and latest_intent.event_type = story_liked
      then story_unliked
    else story_liked
  end;

  insert into app.events (
    event_type,
    actor_user_id,
    chapter_id,
    chapter_event_id,
    evidence_item_id,
    payload,
    correlation_id
  ) values (
    next_event_type,
    actor_uuid,
    target_evidence.chapter_id,
    target_evidence.chapter_event_id,
    target_evidence.id,
    jsonb_build_object(
      'source', 'member_story_reaction',
      'operation', next_event_type,
      'previousIntentEventId', latest_intent.id,
      'liveExternalWrite', false
    ),
    'member_story_reaction:' || target_evidence.id::text || ':' || actor_uuid::text
  );

  with latest_story_intents as (
    select distinct on (event.actor_user_id)
      event.actor_user_id,
      event.event_type
    from app.events event
    where event.evidence_item_id = target_evidence.id
      and event.actor_user_id is not null
      and event.event_type in (story_liked, story_unliked)
    order by
      event.actor_user_id,
      event.occurred_at desc,
      event.created_at desc,
      event.id desc
  )
  select count(*)::integer
  into next_reaction_count
  from latest_story_intents
  where event_type = story_liked;

  return query select
    next_event_type,
    target_evidence.id,
    next_reaction_count,
    next_event_type = story_liked;
end;
$$;

create or replace function app.get_member_story_reactions(actor_uuid uuid)
returns table (
  evidence_item_id uuid,
  reaction_count integer,
  liked_by_actor boolean
)
language sql
stable
security invoker
set search_path = app, public
as $$
  with approved_stories as (
    select evidence.id
    from app.evidence_items evidence
    where evidence.status = 'approved'
      and evidence.sharing_status = 'approved_for_sharing'
  ),
  latest_story_intents as (
    select distinct on (event.evidence_item_id, event.actor_user_id)
      event.evidence_item_id,
      event.actor_user_id,
      event.event_type
    from app.events event
    inner join approved_stories story
      on story.id = event.evidence_item_id
    where event.actor_user_id is not null
      and event.event_type in ('story_liked', 'story_unliked')
    order by
      event.evidence_item_id,
      event.actor_user_id,
      event.occurred_at desc,
      event.created_at desc,
      event.id desc
  )
  select
    story.id,
    count(intent.actor_user_id) filter (
      where intent.event_type = 'story_liked'
    )::integer,
    coalesce(
      bool_or(
        intent.actor_user_id = actor_uuid
        and intent.event_type = 'story_liked'
      ),
      false
    )
  from approved_stories story
  left join latest_story_intents intent
    on intent.evidence_item_id = story.id
  group by story.id;
$$;

revoke all on function app.toggle_member_story_like(uuid, uuid)
from public, anon, authenticated;

revoke all on function app.get_member_story_reactions(uuid)
from public, anon, authenticated;

grant execute on function app.toggle_member_story_like(uuid, uuid)
to service_role;

grant execute on function app.get_member_story_reactions(uuid)
to service_role;
