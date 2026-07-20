import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { RestrictedState } from "@/components/restricted-state";
import {
  getAdminLumaIntegrationStatus,
  type AdminLumaStatusCheck,
  type AdminLumaTestStatus,
} from "@/services/admin-luma-integration-status";
import { getAdminLumaSyncWorkspace } from "@/services/admin-luma-sync-workspace";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import {
  submitLumaEventSyncAction,
  submitLumaReplayAction,
} from "@/app/admin/integrations/luma/actions";

export const metadata = getStaticRouteMetadata("adminIntegrationProvider");
export const dynamic = "force-dynamic";

export default async function AdminLumaIntegrationPage() {
  const [actor, data, syncWorkspace] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
    getAdminLumaSyncWorkspace(),
  ]);
  const workspace = getAdminLumaIntegrationStatus(actor, data);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />

      {!workspace.canReadWorkspace ? (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref="/admin"
          nextLabel="Back to admin"
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-white/12 bg-[#061a33] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-100">
                  DS provider setup
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white">
                  {workspace.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
                  {workspace.summary}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/admin/integration-outbox"
                  className="rounded-full bg-blue-300 px-4 py-2 text-sm font-semibold text-[#061a33]"
                >
                  Open outbox
                </Link>
                <Link
                  href="/admin/audit-log"
                  className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white"
                >
                  Open audit log
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <MiniStat label="Environment" value={workspace.environmentLabel} />
            <MiniStat
              label="Provider"
              value={workspace.providerStatus.replaceAll("_", " ")}
            />
            <MiniStat label="Test" value={workspace.testConnection.label} />
            <MiniStat label="Calendars" value={`${workspace.counts.calendars}`} />
            <MiniStat
              label="Linked events"
              value={`${workspace.counts.linkedEvents}`}
            />
            <MiniStat
              label="Live sends"
              value={`${workspace.counts.liveSendRows}`}
            />
          </section>

          <section className="border-y border-white/10 py-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100/80">
                  Server-only event ingestion
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Luma event reconciliation
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">
                  {syncWorkspace.message}
                </p>
              </div>
              <span className="text-sm font-semibold text-white/70">
                Provider writes: disabled
              </span>
            </div>

            <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Detail label="Calendar maps" value={`${syncWorkspace.counts.calendars}`} />
              <Detail label="Imported events" value={`${syncWorkspace.counts.importedEvents}`} />
              <Detail label="Materialized" value={`${syncWorkspace.counts.materializedEvents}`} />
              <Detail label="Conflicts" value={`${syncWorkspace.counts.conflicts}`} />
              <Detail label="Open failures" value={`${syncWorkspace.counts.openFailures}`} />
            </dl>

            <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="border-l-2 border-blue-300/30 pl-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                  Latest run
                </p>
                {syncWorkspace.lastRun ? (
                  <div className="mt-2 space-y-1 text-sm text-white/70">
                    <p className="font-semibold text-white">
                      {syncWorkspace.lastRun.status} · {syncWorkspace.lastRun.mode} · {syncWorkspace.lastRun.triggerSource}
                    </p>
                    <p>Started {syncWorkspace.lastRun.startedAt}</p>
                    <p>Heartbeat {syncWorkspace.lastRun.heartbeatAt}</p>
                    <p>
                      {syncWorkspace.lastRun.sourceEvents} source · {syncWorkspace.lastRun.materializedEvents} new · {syncWorkspace.lastRun.updatedEvents} updated
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-white/58">No Luma sync run has completed yet.</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <LumaSyncForm
                  mode="backfill"
                  confirmation="BACKFILL LUMA"
                  label="Initial event backfill"
                  disabled={!syncWorkspace.config.enabled}
                />
                <LumaSyncForm
                  mode="reconcile"
                  confirmation="SYNC LUMA"
                  label="Reconcile event window"
                  disabled={!syncWorkspace.config.enabled}
                />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-white">Open sync failures</h3>
              {syncWorkspace.failures.length === 0 ? (
                <p className="mt-2 text-sm text-white/58">No unresolved Luma sync failures.</p>
              ) : (
                <div className="mt-3 grid gap-3">
                  {syncWorkspace.failures.map((failure) => (
                    <div key={failure.id} className="border-l-2 border-rose-300/30 pl-4">
                      <p className="text-sm font-semibold text-white">
                        {failure.code} · {failure.objectType}
                      </p>
                      <p className="mt-1 text-sm text-white/62">{failure.message}</p>
                      {syncWorkspace.lastRun ? (
                        <form action={submitLumaReplayAction} className="mt-3 flex flex-wrap items-end gap-2">
                          <input type="hidden" name="retryOfRunId" value={syncWorkspace.lastRun.id} />
                          <input type="hidden" name="mode" value={syncWorkspace.lastRun.mode} />
                          <label className="text-xs font-semibold text-white/56">
                            Type REPLAY LUMA
                            <input
                              name="confirmation"
                              className="mt-1 block rounded border border-white/15 bg-black/20 px-3 py-2 text-sm text-white"
                              disabled={!syncWorkspace.config.enabled}
                            />
                          </label>
                          <button
                            type="submit"
                            disabled={!syncWorkspace.config.enabled}
                            className="rounded bg-blue-300 px-3 py-2 text-sm font-semibold text-[#061a33] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Replay safely
                          </button>
                        </form>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100/80">
                    Safe test connection
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {workspace.testConnection.label}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-white/62">
                    {workspace.testConnection.detail}
                  </p>
                </div>
                <StatusPill status={workspace.testConnection.status} />
              </div>
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                <Detail label="Last test" value={workspace.lastTestTime} />
                <Detail label="Last sync" value={workspace.lastSync} />
                <Detail label="Outbox" value={workspace.outboxStatus} />
                <Detail
                  label="Secrets in browser"
                  value={`${workspace.counts.browserSecretsShown}`}
                />
              </dl>
            </article>

            <article className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100/80">
                Safety boundary
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {workspace.blockedControls.map((control) => (
                  <span
                    key={control}
                    className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-white/68"
                  >
                    {control}
                  </span>
                ))}
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-white/62">
                {workspace.safetyNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </article>
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            {workspace.setupChecks.map((check) => (
              <StatusCheckCard key={check.label} check={check} />
            ))}
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100/80">
                  Error log
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Luma provider readback
                </h2>
              </div>
              <MiniStat
                label="External writes"
                value={`${workspace.counts.externalWritesEnabled}`}
              />
            </div>
            <div className="mt-4 grid gap-3">
              {workspace.errorLog.map((item) => (
                <article
                  key={`${item.source}-${item.status}-${item.message}`}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">
                      {item.source.replaceAll("_", " ")}
                    </p>
                    <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/56">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/62">
                    {item.message}
                  </p>
                  <p className="mt-2 text-xs text-white/42">{item.occurredAt}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold capitalize text-white">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-white">{value}</dd>
    </div>
  );
}

function LumaSyncForm({
  mode,
  confirmation,
  label,
  disabled,
}: {
  mode: "backfill" | "reconcile";
  confirmation: string;
  label: string;
  disabled: boolean;
}) {
  return (
    <form action={submitLumaEventSyncAction} className="border-l-2 border-white/15 pl-4">
      <input type="hidden" name="mode" value={mode} />
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-1 text-xs leading-5 text-white/52">
        Reads Luma and writes app-owned event/link rows only. No provider mutation runs.
      </p>
      <label className="mt-3 block text-xs font-semibold text-white/56">
        Type {confirmation}
        <input
          name="confirmation"
          disabled={disabled}
          className="mt-1 block w-full rounded border border-white/15 bg-black/20 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
        />
      </label>
      <button
        type="submit"
        disabled={disabled}
        className="mt-3 rounded bg-blue-300 px-3 py-2 text-sm font-semibold text-[#061a33] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Run {mode}
      </button>
    </form>
  );
}

function StatusCheckCard({ check }: { check: AdminLumaStatusCheck }) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">{check.label}</p>
          <p className="mt-1 text-2xl font-semibold capitalize text-white">
            {check.value}
          </p>
        </div>
        <StatusPill status={check.status} />
      </div>
      <p className="mt-3 text-sm leading-6 text-white/62">{check.detail}</p>
    </article>
  );
}

function StatusPill({ status }: { status: AdminLumaTestStatus }) {
  const classes: Record<AdminLumaTestStatus, string> = {
    pass: "border-blue-300/30 bg-blue-300/15 text-blue-100",
    blocked: "border-rose-300/30 bg-rose-300/15 text-rose-100",
    needs_setup: "border-amber-300/30 bg-amber-300/15 text-amber-100",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${classes[status]}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
