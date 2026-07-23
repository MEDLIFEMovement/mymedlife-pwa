import Link from "next/link";
import { redirect } from "next/navigation";

import {
  submitDatabricksExportAction,
  submitDatabricksReplayAction,
} from "@/app/admin/integrations/databricks/actions";
import { AppShell } from "@/components/app-shell";
import { RestrictedState } from "@/components/restricted-state";
import { getAdminDatabricksExportWorkspace } from "@/services/admin-databricks-export-workspace";
import { getLandingRouteForActor } from "@/services/landing-route";
import {
  buildLoginRedirectHref,
  shouldRedirectActorToLogin,
} from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { canAccessAdminWorkspace } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminIntegrationProvider");
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    databricksResult?: string;
    runId?: string;
  }>;
};

export default async function AdminDatabricksIntegrationPage({
  searchParams,
}: PageProps) {
  const actor = await getLocalActorContext();
  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/admin/integrations/databricks"));
  }
  if (!canAccessAdminWorkspace(actor)) {
    redirect(getLandingRouteForActor(actor));
  }
  if (actor.audience !== "ds_admin" && actor.audience !== "super_admin") {
    redirect(getLandingRouteForActor(actor));
  }

  const [workspace, result] = await Promise.all([
    getAdminDatabricksExportWorkspace(),
    searchParams,
  ]);

  return (
    <AppShell actor={actor}>
      {!workspace.canRead ? (
        <RestrictedState
          title="Databricks event metrics"
          message={workspace.message}
          nextHref="/admin?view=integrations"
          nextLabel="Back to integrations"
        />
      ) : (
        <main className="space-y-6">
          <header className="border-b border-white/10 pb-6">
            <p className="text-xs font-semibold uppercase text-blue-200">
              DS and Super Admin
            </p>
            <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-white">
                  Databricks event metrics
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65">
                  Supabase remains operational truth. Databricks receives
                  aggregate event, RSVP, attendance, and points metrics only.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/admin/audit-log"
                  className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white"
                >
                  Audit log
                </Link>
                <Link
                  href="/admin?view=integrations"
                  className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white"
                >
                  Integrations
                </Link>
              </div>
            </div>
          </header>

          {result.databricksResult ? (
            <section
              aria-live="polite"
              className="rounded-lg border border-blue-300/25 bg-blue-300/10 px-4 py-3 text-sm text-blue-50"
            >
              <strong>{readableResult(result.databricksResult)}</strong>
              {result.runId ? ` Run ${result.runId}.` : ""}
            </section>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Metric label="Total runs" value={workspace.counts.totalRuns} />
            <Metric label="Succeeded" value={workspace.counts.succeededRuns} />
            <Metric label="Partial" value={workspace.counts.partialRuns} />
            <Metric label="Failed" value={workspace.counts.failedRuns} />
            <Metric label="Open failures" value={workspace.counts.openFailures} />
          </section>

          <section className="border-y border-white/10 py-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Export status</h2>
                <p className="mt-2 text-sm text-white/62">{workspace.message}</p>
              </div>
              <span className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold uppercase text-white/70">
                {workspace.config.enabled ? "Enabled" : "Blocked"}
              </span>
            </div>

            {workspace.lastRun ? (
              <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                <Detail label="Status" value={workspace.lastRun.status} />
                <Detail label="Mode" value={workspace.lastRun.mode} />
                <Detail label="Trigger" value={workspace.lastRun.triggerSource} />
                <Detail
                  label="Started"
                  value={formatTimestamp(workspace.lastRun.startedAt)}
                />
                <Detail
                  label="Source rows"
                  value={`${workspace.lastRun.sourceRows}`}
                />
                <Detail
                  label="Exported rows"
                  value={`${workspace.lastRun.exportedRows}`}
                />
                <Detail
                  label="Checkpoint"
                  value={formatTimestamp(workspace.lastRun.checkpointAfter)}
                />
                <Detail
                  label="Statement"
                  value={workspace.lastRun.statementId ?? "No statement"}
                />
                <Detail
                  label="Statements"
                  value={`${workspace.lastRun.statementIds.length}`}
                />
              </dl>
            ) : (
              <p className="mt-5 text-sm text-white/55">
                No Databricks export run has been recorded.
              </p>
            )}
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <ExportForm
              mode="incremental"
              confirmation="EXPORT DATABRICKS"
              title="Incremental export"
              disabled={!workspace.config.enabled}
            />
            <ExportForm
              mode="backfill"
              confirmation="BACKFILL DATABRICKS"
              title="Full backfill"
              disabled={!workspace.config.enabled}
            />
          </section>

          <section className="border-t border-white/10 pt-6">
            <h2 className="text-xl font-semibold text-white">Open failures</h2>
            {workspace.failures.length === 0 ? (
              <p className="mt-3 text-sm text-white/55">
                No unresolved Databricks export failures.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-white/10 border-y border-white/10">
                {workspace.failures.map((failure) => (
                  <article key={failure.id} className="py-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {failure.code}
                        </p>
                        <p className="mt-1 text-sm text-white/62">
                          {failure.message}
                        </p>
                        <p className="mt-1 text-xs text-white/42">
                          {formatTimestamp(failure.createdAt)} · retry{" "}
                          {failure.retryCount}
                        </p>
                      </div>
                      <form
                        action={submitDatabricksReplayAction}
                        className="flex flex-wrap items-end gap-2"
                      >
                        <input
                          type="hidden"
                          name="retryOfRunId"
                          value={failure.runId}
                        />
                        <input type="hidden" name="mode" value={failure.mode} />
                        <label className="text-xs font-semibold text-white/60">
                          Confirmation
                          <input
                            name="confirmation"
                            placeholder="REPLAY DATABRICKS"
                            disabled={!workspace.config.enabled}
                            className="mt-1 block rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white"
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={!workspace.config.enabled}
                          className="rounded-lg bg-blue-300 px-3 py-2 text-sm font-semibold text-[#061a33] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Replay
                        </button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      )}
    </AppShell>
  );
}

function ExportForm({
  mode,
  confirmation,
  title,
  disabled,
}: {
  mode: "backfill" | "incremental";
  confirmation: string;
  title: string;
  disabled: boolean;
}) {
  return (
    <form
      action={submitDatabricksExportAction}
      className="rounded-lg border border-white/10 p-5"
    >
      <input type="hidden" name="mode" value={mode} />
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <label className="mt-4 block text-xs font-semibold text-white/60">
        Type {confirmation}
        <input
          name="confirmation"
          disabled={disabled}
          className="mt-2 block w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white"
        />
      </label>
      <button
        type="submit"
        disabled={disabled}
        className="mt-4 rounded-lg bg-blue-300 px-4 py-2 text-sm font-semibold text-[#061a33] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Run {title.toLowerCase()}
      </button>
    </form>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 p-4">
      <p className="text-xs font-semibold uppercase text-white/45">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-white/42">{label}</dt>
      <dd className="mt-1 break-words text-sm text-white/72">{value}</dd>
    </div>
  );
}

function formatTimestamp(value: string | null) {
  if (!value) return "Not recorded";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    });
}

function readableResult(code: string) {
  const messages: Record<string, string> = {
    databricks_export_succeeded: "Databricks export completed.",
    confirmation_required: "Exact confirmation is required.",
    replay_confirmation_required: "Replay confirmation and lineage are required.",
    export_disabled: "Databricks export remains disabled.",
    export_already_running: "A Databricks export is already running.",
    permission_denied: "DS Admin or Super Admin access is required.",
    missing_auth: "An authenticated administrator session is required.",
    server_error: "The export did not complete. Review the run and failure ledger.",
  };
  return messages[code] ?? "Databricks export status updated.";
}
