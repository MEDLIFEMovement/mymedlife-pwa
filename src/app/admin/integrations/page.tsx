import Link from "next/link";
import { clearDsSecretStepUpAction } from "@/app/admin/integrations/actions";
import { AdminIntegrationsStepUpPanel } from "@/components/admin-integrations-step-up-panel";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { AdminAppShell } from "@/components/admin-app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { MetricCard } from "@/components/metric-card";
import { RestrictedState } from "@/components/restricted-state";
import { getAdminIntegrationsWorkspace } from "@/services/admin-integrations-workspace";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminIntegrations");
export const dynamic = "force-dynamic";

export default async function AdminIntegrationsPage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const workspace = await getAdminIntegrationsWorkspace(actor);

  return (
    <AdminAppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav current="integrations" showIntegrations />

      {!workspace.guard.canRenderLockedState && !workspace.canReadWorkspace ? (
        <RestrictedState
          title={workspace.guard.title}
          message={workspace.guard.message}
          nextHref="/admin"
          nextLabel="Back to admin"
        />
      ) : !workspace.canReadWorkspace ? (
        <AdminIntegrationsStepUpPanel
          title={workspace.guard.title}
          message={workspace.guard.message}
        />
      ) : (
        <>
          <section className="app-surface-info overflow-hidden rounded-[2rem] p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mymedlife-primary-button)]">
                  DS/Admin integrations
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-950">
                  {workspace.title}
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {workspace.summary}
                </p>
                <p className="mt-4 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  Write-only secrets, masked hints, audited changes
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={workspace.nextStep.href}
                  className="rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--mymedlife-info)]"
                >
                  {workspace.nextStep.label}
                </Link>
                <form action={clearDsSecretStepUpAction}>
                  <input type="hidden" name="returnTo" value="/admin/integrations" />
                  <button
                    type="submit"
                    className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[var(--mymedlife-border)] hover:bg-[var(--mymedlife-surface-hover)] hover:text-slate-950"
                  >
                    Lock secure area
                  </button>
                </form>
              </div>
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-3">
            <MetricCard label="Providers" value={String(workspace.providerCards.length)} note="HubSpot, Luma, Power BI, BigQuery/GCP, OpenAI, n8n" />
            <MetricCard
              label="Configured envs"
              value={String(
                workspace.providerCards.reduce((sum, provider) => {
                  return sum + provider.configuredCount;
                }, 0),
              )}
              note="Local, staging, and production metadata rows"
            />
            <MetricCard
              label="Audit rows"
              value={String(workspace.auditCount)}
              note="Readonly safety history for secure actions"
            />
          </section>

          <section className="rounded-[1.6rem] border border-[var(--mymedlife-border)]/20 bg-[var(--mymedlife-badge-background)] px-4 py-3 text-sm leading-6 text-slate-700">
            Secrets are write-only. Raw values are never shown after save. All changes are audited and production edits require extra confirmation.
          </section>

          <section className="grid gap-3 xl:grid-cols-2">
            {workspace.providerCards.map((card) => (
              <article
                key={card.provider.key}
                className="app-surface flex h-full flex-col rounded-[1.6rem] p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="app-eyebrow app-eyebrow-slate">{card.provider.ownerTeam}</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-950">
                      {card.provider.displayName}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {card.provider.description}
                    </p>
                  </div>
                  <Link
                    href={`/admin/integrations/${card.provider.key}`}
                    className="rounded-full bg-[var(--mymedlife-primary-button)] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[var(--mymedlife-info)]"
                  >
                    Configure
                  </Link>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200 bg-[var(--mymedlife-badge-background)] px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {card.configuredCount} configured
                  </span>
                  <span className="rounded-full border border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] px-2.5 py-1 text-xs font-semibold text-[var(--mymedlife-info)]">
                    {card.errorCount} with errors
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
                    Last test {card.latestTestedAt ?? "not run"}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {card.environments.map((environment) => (
                    <div
                      key={`${card.provider.key}-${environment.environment}`}
                      className="rounded-2xl border border-slate-200 bg-[var(--mymedlife-badge-background)] p-3 shadow-[0_8px_20px_rgb(var(--mymedlife-shadow-rgb)/0.04)]"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {environment.environment}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">
                        {environment.status}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {environment.maskedHint ?? "No credential configured"}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Last test: {environment.lastTestStatus.replaceAll("_", " ")}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {card.provider.risks.map((risk) => (
                    <span
                      key={`${card.provider.key}-${risk}`}
                      className="rounded-full border border-slate-200 bg-[var(--mymedlife-badge-background)] px-2.5 py-1 text-xs font-semibold text-slate-600"
                    >
                      {risk}
                      </span>
                  ))}
                </div>
              </article>
            ))}
          </section>

          <section className="app-surface rounded-[1.6rem] p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="app-eyebrow app-eyebrow-slate">What this console owns</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  One place for provider posture, not a secret dump.
                </h2>
              </div>
              <p className="app-copy max-w-2xl">
                DS Admin keeps the metadata, safe tests, disable actions, and audit trail in one reviewable place while the browser stays away from raw credentials.
              </p>
            </div>
          </section>
        </>
      )}
    </AdminAppShell>
  );
}
