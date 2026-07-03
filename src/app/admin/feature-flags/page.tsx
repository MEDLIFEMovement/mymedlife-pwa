import Link from "next/link";
import {
  clearRolloutControlStepUpAction,
  updateFeatureFlagAction,
  verifyRolloutControlStepUpAction,
} from "@/app/admin/actions/rollout-controls";
import { AdminAppShell } from "@/components/admin-app-shell";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { DataSourceNotice } from "@/components/data-source-notice";
import { MetricCard } from "@/components/metric-card";
import { RestrictedState } from "@/components/restricted-state";
import { StatusPill, SurfacePanel } from "@/components/visual-primitives";
import {
  getAdminFeatureFlagsWorkspace,
  getFeatureFlagPolicyNote,
} from "@/services/admin-rollout-controls-workspace";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminFeatureFlags");
export const dynamic = "force-dynamic";

export default async function AdminFeatureFlagsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [actor, data, resolvedSearchRaw] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
    searchParams ?? Promise.resolve({}),
  ]);
  const resolvedSearch = resolvedSearchRaw as Record<
    string,
    string | string[] | undefined
  >;
  const workspace = await getAdminFeatureFlagsWorkspace(actor, {
    result: firstSearchValue(resolvedSearch.result),
    message: firstSearchValue(resolvedSearch.message),
    item: firstSearchValue(resolvedSearch.item),
    environment: firstSearchValue(resolvedSearch.environment),
  });
  const persistenceBadge = workspace.persistenceWarning
    ? {
        tone: "yellow" as const,
        label: "Awaiting persistence proof",
      }
    : {
        tone: "blue" as const,
        label: "Supabase-backed",
      };

  return (
    <AdminAppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav current="feature_flags" showIntegrations />

      {workspace.guard.state === "restricted" ? (
        <RestrictedState
          title={workspace.guard.title}
          message={workspace.guard.message}
          nextHref="/admin"
          nextLabel="Back to admin"
        />
      ) : workspace.guard.state === "sign_in_required" ? (
        <RestrictedState
          title={workspace.guard.title}
          message={workspace.guard.message}
          nextHref="/login?next=/admin/feature-flags"
          nextLabel="Sign in"
        />
      ) : (
        <>
          <SurfacePanel tone="info" className="overflow-hidden rounded-[2rem] p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2563eb]">
                    Rollout controls
                  </p>
                  <StatusPill tone={persistenceBadge.tone}>
                    {persistenceBadge.label}
                  </StatusPill>
                </div>
                <h1 className="mt-3 text-3xl font-semibold text-slate-950">
                  {workspace.title}
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {workspace.summary}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={workspace.nextStep.href}
                  className="rounded-full bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
                >
                  {workspace.nextStep.label}
                </Link>
              </div>
            </div>
          </SurfacePanel>

          {workspace.resultBanner ? (
            <section
              className={[
                "rounded-[1.5rem] border px-4 py-3 text-sm leading-6",
                workspace.resultBanner.tone === "success"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : workspace.resultBanner.tone === "warning"
                    ? "border-[#bfdbfe] bg-[#eef5ff] text-[#1d4ed8]"
                    : "border-rose-200 bg-rose-50 text-rose-700",
              ].join(" ")}
            >
              <p className="font-semibold">{workspace.resultBanner.title}</p>
              <p className="mt-1">{workspace.resultBanner.message}</p>
            </section>
          ) : null}

          {workspace.persistenceWarning ? (
            <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              <p className="font-semibold">Persistence not available yet</p>
              <p className="mt-1">{workspace.persistenceWarning}</p>
            </section>
          ) : null}

          <section className="grid gap-3 md:grid-cols-3">
            <MetricCard
              label="Flags"
              value={String(workspace.cards.length)}
              note="Review, write, events, and integration posture"
            />
            <MetricCard
              label="Production step-up"
              value={
                workspace.guard.stepUpStatus === "verified" ? "Fresh" : "Locked"
              }
              note={workspace.guard.stepUpMessage}
            />
            <MetricCard
              label="Audit rows"
              value={String(workspace.recentAuditRows.length)}
              note="Latest persisted rollout changes"
            />
          </section>

          <SurfacePanel className="rounded-[1.7rem] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="app-eyebrow app-eyebrow-slate">Production protection</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Dangerous flags stay narrow on purpose.
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Production changes require a signed-in DS/Admin session, a reason,
                  PRODUCTION confirmation where needed, and a fresh step-up. Luma,
                  HubSpot, n8n, warehouse, and AI production switches stay blocked
                  here until a separate approval expands scope.
                </p>
              </div>

              <div className="w-full max-w-md rounded-[1.5rem] border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Fresh verification
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {workspace.guard.stepUpMessage}
                </p>
                <form action={verifyRolloutControlStepUpAction} className="mt-4 grid gap-3">
                  <input type="hidden" name="returnTo" value="/admin/feature-flags" />
                  <label className="grid gap-2 text-sm font-semibold text-slate-950">
                    Seed password
                    <input
                      name="password"
                      type="password"
                      defaultValue="password"
                      autoComplete="current-password"
                      className="rounded-2xl border border-slate-200 bg-[#f8fbff] px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#2563eb]"
                    />
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className="rounded-full bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
                    >
                      Refresh step-up
                    </button>
                  </div>
                </form>
                <form action={clearRolloutControlStepUpAction} className="mt-3">
                  <input type="hidden" name="returnTo" value="/admin/feature-flags" />
                  <button
                    type="submit"
                    className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950"
                  >
                    Lock production controls
                  </button>
                </form>
              </div>
            </div>
          </SurfacePanel>

          <section className="grid gap-4">
            {workspace.cards.map((card) => (
              <SurfacePanel
                key={card.definition.key}
                className="rounded-[1.75rem] p-5"
              >
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="app-eyebrow app-eyebrow-slate">
                        {card.definition.category}
                      </p>
                      <StatusPill
                        tone={
                          card.definition.approvalPolicy === "production_blocked"
                            ? "amber"
                            : card.definition.approvalPolicy ===
                                "production_confirmation"
                              ? "yellow"
                              : "blue"
                        }
                      >
                        {card.definition.approvalPolicy.replaceAll("_", " ")}
                      </StatusPill>
                      {card.definition.controlsExternalWrite ? (
                        <StatusPill tone="slate">External write surface</StatusPill>
                      ) : null}
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                      {card.definition.label}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {card.definition.description}
                    </p>
                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      {getFeatureFlagPolicyNote(card.definition.approvalPolicy)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-3">
                  {card.environments.map((environmentView) => (
                    <article
                      key={`${card.definition.key}-${environmentView.environment}`}
                      className="app-surface-soft rounded-[1.4rem] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            {environmentView.environment}
                          </p>
                          <p className="mt-2 text-lg font-semibold text-slate-950">
                            {environmentView.enabled ? "Enabled" : "Disabled"}
                          </p>
                        </div>
                        <StatusPill tone={environmentView.enabled ? "blue" : "slate"}>
                          {environmentView.source}
                        </StatusPill>
                      </div>

                      <p className="mt-3 text-xs leading-5 text-slate-500">
                        Updated {environmentView.updatedAt ?? "from default posture"}
                      </p>
                      {environmentView.warning ? (
                        <p className="mt-3 rounded-[1rem] border border-[#bfdbfe] bg-[#eef5ff] px-3 py-2 text-xs leading-5 text-[#1d4ed8]">
                          {environmentView.warning}
                        </p>
                      ) : null}

                      <form action={updateFeatureFlagAction} className="mt-4 grid gap-3">
                        <input type="hidden" name="returnTo" value="/admin/feature-flags" />
                        <input type="hidden" name="flagKey" value={card.definition.key} />
                        <input
                          type="hidden"
                          name="environment"
                          value={environmentView.environment}
                        />
                        <label className="grid gap-2 text-sm font-semibold text-slate-950">
                          Target state
                          <select
                            name="enabled"
                            defaultValue={environmentView.enabled ? "true" : "false"}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-[#2563eb]"
                          >
                            <option value="false">Disabled</option>
                            <option value="true">Enabled</option>
                          </select>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-950">
                          Reason
                          <textarea
                            name="reason"
                            rows={3}
                            placeholder="Why is this changing right now?"
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#2563eb]"
                          />
                        </label>
                        {environmentView.environment === "production" ? (
                          <label className="grid gap-2 text-sm font-semibold text-slate-950">
                            Type PRODUCTION
                            <input
                              name="productionConfirmation"
                              type="text"
                              placeholder="PRODUCTION"
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#2563eb]"
                            />
                          </label>
                        ) : null}
                        <button
                          type="submit"
                          disabled={!environmentView.canAttemptEnable}
                          className="rounded-full bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Save {environmentView.environment}
                        </button>
                      </form>
                    </article>
                  ))}
                </div>
              </SurfacePanel>
            ))}
          </section>

          <SurfacePanel className="rounded-[1.75rem] p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="app-eyebrow app-eyebrow-slate">Audit evidence</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Real rollout changes leave real audit rows.
                </h2>
              </div>
              <p className="app-copy max-w-2xl">
                Every persisted flag change writes an audit row with a reason so we
                can trace who widened or narrowed the pilot.
              </p>
            </div>

            <div className="mt-4 grid gap-3">
              {workspace.recentAuditRows.length > 0 ? (
                workspace.recentAuditRows.map((row) => (
                  <article
                    key={row.id}
                    className="app-surface-soft rounded-[1.25rem] p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone="slate">{row.action.replaceAll("_", " ")}</StatusPill>
                      <span className="text-xs text-slate-500">{row.createdAt}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {row.reason ?? "No reason recorded."}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-[1.2rem] border border-dashed border-slate-200 px-4 py-5 text-sm leading-6 text-slate-500">
                  No persisted rollout audit rows are visible yet for this session.
                </p>
              )}
            </div>
          </SurfacePanel>
        </>
      )}
    </AdminAppShell>
  );
}

function firstSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
