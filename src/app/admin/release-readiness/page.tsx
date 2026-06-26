import Link from "next/link";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { AdminAppShell } from "@/components/admin-app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { DiscourseBakeoffPanel } from "@/components/discourse-bakeoff-panel";
import { MvpReleaseReadinessPanel } from "@/components/mvp-release-readiness-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getDiscourseBakeoffEvaluation } from "@/services/discourse-bakeoff-evaluation";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getMvpReleaseReadinessSummary } from "@/services/mvp-release-readiness";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import {
  canReadAdminIntegrationsSecurity,
  getActorSurfaceFamily,
} from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminReleaseReadiness");
export const dynamic = "force-dynamic";

export default async function AdminReleaseReadinessPage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const summary = getMvpReleaseReadinessSummary(actor);
  const bakeoff = getDiscourseBakeoffEvaluation();
  const nextStep = getNextStep(actor);

  return (
    <AdminAppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav
        current="release_readiness"
        showIntegrations={canReadAdminIntegrationsSecurity(actor)}
      />

      {!summary.canReadSummary ? (
        <RestrictedState
          title={summary.title}
          message={summary.plainEnglishVerdict}
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2563eb]">
                  Release readiness
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-950">
                  {summary.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  Review what is ready for local stakeholder review, what still
                  blocks a live student launch, and which approvals should happen
                  next. This route keeps the launch posture plain before deeper
                  admin review.
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
            <MiniStat
              label="Local review"
              value={summary.localReviewReady ? "yes" : "no"}
            />
            <MiniStat
              label="Live launch"
              value={summary.liveLaunchReady ? "yes" : "no"}
            />
            <MiniStat label="Ready" value={`${summary.achievements.length}`} />
            <MiniStat label="Blocked" value={`${summary.blockers.length}`} />
            <MiniStat label="Writes" value={`${summary.browserWritesEnabled}`} />
          </section>

          <MvpReleaseReadinessPanel summary={summary} />
          <DiscourseBakeoffPanel evaluation={bakeoff} />
        </>
      )}
    </AdminAppShell>
  );
}

function getNextStep(actor: LocalActorContext) {
  if (getActorSurfaceFamily(actor) === "ds_admin") {
    return {
      label: "Open database security",
      href: "/admin/database-security",
    };
  }

  return {
    label: "Open Nick review",
    href: "/admin/nick-review",
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
