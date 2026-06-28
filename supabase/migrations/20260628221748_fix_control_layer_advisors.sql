-- Tighten the production control-layer objects flagged by hosted Supabase
-- advisors after the first staging application.

create or replace function app.is_production_sensitive_feature(flag_key text)
returns boolean
language sql
immutable
set search_path = app, public
as $$
  select flag_key in (
    'integration_luma',
    'integration_hubspot',
    'integration_shopify',
    'integration_givelively',
    'integration_bigquery',
    'integration_powerbi',
    'integration_n8n',
    'integration_openai',
    'mcp_read_only_analytics'
  )
$$;

drop policy if exists "admin_step_up_sessions_select_own_or_super"
on app.admin_step_up_sessions;

create policy "admin_step_up_sessions_select_own_or_super"
on app.admin_step_up_sessions for select to authenticated
using (user_id = (select auth.uid()) or (select app.is_super_admin()));

drop policy if exists "production_control_approvals_select_ds_only"
on app.production_control_approvals;

create policy "production_control_approvals_select_ds_only"
on app.production_control_approvals for select to authenticated
using ((select app.is_ds_admin()) or (select app.is_super_admin()));

drop policy if exists "feature_flag_overrides_select_ds_only"
on app.feature_flag_overrides;

create policy "feature_flag_overrides_select_ds_only"
on app.feature_flag_overrides for select to authenticated
using ((select app.is_ds_admin()) or (select app.is_super_admin()));

drop policy if exists "feature_flag_audit_records_select_ds_only"
on app.feature_flag_audit_records;

create policy "feature_flag_audit_records_select_ds_only"
on app.feature_flag_audit_records for select to authenticated
using ((select app.is_ds_admin()) or (select app.is_super_admin()));

drop policy if exists "theme_snapshots_select_ds_only"
on app.theme_snapshots;

create policy "theme_snapshots_select_ds_only"
on app.theme_snapshots for select to authenticated
using ((select app.is_ds_admin()) or (select app.is_super_admin()));

drop policy if exists "theme_audit_records_select_ds_only"
on app.theme_audit_records;

create policy "theme_audit_records_select_ds_only"
on app.theme_audit_records for select to authenticated
using ((select app.is_ds_admin()) or (select app.is_super_admin()));

grant execute on function app.is_production_sensitive_feature(text) to authenticated;
