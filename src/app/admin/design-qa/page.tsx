import Link from "next/link";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { AdminAppShell } from "@/components/admin-app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { DesignQaReadinessPanel } from "@/components/design-qa-readiness-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getDesignQaReadiness } from "@/services/design-qa-readiness";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canReadAdminIntegrationsSecurity } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminDesignQa");
export const dynamic = "force-dynamic";

export default async function AdminDesignQaPage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const readiness = getDesignQaReadiness(actor);

  return (
    <AdminAppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav
        current="design_qa"
        showIntegrations={canReadAdminIntegrationsSecurity(actor)}
      />

      {!readiness.canReadReadiness ? (
        <RestrictedState
          title={readiness.title}
          message={readiness.summary}
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-[#bfdbfe] bg-[#f8fbff] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2563eb]">
                  Figma and mobile QA
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-950">
                  {readiness.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  Compare the local app to the Figma direction, phone viewport,
                  accessibility baseline, role complexity, and pilot-safety copy
                  before anyone calls the PWA launch-ready.
                </p>
              </div>
              <Link
                href="/admin/system-health"
                className="w-fit rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
              >
                Open system health
              </Link>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <MiniStat label="Items" value={`${readiness.counts.total}`} />
            <MiniStat
              label="Ready"
              value={`${readiness.counts.readyForLocalReview}`}
            />
            <MiniStat
              label="Review"
              value={`${readiness.counts.needsVisualReview}`}
            />
            <MiniStat
              label="Blocked"
              value={`${readiness.counts.blockedBeforeLaunch}`}
            />
            <MiniStat
              label="Mobile checks"
              value={`${readiness.counts.mobileSmokeChecks}`}
            />
            <MiniStat
              label="A11y checks"
              value={`${readiness.counts.accessibilitySmokeChecks}`}
            />
            <MiniStat
              label="Device checks"
              value={`${readiness.counts.devicePwaSmokeChecks}`}
            />
            <MiniStat
              label="Writes"
              value={`${readiness.counts.browserWritesExpected}`}
            />
          </section>

          <DesignQaReadinessPanel readiness={readiness} />
        </>
      )}
    </AdminAppShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#bfdbfe] bg-white px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
