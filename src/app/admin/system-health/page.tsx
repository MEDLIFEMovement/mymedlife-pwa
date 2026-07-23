import Link from "next/link";
import { AdminSystemHealthReviewPanel } from "@/components/admin-system-health-review-panel";
import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { FigmaAdminShellFrame } from "@/components/figma-admin-panel";
import { RestrictedState } from "@/components/restricted-state";
import { WorkspaceAccountMenu } from "@/components/workspace-account-menu";
import { getAdminSystemHealthReview } from "@/services/admin-system-health-review";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
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

  if (!review.canReadReview) {
    return (
      <AppShell actor={actor}>
        <DataSourceNotice source={data.source} />
        <RestrictedState
          title={review.title}
          message={review.summary}
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      </AppShell>
    );
  }

  return (
    <>
      <WorkspaceAccountMenu actor={actor} currentWorkspace="admin_backend" />
      <FigmaAdminShellFrame
        activeView="health"
        title="System Health"
        subtitle="Operational health readback"
      >
        <div className="space-y-5 p-6">
          <DataSourceNotice source={data.source} />
          <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-lime-100">
                  Admin system health
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white">
                  {review.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
                  Review route coverage, data source posture, environment flags,
                  audit readback, outbox safety, auth, storage, integrations,
                  monitoring, backup, and incident ownership before any live pilot.
                </p>
              </div>
              <Link
                href={nextStep.href}
                className="w-fit rounded-full bg-lime-300 px-4 py-2 text-sm font-semibold text-[#13230b]"
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
        </div>
      </FigmaAdminShellFrame>
    </>
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
    label: "Open operations runbook",
    href: "/admin",
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
