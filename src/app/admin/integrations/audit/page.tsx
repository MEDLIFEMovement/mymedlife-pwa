import { AdminIntegrationsStepUpPanel } from "@/components/admin-integrations-step-up-panel";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { AdminAppShell } from "@/components/admin-app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { RestrictedState } from "@/components/restricted-state";
import { getAdminIntegrationAuditWorkspace } from "@/services/admin-integrations-workspace";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminIntegrationAudit");
export const dynamic = "force-dynamic";

export default async function AdminIntegrationAuditPage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const workspace = await getAdminIntegrationAuditWorkspace(actor);

  return (
    <AdminAppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav current="integrations" showIntegrations />

      {!workspace.guard.canRenderLockedState && !workspace.canReadWorkspace ? (
        <RestrictedState
          title={workspace.guard.title}
          message={workspace.guard.message}
          nextHref={workspace.nextStep.href}
          nextLabel={workspace.nextStep.label}
        />
      ) : !workspace.canReadWorkspace ? (
        <AdminIntegrationsStepUpPanel
          title={workspace.guard.title}
          message={workspace.guard.message}
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-[var(--mymedlife-border)] bg-[var(--background)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mymedlife-primary-button)]">
              Integrations audit
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">
              {workspace.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {workspace.summary}
            </p>
          </section>

          <section className="grid gap-3">
            {workspace.rows.length === 0 ? (
              <section className="app-surface rounded-[1.6rem] p-5">
                <p className="text-sm leading-6 text-slate-600">
                  No secure integration actions have been recorded yet in this local review session.
                </p>
              </section>
            ) : (
              workspace.rows.map((row) => (
                <article
                  key={row.id}
                  className="app-surface rounded-[1.6rem] p-4"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    <span>{row.action.replaceAll("_", " ")}</span>
                    <span>{row.actorRole}</span>
                    <span>{row.result}</span>
                    <span>{row.environment ?? "all envs"}</span>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-slate-950">
                    {row.actorEmail}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{row.reason}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(row.metadataSummary).map(([key, value]) => (
                      <span
                        key={`${row.id}-${key}`}
                        className="rounded-full border border-slate-200 bg-[var(--mymedlife-badge-background)] px-2.5 py-1 text-xs font-semibold text-slate-600"
                      >
                        {key.replaceAll("_", " ")}: {value}
                      </span>
                    ))}
                  </div>
                </article>
              ))
            )}
          </section>
        </>
      )}
    </AdminAppShell>
  );
}
