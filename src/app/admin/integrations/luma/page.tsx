import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { RestrictedState } from "@/components/restricted-state";
import {
  getAdminLumaIntegrationStatus,
  type AdminLumaStatusCheck,
  type AdminLumaTestStatus,
} from "@/services/admin-luma-integration-status";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminIntegrationProvider");
export const dynamic = "force-dynamic";

export default async function AdminLumaIntegrationPage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
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
