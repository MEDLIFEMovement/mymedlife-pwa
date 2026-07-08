import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AdminReviewRouteBanner } from "@/components/admin-review-route-banner";
import { DataSourceNotice } from "@/components/data-source-notice";
import { DiscourseBakeoffPanel } from "@/components/discourse-bakeoff-panel";
import { MvpReleaseReadinessPanel } from "@/components/mvp-release-readiness-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getDiscourseBakeoffEvaluation } from "@/services/discourse-bakeoff-evaluation";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getMvpReleaseReadinessSummary } from "@/services/mvp-release-readiness";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
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
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />

      {!summary.canReadSummary ? (
        <RestrictedState
          title={summary.title}
          message={summary.plainEnglishVerdict}
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      ) : (
        <>
          <AdminReviewRouteBanner
            activeLabel="Overview"
            summary="Keep the Command Center and DS Admin menu depth visible while release posture, blocked writes, and next review handoffs stay plain and honest."
          />

          <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-100">
                  Release readiness
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white">
                  {summary.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
                  Review what is ready for local stakeholder review, what still
                  blocks a live student launch, and which approvals should happen
                  next. This route keeps the launch posture plain before deeper
                  admin review.
                </p>
              </div>
              <Link
                href={nextStep.href}
                className="w-fit rounded-full bg-rose-300 px-4 py-2 text-sm font-semibold text-[#2a0911]"
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
    </AppShell>
  );
}

function getNextStep(actor: LocalActorContext) {
  if (actor.audience === "ds_admin") {
    return {
      label: "Open database security review",
      href: "/admin/database-security",
    };
  }

  return {
    label: "Open Nick review packet",
    href: "/admin/nick-review",
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
