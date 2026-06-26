import Link from "next/link";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { AdminAppShell } from "@/components/admin-app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { RestrictedState } from "@/components/restricted-state";
import { StakeholderReviewPlanPanel } from "@/components/stakeholder-review-plan-panel";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canReadAdminIntegrationsSecurity } from "@/services/role-visibility";
import { getStakeholderReviewPlan } from "@/services/stakeholder-review-plan";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminReviewPath");
export const dynamic = "force-dynamic";

export default async function AdminReviewPathPage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const plan = getStakeholderReviewPlan(actor);

  return (
    <AdminAppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav
        current="review_path"
        showIntegrations={canReadAdminIntegrationsSecurity(actor)}
      />

      {!plan.canReadPlan ? (
        <RestrictedState
          title={plan.title}
          message={plan.summary}
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      ) : (
        <>
          <section className="app-surface-info rounded-[2rem] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2563eb]">
                  Stakeholder review path
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-950">
                  {plan.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  Use this route-by-route sequence to review the local MVP with
                  the right fake actor emails before approving production auth,
                  writes, uploads, integrations, or a student pilot.
                </p>
              </div>
              <Link
                href="/admin/nick-review"
                className="w-fit rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
              >
                Open Nick review
              </Link>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <MiniStat label="Steps" value={`${plan.counts.steps}`} />
            <MiniStat label="Writes" value={`${plan.counts.browserWritesExpected}`} />
            <MiniStat label="Sends" value={`${plan.counts.externalWritesExpected}`} />
          </section>

          <StakeholderReviewPlanPanel plan={plan} />
        </>
      )}
    </AdminAppShell>
  );
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
