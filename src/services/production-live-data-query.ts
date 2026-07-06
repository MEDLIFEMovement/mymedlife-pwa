export type ProductionLiveDataQueryConnection =
  | {
      mode: "linked";
    }
  | {
      mode: "db_url";
      dbUrl: string;
    };

export const productionLiveDataCountQuery = [
  "select 'auth.users' as relation, count(*)::bigint as rows from auth.users",
  "union all select 'app.profiles', count(*)::bigint from app.profiles",
  "union all select 'app.chapters.active', count(*)::bigint from app.chapters where status = 'active'",
  "union all select 'app.memberships.approved', count(*)::bigint from app.memberships where status = 'approved'",
  "union all select 'app.staff_role_assignments.active', count(*)::bigint from app.staff_role_assignments where status = 'active'",
  "union all select 'app.coach_chapter_assignments.active', count(*)::bigint from app.coach_chapter_assignments where status = 'active'",
  "union all select 'app.campaigns.active', count(*)::bigint from app.campaigns where status = 'active'",
  "union all select 'app.chapter_events', count(*)::bigint from app.chapter_events",
  "union all select 'app.luma_event_links', count(*)::bigint from app.luma_event_links",
  "union all select 'app.assignments', count(*)::bigint from app.assignments",
  "union all select 'app.points_events', count(*)::bigint from app.points_events",
  "union all select 'app.audit_logs', count(*)::bigint from app.audit_logs",
  "union all select 'app.automation_outbox.total', count(*)::bigint from app.automation_outbox",
  "union all select 'app.automation_outbox.unsafe', count(*)::bigint from app.automation_outbox where status in ('approved_for_live_send', 'sent', 'failed', 'dead_lettered')",
  "order by relation;",
].join(" ");

export function getProductionLiveDataQueryArgs(
  connection: ProductionLiveDataQueryConnection,
): string[] {
  const connectionArgs =
    connection.mode === "linked"
      ? ["--linked"]
      : ["--db-url", connection.dbUrl];

  return [
    "exec",
    "supabase",
    "db",
    "query",
    ...connectionArgs,
    "--output",
    "csv",
    productionLiveDataCountQuery,
  ];
}

export function redactProductionLiveDataQueryOutput(
  output: string,
  connection: ProductionLiveDataQueryConnection,
): string {
  if (connection.mode === "linked" || !connection.dbUrl) {
    return output;
  }

  return output.split(connection.dbUrl).join("[redacted database url]");
}
