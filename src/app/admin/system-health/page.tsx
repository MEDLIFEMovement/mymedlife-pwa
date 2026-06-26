import Link from "next/link";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { AdminSystemHealthReviewPanel } from "@/components/admin-system-health-review-panel";
import { AdminAppShell } from "@/components/admin-app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { RestrictedState } from "@/components/restricted-state";
import { getAdminSystemHealthReview } from "@/services/admin-system-health-review";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import {
  canReadAdminIntegrationsSecurity,
  getActorSurfaceFamily,
} from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminSystemHealth");
export const dynamic = "force-dynamic";

export default async function AdminSystemHealthPage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const review = getAdminSystemHealthReview(actor, data);
  const nextStep = getNextStep(actor);

  return (
    <AdminAppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav
        current="system_health"
        showIntegrations={canReadAdminIntegrationsSecurity(actor)}
      />

      {!review.canReadReview ? (
        <RestrictedState
          title={review.title}
          message={review.summary}
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2563eb]">
                  Admin system health
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-950">
                  {review.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  Review route coverage, data source posture, environment flags,
                  audit readback, outbox safety, auth, storage, integrations,
                  monitoring, backup, and incident ownership before any live pilot.
                </p>
              </div>
              <Link
                href={nextStep.href}
                className="w-fit rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
              >
                {nextStep.label}
              </Link>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MiniStat label="Checks" value={`${review.counts.total}`} />
            <MiniStat label="Local" value={`${review.counts.localReady}`} />
            <MiniStat label="Mock" value={`${review.counts.mockSafe}`} />
            <MiniStat label="Review" value={`${review.counts.needsReview}`} />
            <MiniStat
              label="Blocked"
              value={`${review.counts.blockedBeforeLive}`}
            />
          </section>

          <AdminSystemHealthReviewPanel review={review} />
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
    label: "Open operations runbook",
    href: "/admin",
  };
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2563eb]">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
