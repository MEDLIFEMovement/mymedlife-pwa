-- Allow the server-only HubSpot reconciler to refresh current chapter role terms
-- without permitting identity relinks or browser-side membership rewrites.

create or replace function app.enforce_membership_update_bounds()
returns trigger
language plpgsql
security definer
set search_path = app, public
as $$
begin
  if auth.role() = 'service_role'
    and new.hubspot_association_key is not null then
    if (to_jsonb(new) - array[
      'status',
      'approved_at',
      'approved_by',
      'hubspot_association_key',
      'role_key',
      'role_term_label',
      'role_term_start_year',
      'role_term_end_year',
      'updated_at'
    ]) <> (to_jsonb(old) - array[
      'status',
      'approved_at',
      'approved_by',
      'hubspot_association_key',
      'role_key',
      'role_term_label',
      'role_term_start_year',
      'role_term_end_year',
      'updated_at'
    ]) then
      raise exception 'HubSpot sync cannot rewrite membership identity or unrelated metadata'
        using errcode = '22023';
    end if;

    if old.hubspot_association_key is not null
      and new.hubspot_association_key <> old.hubspot_association_key then
      raise exception 'HubSpot sync cannot relink an existing membership association'
        using errcode = '22023';
    end if;

    if new.role_key not in (
      'general_member',
      'action_committee_member',
      'action_committee_chair',
      'e_board_member',
      'president_vp'
    ) then
      raise exception 'HubSpot sync can only assign an approved chapter role'
        using errcode = '22023';
    end if;

    if new.status not in ('approved', 'inactive') then
      raise exception 'HubSpot sync can only approve or deactivate memberships'
        using errcode = '22023';
    end if;

    return new;
  end if;

  if current_setting('app.admin_access_change', true) = 'enabled'
    and app.is_ds_admin() then
    if new.id <> old.id
      or new.user_id <> old.user_id
      or new.chapter_id <> old.chapter_id
      or new.role_key <> old.role_key
      or new.requested_at <> old.requested_at
      or new.created_at <> old.created_at then
      raise exception 'admin access changes cannot rewrite membership identity'
        using errcode = '22023';
    end if;

    if new.status not in ('approved', 'inactive') then
      raise exception 'admin access changes can only approve or deactivate memberships'
        using errcode = '22023';
    end if;

    if new.status = 'approved'
      and (new.approved_by is null or new.approved_at is null) then
      raise exception 'admin access approval must record approved_at and approved_by'
        using errcode = '22023';
    end if;

    return new;
  end if;

  if not app.can_approve_chapter_membership(old.chapter_id) then
    raise exception 'memberships can only be updated by approved membership reviewers'
      using errcode = '42501';
  end if;

  if old.status <> 'requested' then
    raise exception 'only requested memberships can be approved'
      using errcode = '22023';
  end if;

  if new.status <> 'approved' then
    raise exception 'membership approval must set status to approved'
      using errcode = '22023';
  end if;

  if new.id <> old.id
    or new.user_id <> old.user_id
    or new.chapter_id <> old.chapter_id
    or new.role_key <> old.role_key
    or new.requested_at <> old.requested_at
    or new.created_at <> old.created_at then
    raise exception 'membership approval cannot rewrite identity or request metadata'
      using errcode = '22023';
  end if;

  if new.approved_by is null or new.approved_at is null then
    raise exception 'membership approval must record approved_at and approved_by'
      using errcode = '22023';
  end if;

  return new;
end;
$$;
