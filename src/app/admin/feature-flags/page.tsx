import { AdminAppShell } from "@/components/admin-app-shell";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { RestrictedState } from "@/components/restricted-state";
import { getFeatureFlagAuditEmptyStateCopy } from "@/modules/admin/control-audit-empty-state";
import {
  canManageFeatureFlags,
  featureFlagEnvironments,
  featureFlagStatuses,
  getCurrentFeatureEnvironment,
  getFeatureFlagAdminState,
  getFeatureFlagDefinitions,
  type FeatureFlagEnvironment,
  type FeatureFlagResolvedState,
} from "@/modules/feature-flags";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getLandingRouteForActor } from "@/services/landing-route";
import { updateFeatureFlagAction } from "./actions";

export const dynamic = "force-dynamic";

type FeatureFlagsPageProps = {
  searchParams?: Promise<{
    env?: string;
    featureFlagResult?: string;
    featureFlagMessage?: string;
  }>;
};

export default async function FeatureFlagsPage({
  searchParams,
}: FeatureFlagsPageProps) {
  const [actor, resolvedSearchParams] = await Promise.all([
    getLocalActorContext(),
    searchParams ? searchParams : Promise.resolve(undefined),
  ]);
  const canManage = canManageFeatureFlags(actor);
  const environment = parseEnvironment(resolvedSearchParams?.env);
  const adminState = await getFeatureFlagAdminState({ environment });
  const flags = adminState.flags;
  const moduleFlags = flags.filter((flag) => flag.kind === "module");
  const providerFlags = flags.filter((flag) => flag.kind === "provider");
  const auditRecords = adminState.auditRecords;
  const result = resolvedSearchParams?.featureFlagResult;
  const message = resolvedSearchParams?.featureFlagMessage;

  return (
    <AdminAppShell actor={actor}>
      <AdminBackendLaneNav current="feature_flags" showIntegrations={canManage} />

      {!canManage ? (
        <RestrictedState
          title="Feature flags are restricted."
          message="Only DS Admin and Super Admin can manage module and provider feature flags."
          nextHref={getLandingRouteForActor(actor)}
          nextLabel="Go to your workspace"
        />
      ) : (
        <main className="space-y-5">
          <section className="app-surface-info rounded-[2rem] p-5">
            <p className="app-eyebrow app-eyebrow-blue">Feature flag registry</p>
            <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
              <div>
                <h1 className="text-3xl font-semibold text-slate-950">
                  Turn modules on or off without breaking unrelated work.
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  Flags are evaluated server-side. Disabled integrations return graceful fallback
                  states and must not call external APIs. Every status change requires a reason
                  and creates an audit record with actor, role, environment, key, old status,
                  new status, reason, and timestamp.
                </p>
              </div>
              <form action="/admin/feature-flags" className="rounded-2xl border border-[var(--mymedlife-border)] bg-white p-3">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Environment
                  <select
                    name="env"
                    defaultValue={environment}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                  >
                    {featureFlagEnvironments.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="mt-3 w-full rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2 text-sm font-semibold text-white">
                  Review environment
                </button>
              </form>
            </div>
          </section>

          {message ? (
            <section
              className={`rounded-2xl border p-4 text-sm font-semibold ${
                result === "success"
                  ? "border-[var(--mymedlife-border)] bg-[var(--background)] text-[var(--mymedlife-info)]"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {message}
            </section>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-4">
            <MiniStat label="Environment" value={environment} />
            <MiniStat label="Persistence" value={adminState.persistence.mode} />
            <MiniStat label="Module flags" value={`${moduleFlags.length}`} />
            <MiniStat label="Provider flags" value={`${providerFlags.length}`} />
            <MiniStat
              label="Enabled now"
              value={`${flags.filter((flag) => flag.enabled).length}`}
            />
          </section>

          <section className="rounded-2xl border border-[var(--mymedlife-border)] bg-white p-4 text-sm text-slate-600">
            <span className="font-semibold text-slate-950">Control storage:</span>{" "}
            {adminState.persistence.reason}
          </section>

          <FlagSection title="Module Flags" flags={moduleFlags} environment={environment} />
          <FlagSection title="Provider Flags" flags={providerFlags} environment={environment} />

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
            <p className="app-eyebrow app-eyebrow-blue">Independence checks</p>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <IndependenceCard
                title="Events can run without SOPs"
                detail="events_luma_points is independent from sop_workflows_next_action, so SOPs can be disabled while event/points views remain available."
              />
              <IndependenceCard
                title="Assignments and UGC are separate"
                detail="task_assignment and ugc_feed_proof each have their own fallback copy and no dependency that blocks events or staff analytics."
              />
              <IndependenceCard
                title="Providers fail closed"
                detail="Provider flags are external API boundaries. When a provider flag is disabled, server services must return fallback state before calling fetch."
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
            <p className="app-eyebrow app-eyebrow-blue">Audit log</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Recent feature flag changes
            </h2>
            <div className="mt-4 grid gap-3">
              {auditRecords.length > 0 ? (
                auditRecords.map((record) => (
                  <article
                    key={record.id}
                    className="rounded-2xl border border-slate-200 bg-[var(--background)] p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill>{record.environment}</StatusPill>
                      <StatusPill>{record.key}</StatusPill>
                      <StatusPill>{`${record.oldStatus} -> ${record.newStatus}`}</StatusPill>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-950">
                      {record.reason}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {record.actorEmail} / {record.actorRole} / {record.createdAt}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-2xl border border-slate-200 bg-[var(--background)] p-4 text-sm text-slate-600">
                  {getFeatureFlagAuditEmptyStateCopy(
                    adminState.persistence.mode,
                    environment,
                  )}
                </p>
              )}
            </div>
          </section>
        </main>
      )}
    </AdminAppShell>
  );
}

function FlagSection({
  title,
  flags,
  environment,
}: {
  title: string;
  flags: FeatureFlagResolvedState[];
  environment: FeatureFlagEnvironment;
}) {
  const definitions = getFeatureFlagDefinitions();

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
      <p className="app-eyebrow app-eyebrow-blue">{title}</p>
      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {flags.map((flag) => {
          const definition = definitions.find((item) => item.key === flag.key);
          return (
            <article
              key={flag.key}
              className="rounded-2xl border border-slate-200 bg-[var(--background)] p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill>{flag.status}</StatusPill>
                    <StatusPill>{flag.enabled ? "available" : "fallback"}</StatusPill>
                    {flag.externalApiBoundary ? <StatusPill>external boundary</StatusPill> : null}
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-slate-950">
                    {flag.label}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {definition?.description}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Fallback: {flag.gracefulFallback}
                  </p>
                  {definition?.dependencies.length ? (
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Depends on: {definition.dependencies.join(", ")}
                    </p>
                  ) : null}
                </div>
              </div>
              <form action={updateFeatureFlagAction} className="mt-4 grid gap-3 lg:grid-cols-[10rem_1fr_auto]">
                <input type="hidden" name="returnTo" value={`/admin/feature-flags?env=${environment}`} />
                <input type="hidden" name="environment" value={environment} />
                <input type="hidden" name="flagKey" value={flag.key} />
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Status
                  <select
                    name="nextStatus"
                    defaultValue={flag.status}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                  >
                    {featureFlagStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Reason
                  <input
                    name="reason"
                    required
                    minLength={8}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                    placeholder="Explain the operational reason"
                  />
                </label>
                {environment === "production" && flag.externalApiBoundary ? (
                  <div className="rounded-2xl border border-[var(--danger)]/30 bg-rose-50 p-3 lg:col-span-3">
                    <label className="flex items-start gap-2 text-xs font-semibold text-rose-700">
                      <input
                        name="confirmProduction"
                        type="checkbox"
                        className="mt-1"
                      />
                      I confirm this production-sensitive provider change has explicit Nick/DS approval and a fresh admin step-up session.
                    </label>
                    <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
                      Approval reference
                      <input
                        name="approvalReference"
                        className="mt-2 w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-slate-800"
                        placeholder="Example: Nick approved in Codex thread on 2026-06-28"
                      />
                    </label>
                  </div>
                ) : null}
                <button className="self-end rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2 text-sm font-semibold text-white">
                  Save
                </button>
              </form>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function StatusPill({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-[var(--mymedlife-border)] bg-[var(--background)] px-3 py-1 text-xs font-semibold text-[var(--mymedlife-info)]">
      {children}
    </span>
  );
}

function IndependenceCard({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-[var(--mymedlife-border)] bg-[var(--background)] p-4">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </article>
  );
}

function parseEnvironment(value: string | undefined): FeatureFlagEnvironment {
  if (featureFlagEnvironments.includes(value as FeatureFlagEnvironment)) {
    return value as FeatureFlagEnvironment;
  }

  return getCurrentFeatureEnvironment();
}
