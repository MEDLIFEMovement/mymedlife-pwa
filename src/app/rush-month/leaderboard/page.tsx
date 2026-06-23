import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { MemberRecognitionPanel } from "@/components/member-recognition-panel";
import { MemberPointsRecognitionPanel } from "@/components/member-points-recognition-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { type MemberActionRouteSource } from "@/services/member-action-route-href";
import { getMemberLeaderboardWorkspace } from "@/services/member-leaderboard-workspace";
import { getMemberRecognitionSummary } from "@/services/member-recognition";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import { getRushMonthDashboardForActor } from "@/services/rush-month-dashboard-service";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthLeaderboard");
export const dynamic = "force-dynamic";

type RushMonthLeaderboardPageProps = {
  searchParams?: Promise<{
    campaign?: string;
    source?: string;
  }>;
};

export default async function RushMonthLeaderboardPage({
  searchParams,
}: RushMonthLeaderboardPageProps) {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const memberPointsSource = parseMemberPointsSource(resolvedSearchParams?.source);
  const dashboard = getRushMonthDashboardForActor(actor, data);
  const recognition = getMemberRecognitionSummary(actor, data, dashboard.leaderboard);
  const workspace = getMemberLeaderboardWorkspace(actor, recognition);
  const isMemberLeaderboard =
    getActorSurfaceFamily(actor) === "member" && workspace.canReadLeaderboard;

  return (
    <AppShell
      actor={actor}
      hideTopHeader={isMemberLeaderboard}
      showMobileQuickItemHelpers={!isMemberLeaderboard}
      showDebugTools={!isMemberLeaderboard}
    >
      {!workspace.canReadLeaderboard ? (
        <>
          <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(145deg,#0a3b88_0%,#0b4f9b_58%,#081a3a_100%)] p-5 shadow-[0_24px_80px_rgba(2,14,38,0.32)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f7d05e]">
              {workspace.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{workspace.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/78">
              {workspace.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <SurfaceToken label="Points loop" />
              <SurfaceToken label="Recognition" />
              <SurfaceToken label="Read-only" />
            </div>
          </section>

          <RestrictedState
            title={workspace.title}
            message={workspace.summary}
            nextHref={workspace.nextStep.href}
            nextLabel={workspace.nextStep.ctaLabel}
          />
        </>
      ) : isMemberLeaderboard ? (
        <>
          <MemberPointsRecognitionPanel
            recognition={recognition}
            selectedCampaignId={resolvedSearchParams?.campaign}
            source={memberPointsSource}
          />
        </>
      ) : (
        <>
          <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(145deg,#0a3b88_0%,#0b4f9b_58%,#081a3a_100%)] p-5 shadow-[0_24px_80px_rgba(2,14,38,0.32)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f7d05e]">
              {workspace.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{workspace.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/78">
              {workspace.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <SurfaceToken label="Points loop" />
              <SurfaceToken label="Recognition" />
              <SurfaceToken label="Read-only" />
            </div>
          </section>

          <DataSourceNotice source={data.source} />

          <div className="grid gap-4 rounded-[2rem] bg-[#eef3fb] p-4 shadow-[0_18px_50px_rgba(5,24,60,0.12)]">
            <section className="app-surface-info rounded-[2rem] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="app-eyebrow app-eyebrow-blue">What should I do next?</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    {workspace.nextStep.label}
                  </h2>
                  <p className="app-copy mt-2 max-w-2xl">
                    {workspace.nextStep.summary}
                  </p>
                </div>
                <Link
                  href={workspace.nextStep.href}
                  className="inline-flex rounded-full bg-[#86efac] px-4 py-2 text-sm font-semibold text-[#14532d]"
                >
                  {workspace.nextStep.ctaLabel}
                </Link>
              </div>
            </section>

            <MemberRecognitionPanel recognition={recognition} />
          </div>

          <section className="app-surface rounded-[2rem] p-5">
            <p className="app-eyebrow app-eyebrow-slate">Safety boundary</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {workspace.safetyNotes.map((note) => (
                <p
                  key={note}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600"
                >
                  {note}
                </p>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Browser writes expected: {workspace.browserWritesExpected}. External
              writes expected: {workspace.externalWritesExpected}.
            </p>
          </section>
        </>
      )}
    </AppShell>
  );
}

function parseMemberPointsSource(value: string | undefined): MemberActionRouteSource | null {
  switch (value) {
    case "home":
    case "campaigns":
    case "events":
    case "points":
    case "profile":
      return value;
    default:
      return null;
  }
}

function SurfaceToken({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/12 bg-white/[0.08] px-3 py-1 text-xs font-semibold text-white/78">
      {label}
    </span>
  );
}
