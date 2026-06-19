import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { ProductionLaunchGatePanel } from "@/components/production-launch-gate-panel";
import { RestrictedState } from "@/components/restricted-state";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getProductionLaunchGate } from "@/services/production-launch-gate";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminLaunchGate");
export const dynamic = "force-dynamic";

export default async function AdminLaunchGatePage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const gate = getProductionLaunchGate(actor);
  const nextStep = getNextStep(actor);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />

      {!gate.canReadGate ? (
        <RestrictedState
          title={gate.title}
          message={gate.summary}
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-100">
                  Production launch gate
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white">
                  {gate.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
                  Review the exact evidence still missing before myMEDLIFE can
                  move from local Rush Month MVP review to a controlled live
                  pilot. This route is a checklist, not approval to launch.
                </p>
              </div>
              <Link
                href={nextStep.href}
                className="w-fit rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-[#241605]"
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
    </AppShell>
  );
}

function getNextStep(actor: LocalActorContext) {
  if (actor.audience === "ds_admin") {
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
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
