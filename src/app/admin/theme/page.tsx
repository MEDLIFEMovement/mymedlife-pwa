import Link from "next/link";
import {
  clearRolloutControlStepUpAction,
  updateThemeSettingAction,
  verifyRolloutControlStepUpAction,
} from "@/app/admin/actions/rollout-controls";
import { AdminAppShell } from "@/components/admin-app-shell";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { DataSourceNotice } from "@/components/data-source-notice";
import { MetricCard } from "@/components/metric-card";
import { RestrictedState } from "@/components/restricted-state";
import { StatusPill, SurfacePanel } from "@/components/visual-primitives";
import { getAdminThemeWorkspace } from "@/services/admin-rollout-controls-workspace";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminTheme");
export const dynamic = "force-dynamic";

export default async function AdminThemePage({
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
  const workspace = await getAdminThemeWorkspace(actor, {
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
      <AdminBackendLaneNav current="theme" showIntegrations />

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
          nextHref="/login?next=/admin/theme"
          nextLabel="Sign in"
        />
      ) : (
        <>
          <SurfacePanel tone="info" className="overflow-hidden rounded-[2rem] p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2563eb]">
                    Design controls
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
              label="Tokens"
              value={String(workspace.cards.length)}
              note="Core white-blue shell values"
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
              note="Latest persisted theme changes"
            />
          </section>

          <SurfacePanel className="rounded-[1.7rem] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="app-eyebrow app-eyebrow-slate">Theme posture</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  The app shell stays white-blue on purpose.
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Theme settings are now persisted so color changes can be reviewed
                  by environment, explained with reasons, and audited. Production
                  theme changes still require a fresh step-up and PRODUCTION
                  confirmation.
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
                  <input type="hidden" name="returnTo" value="/admin/theme" />
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
                  <button
                    type="submit"
                    className="rounded-full bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
                  >
                    Refresh step-up
                  </button>
                </form>
                <form action={clearRolloutControlStepUpAction} className="mt-3">
                  <input type="hidden" name="returnTo" value="/admin/theme" />
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
                <div className="max-w-3xl">
                  <p className="app-eyebrow app-eyebrow-slate">{card.definition.group}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    {card.definition.label}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {card.definition.description}
                  </p>
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
                            {environmentView.value}
                          </p>
                        </div>
                        <StatusPill tone="slate">{environmentView.source}</StatusPill>
                      </div>

                      <div
                        className="mt-3 h-12 rounded-[1rem] border border-slate-200"
                        style={{ background: environmentView.value }}
                      />

                      <p className="mt-3 text-xs leading-5 text-slate-500">
                        Updated {environmentView.updatedAt ?? "from default posture"}
                      </p>

                      <form action={updateThemeSettingAction} className="mt-4 grid gap-3">
                        <input type="hidden" name="returnTo" value="/admin/theme" />
                        <input type="hidden" name="settingKey" value={card.definition.key} />
                        <input
                          type="hidden"
                          name="environment"
                          value={environmentView.environment}
                        />
                        <label className="grid gap-2 text-sm font-semibold text-slate-950">
                          Value
                          <input
                            name="value"
                            type={card.definition.inputType}
                            defaultValue={environmentView.value}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#2563eb]"
                          />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-950">
                          Reason
                          <textarea
                            name="reason"
                            rows={3}
                            placeholder="Why is this token changing?"
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
                          className="rounded-full bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
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
                  Theme changes are reviewable, not mysterious.
                </h2>
              </div>
              <p className="app-copy max-w-2xl">
                Every persisted theme update records a reason so launch reviewers can
                see when the look changed and why.
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
                  No persisted theme audit rows are visible yet for this session.
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
