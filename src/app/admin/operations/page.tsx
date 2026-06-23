import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { ProductionOperationsRunbookPanel } from "@/components/production-operations-runbook-panel";
import { RestrictedState } from "@/components/restricted-state";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getProductionOperationsRunbook } from "@/services/production-operations-runbook";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminOperations");
export const dynamic = "force-dynamic";

export default async function AdminOperationsPage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const runbook = getProductionOperationsRunbook(actor);
  const nextStep = getNextStep(actor);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />

      {!runbook.canReadRunbook ? (
        <RestrictedState
          title={runbook.title}
          message={runbook.summary}
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-100">
                  Production operations
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white">
                  {runbook.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
                  Review incident triage, auth access recovery, database/RLS
                  recovery, write rollback, proof moderation, integration
                  recovery, mobile PWA support, and pilot communications before
                  any live student launch.
                </p>
              </div>
              <Link
                href={nextStep.href}
                className="w-fit rounded-full bg-teal-300 px-4 py-2 text-sm font-semibold text-[#05201d]"
              >
                {nextStep.label}
              </Link>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <MiniStat label="Runbooks" value={`${runbook.counts.total}`} />
            <MiniStat label="Ready" value={`${runbook.counts.localRunbookReady}`} />
            <MiniStat
              label="Blocked"
              value={`${runbook.counts.blockedBeforeLive}`}
            />
            <MiniStat label="Launch" value={runbook.launchReady ? "yes" : "no"} />
            <MiniStat label="Sends" value={`${runbook.externalWritesExpected}`} />
            <MiniStat label="Secrets" value={`${runbook.secretsShown}`} />
          </section>

          <ProductionOperationsRunbookPanel runbook={runbook} />
        </>
      )}
    </AppShell>
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
    label: "Choose pilot scope",
    href: "/admin/pilot-scope",
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
