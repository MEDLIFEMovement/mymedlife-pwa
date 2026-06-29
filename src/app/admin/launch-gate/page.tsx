import Link from "next/link";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { AdminAppShell } from "@/components/admin-app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { ProductionLaunchGatePanel } from "@/components/production-launch-gate-panel";
import { RestrictedState } from "@/components/restricted-state";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getProductionLaunchGate } from "@/services/production-launch-gate";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import {
  canReadAdminIntegrationsSecurity,
  getActorSurfaceFamily,
} from "@/services/role-visibility";
import { getStagingLumaEventLoopReadModel } from "@/services/staging-luma-event-loop";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminLaunchGate");
export const dynamic = "force-dynamic";

export default async function AdminLaunchGatePage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const lumaActivation = getStagingLumaEventLoopReadModel({
    mode: "staging",
    data,
  });
  const gate = getProductionLaunchGate(actor, process.env, {
    lumaReadModel: lumaActivation,
  });
  const nextStep = getNextStep(actor);

  return (
    <AdminAppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav
        current="launch_gate"
        showIntegrations={canReadAdminIntegrationsSecurity(actor)}
      />

      {!gate.canReadGate ? (
        <RestrictedState
          title={gate.title}
          message={gate.summary}
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      ) : (
        <>
          <section className="app-surface-info rounded-[2rem] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mymedlife-primary-button)]">
                  Production launch gate
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-950">
                  {gate.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  Review the exact evidence still missing before myMEDLIFE can
                  move from local Rush Month MVP review to a controlled live
                  pilot. This route is a checklist, not approval to launch.
                </p>
              </div>
              <Link
                href={nextStep.href}
                className="w-fit rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--mymedlife-info)]"
              >
                {nextStep.label}
              </Link>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <MiniStat label="Gates" value={`${gate.counts.total}`} />
            <MiniStat label="Local" value={`${gate.counts.localEvidenceReady}`} />
            <MiniStat label="Blocked" value={`${gate.counts.blockedBeforeLive}`} />
            <MiniStat
              label="Evidence"
              value={`${gate.counts.launchEvidenceChecks}`}
            />
            <MiniStat label="Launch" value={gate.launchReady ? "yes" : "no"} />
            <MiniStat label="Writes" value={`${gate.browserWritesEnabled}`} />
          </section>

          <ProductionLaunchGatePanel gate={gate} />
        </>
      )}
    </AdminAppShell>
  );
}

function getNextStep(actor: LocalActorContext) {
  if (getActorSurfaceFamily(actor) === "ds_admin") {
    return {
      label: "Open integration outbox",
      href: "/admin/integration-outbox",
    };
  }

  return {
    label: "Open system health",
    href: "/admin/system-health",
  };
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
