begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

set local role service_role;

update app.evidence_items
set status = 'approved',
    sharing_status = 'approved_for_sharing'
where id = '60000000-0000-4000-8000-000000000001';

set local role authenticated;
set local "request.jwt.claim.role" = 'authenticated';
set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';

select throws_ok(
  $$ select * from app.toggle_member_story_like(
       '00000000-0000-4000-8000-000000000001',
       '60000000-0000-4000-8000-000000000001'
     ) $$,
  '42501',
  null,
  'Authenticated clients cannot invoke the server-only story reaction transaction directly'
);

reset role;
set local role service_role;

select is(
  (select result_code from app.toggle_member_story_like(
    '00000000-0000-4000-8000-000000000001',
    '60000000-0000-4000-8000-000000000001'
  )),
  'story_liked',
  'The first reaction appends an active like intent'
);

select is(
  (select reaction_count from app.get_member_story_reactions(
    '00000000-0000-4000-8000-000000000001'
  ) where evidence_item_id = '60000000-0000-4000-8000-000000000001'),
  1,
  'The reaction readback counts one active member intent'
);

select is(
  (select result_code from app.toggle_member_story_like(
    '00000000-0000-4000-8000-000000000001',
    '60000000-0000-4000-8000-000000000001'
  )),
  'story_unliked',
  'The second reaction appends an unlike intent instead of deleting history'
);

select is(
  (select reaction_count from app.get_member_story_reactions(
    '00000000-0000-4000-8000-000000000001'
  ) where evidence_item_id = '60000000-0000-4000-8000-000000000001'),
  0,
  'The latest unlike intent removes the member from the active count'
);

select is(
  (select result_code from app.toggle_member_story_like(
    '00000000-0000-4000-8000-000000000001',
    '60000000-0000-4000-8000-000000000001'
  )),
  'story_liked',
  'A member can react again after removing a reaction'
);

select is(
  (select reaction_count from app.toggle_member_story_like(
    '00000000-0000-4000-8000-000000000002',
    '60000000-0000-4000-8000-000000000001'
  )),
  2,
  'Distinct active members contribute once each to the reaction count'
);

select ok(
  (select liked_by_actor from app.get_member_story_reactions(
    '00000000-0000-4000-8000-000000000001'
  ) where evidence_item_id = '60000000-0000-4000-8000-000000000001'),
  'Readback reports whether the requesting actor has an active reaction'
);

select is(
  (select count(*)::integer from app.events
   where evidence_item_id = '60000000-0000-4000-8000-000000000001'
     and event_type in ('story_liked', 'story_unliked')),
  4,
  'Every reaction transition remains present in the append-only event ledger'
);

select throws_ok(
  $$ select * from app.toggle_member_story_like(
       '00000000-0000-4000-8000-000000000001',
       '60000000-0000-4000-8000-000000000004'
     ) $$,
  'P0002',
  'approved story not found',
  'Pending evidence cannot receive member reactions'
);

select * from finish();
rollback;
