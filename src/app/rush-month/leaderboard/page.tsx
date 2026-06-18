import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { MemberRecognitionPanel } from "@/components/member-recognition-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getMemberLeaderboardWorkspace } from "@/services/member-leaderboard-workspace";
import { getMemberRecognitionSummary } from "@/services/member-recognition";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getRushMonthDashboardForActor } from "@/services/rush-month-dashboard-service";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthLeaderboard");
export const dynamic = "force-dynamic";

export default async function RushMonthLeaderboardPage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const dashboard = getRushMonthDashboardForActor(actor, data);
  const recognition = getMemberRecognitionSummary(actor, data, dashboard.leaderboard);
  const workspace = getMemberLeaderboardWorkspace(actor, recognition);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />

      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
          {workspace.eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">{workspace.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
          {workspace.summary}
        </p>
      </section>

      {!workspace.canReadLeaderboard ? (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref={workspace.nextStep.href}
          nextLabel={workspace.nextStep.ctaLabel}
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
                  What should I do next?
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {workspace.nextStep.label}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/68">
                  {workspace.nextStep.summary}
                </p>
              </div>
              <Link
                href={workspace.nextStep.href}
                className="inline-flex rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
              >
                {workspace.nextStep.ctaLabel}
              </Link>
            </div>
          </section>

          <MemberRecognitionPanel recognition={recognition} />
        </>
      )}

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
          Safety boundary
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {workspace.safetyNotes.map((note) => (
            <p
              key={note}
              className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white/64"
            >
              {note}
            </p>
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-white/46">
          Browser writes expected: {workspace.browserWritesExpected}. External
          writes expected: {workspace.externalWritesExpected}.
        </p>
      </section>
    </AppShell>
  );
}
