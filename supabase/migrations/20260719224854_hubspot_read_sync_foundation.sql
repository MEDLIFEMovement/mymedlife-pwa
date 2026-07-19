-- Server-only HubSpot read sync foundation.
-- HubSpot remains read-only. These tables retain source snapshots, reconciliation
-- state, and failures so app-owned records can be materialized deliberately.

alter table app.chapters
  add column if not exists chapter_type text not null default 'needs_review'
  check (chapter_type in ('high_school', 'college_university', 'needs_review'));

alter table app.memberships
  add column if not exists hubspot_association_key text;

create table app.hubspot_sync_runs (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('backfill', 'incremental')),
  status text not null default 'running'
    check (status in ('running', 'succeeded', 'partial', 'failed')),
  requested_by uuid references app.profiles(id),
  checkpoint_before timestamptz,
  checkpoint_after timestamptz,
  source_company_count integer not null default 0 check (source_company_count >= 0),
  source_contact_count integer not null default 0 check (source_contact_count >= 0),
  company_upsert_count integer not null default 0 check (company_upsert_count >= 0),
  contact_upsert_count integer not null default 0 check (contact_upsert_count >= 0),
  membership_upsert_count integer not null default 0 check (membership_upsert_count >= 0),
  materialized_chapter_count integer not null default 0 check (materialized_chapter_count >= 0),
  matched_profile_count integer not null default 0 check (matched_profile_count >= 0),
  conflict_count integer not null default 0 check (conflict_count >= 0),
  failure_count integer not null default 0 check (failure_count >= 0),
  error_summary text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (completed_at is null or completed_at >= started_at)
);

create table app.hubspot_company_imports (
  hubspot_company_id text primary key,
  name text not null,
  domain text,
  lifecycle_stage text,
  chapter_status text,
  region text,
  country text,
  school_type text,
  source_updated_at timestamptz,
  source_payload jsonb not null default '{}'::jsonb,
  materialized_chapter_id uuid references app.chapters(id) on delete set null,
  reconciliation_status text not null default 'pending'
    check (reconciliation_status in ('pending', 'matched', 'materialized', 'conflict', 'ignored')),
  reconciliation_note text,
  last_seen_run_id uuid references app.hubspot_sync_runs(id) on delete set null,
  first_imported_at timestamptz not null default now(),
  last_imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.hubspot_contact_imports (
  hubspot_contact_id text primary key,
  email text,
  normalized_email text generated always as (nullif(lower(btrim(email)), '')) stored,
  first_name text,
  last_name text,
  graduation_year integer,
  source_updated_at timestamptz,
  source_payload jsonb not null default '{}'::jsonb,
  matched_profile_id uuid references app.profiles(id) on delete set null,
  reconciliation_status text not null default 'pending'
    check (reconciliation_status in ('pending', 'matched', 'conflict', 'missing_email', 'ignored')),
  reconciliation_note text,
  last_seen_run_id uuid references app.hubspot_sync_runs(id) on delete set null,
  first_imported_at timestamptz not null default now(),
  last_imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (graduation_year is null or graduation_year between 1900 and 2200)
);

create table app.hubspot_membership_imports (
  hubspot_contact_id text not null references app.hubspot_contact_imports(hubspot_contact_id) on delete cascade,
  hubspot_company_id text not null references app.hubspot_company_imports(hubspot_company_id) on delete cascade,
  role_key text not null default 'general_member' references app.roles(key),
  source_updated_at timestamptz,
  source_payload jsonb not null default '{}'::jsonb,
  materialized_membership_id uuid references app.memberships(id) on delete set null,
  reconciliation_status text not null default 'pending'
    check (reconciliation_status in ('pending', 'matched', 'materialized', 'conflict', 'ignored')),
  reconciliation_note text,
  last_seen_run_id uuid references app.hubspot_sync_runs(id) on delete set null,
  first_imported_at timestamptz not null default now(),
  last_imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (hubspot_contact_id, hubspot_company_id)
);

create table app.hubspot_sync_failures (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references app.hubspot_sync_runs(id) on delete cascade,
  object_type text not null check (object_type in ('company', 'contact', 'membership', 'run')),
  external_id text,
  error_code text not null,
  error_message text not null,
  source_payload jsonb not null default '{}'::jsonb,
  retry_count integer not null default 0 check (retry_count >= 0),
  retry_after timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index chapters_hubspot_company_id_unique
on app.chapters (hubspot_company_id)
where hubspot_company_id is not null;

create unique index profiles_hubspot_contact_id_unique
on app.profiles (hubspot_contact_id)
where hubspot_contact_id is not null;

create unique index memberships_hubspot_association_key_unique
on app.memberships (hubspot_association_key)
where hubspot_association_key is not null;

create unique index hubspot_contact_imports_normalized_email_unique
on app.hubspot_contact_imports (normalized_email)
where normalized_email is not null;

create index hubspot_sync_runs_status_started_idx
on app.hubspot_sync_runs (status, started_at desc);

create index hubspot_company_imports_reconciliation_idx
on app.hubspot_company_imports (reconciliation_status, last_imported_at desc);

create index hubspot_contact_imports_reconciliation_idx
on app.hubspot_contact_imports (reconciliation_status, last_imported_at desc);

create index hubspot_membership_imports_reconciliation_idx
on app.hubspot_membership_imports (reconciliation_status, last_imported_at desc);

create index hubspot_sync_failures_retry_idx
on app.hubspot_sync_failures (resolved_at, retry_after, retry_count);

create trigger set_hubspot_sync_runs_updated_at
before update on app.hubspot_sync_runs
for each row execute function app.set_updated_at();

create trigger set_hubspot_company_imports_updated_at
before update on app.hubspot_company_imports
for each row execute function app.set_updated_at();

create trigger set_hubspot_contact_imports_updated_at
before update on app.hubspot_contact_imports
for each row execute function app.set_updated_at();

create trigger set_hubspot_membership_imports_updated_at
before update on app.hubspot_membership_imports
for each row execute function app.set_updated_at();

alter table app.hubspot_sync_runs enable row level security;
alter table app.hubspot_company_imports enable row level security;
alter table app.hubspot_contact_imports enable row level security;
alter table app.hubspot_membership_imports enable row level security;
alter table app.hubspot_sync_failures enable row level security;

create policy "hubspot_sync_runs_select_ds_admin"
on app.hubspot_sync_runs for select to authenticated
using (app.is_ds_admin());

create policy "hubspot_company_imports_select_ds_admin"
on app.hubspot_company_imports for select to authenticated
using (app.is_ds_admin());

create policy "hubspot_contact_imports_select_ds_admin"
on app.hubspot_contact_imports for select to authenticated
using (app.is_ds_admin());

create policy "hubspot_membership_imports_select_ds_admin"
on app.hubspot_membership_imports for select to authenticated
using (app.is_ds_admin());

create policy "hubspot_sync_failures_select_ds_admin"
on app.hubspot_sync_failures for select to authenticated
using (app.is_ds_admin());

grant select on app.hubspot_sync_runs to authenticated;
grant select on app.hubspot_company_imports to authenticated;
grant select on app.hubspot_contact_imports to authenticated;
grant select on app.hubspot_membership_imports to authenticated;
grant select on app.hubspot_sync_failures to authenticated;

grant select, insert, update, delete on app.hubspot_sync_runs to service_role;
grant select, insert, update, delete on app.hubspot_company_imports to service_role;
grant select, insert, update, delete on app.hubspot_contact_imports to service_role;
grant select, insert, update, delete on app.hubspot_membership_imports to service_role;
grant select, insert, update, delete on app.hubspot_sync_failures to service_role;
