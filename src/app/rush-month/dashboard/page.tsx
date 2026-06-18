import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AssignmentCard } from "@/components/assignment-card";
import { DataSourceNotice } from "@/components/data-source-notice";
import { EventOutboxLog } from "@/components/event-outbox-log";
import { MemberRecognitionPanel } from "@/components/member-recognition-panel";
import { MetricCard } from "@/components/metric-card";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getMemberRecognitionSummary } from "@/services/member-recognition";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getRushMonthDashboardForActor } from "@/services/rush-month-dashboard-service";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthDashboard");
export const dynamic = "force-dynamic";

export default async function RushMonthDashboardPage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const dashboard = getRushMonthDashboardForActor(actor, data);
  const recognition = getMemberRecognitionSummary(actor, data, dashboard.leaderboard);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />

      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
          {dashboard.eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">{dashboard.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
          {dashboard.summary}
        </p>
      </section>

      {!dashboard.canReadChapterTruth ? (
        <>
          <RestrictedState
            title="This dashboard is limited to integration posture for DS Admin."
            message="Campaign progress, student assignments, proof, points, KPIs, and leaderboards stay app-owned and hidden from the systems-admin role."
            nextHref={dashboard.nextStep.href}
            nextLabel={dashboard.nextStep.ctaLabel}
          />
          <section className="grid gap-3 sm:grid-cols-3">
            {dashboard.metrics.map((metric) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                note={metric.note}
              />
            ))}
          </section>
          {dashboard.integrationEvents.length > 0 ? (
            <EventOutboxLog
              events={dashboard.integrationEvents}
              outboxItems={dashboard.outboxItems}
            />
          ) : null}
        </>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
            <article className="rounded-[2rem] border border-sky-300/20 bg-sky-300/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">
                Phase
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {dashboard.phaseSummary.label}
              </h2>
              <p className="mt-2 text-sm font-semibold text-sky-100/84">
                {dashboard.phaseSummary.status}
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
                {dashboard.phaseSummary.note}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
                    Invite KPIs
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {dashboard.kpiSummary.invitePushes}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/58">
                    Invite signals connected to this phase.
                  </p>
                </div>
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
                    Proof pending
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {dashboard.kpiSummary.proofPending}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/58">
                    Follow-up or review items still visible.
                  </p>
                </div>
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
                    Points
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {dashboard.pointsSummary.earned}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/58">
                    Friendly recognition earned so far.
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
                Why it matters
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Keep the week legible for the role doing the work.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/72">
                {dashboard.whyItMatters}
              </p>
            </article>
          </section>

          <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
              Next best action
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {dashboard.nextStep.label}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/68">
              {dashboard.nextStep.summary}
            </p>
            <Link
              href={dashboard.nextStep.href}
              className="mt-4 inline-flex rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
            >
              {dashboard.nextStep.ctaLabel}
            </Link>
          </section>

          <section className="rounded-[2rem] border border-[#f7d05e]/24 bg-[#f7d05e]/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f7d05e]">
              Role action groups
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              The work is grouped so this role can move with less guessing.
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {dashboard.actionGroups.map((group) => (
                <article
                  key={group.label}
                  className="rounded-[1.35rem] border border-white/10 bg-[#081d46]/55 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/46">
                    {group.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/74">
                    {group.summary}
                  </p>
                  <Link
                    href={group.href}
                    className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#08224c]"
                  >
                    {group.linkLabel}
                  </Link>
                </article>
              ))}
            </div>
          </section>

          {dashboard.roleFocus ? (
            <section className="rounded-[2rem] border border-sky-300/20 bg-sky-300/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">
                {dashboard.roleFocus.roleLabel}
              </p>
              <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    {dashboard.roleFocus.title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/68">
                    {dashboard.roleFocus.summary}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={dashboard.roleFocus.primaryHref}
                    className="rounded-full bg-sky-200 px-4 py-2 text-sm font-semibold text-[#06211d]"
                  >
                    {dashboard.roleFocus.primaryLabel}
                  </Link>
                  {dashboard.roleFocus.secondaryHref ? (
                    <Link
                      href={dashboard.roleFocus.secondaryHref}
                      className="rounded-full border border-white/14 bg-black/20 px-4 py-2 text-sm font-semibold text-white"
                    >
                      {dashboard.roleFocus.secondaryLabel}
                    </Link>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {dashboard.roleFocus.items.map((item) => (
                  <div key={item.label} className="rounded-2xl bg-black/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                    <p className="mt-2 text-sm leading-6 text-white/58">{item.note}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-2xl border border-white/10 bg-black/18 p-3 text-sm leading-6 text-white/62">
                {dashboard.roleFocus.safetyNote}
              </p>
            </section>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dashboard.metrics.map((metric) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                note={metric.note}
              />
            ))}
          </section>

          <MemberRecognitionPanel recognition={recognition} />

          <section className="grid gap-3">
            <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
              <h2 className="text-2xl font-semibold text-white">Visible assignments</h2>
              <p className="mt-2 text-sm leading-6 text-white/66">
                These are the actions this local role can read. Browser save
                controls are still disabled until a later approved auth/write goal.
              </p>
              <div className="mt-4 grid gap-3">
                {dashboard.visibleAssignments.slice(0, 3).map((assignment) => (
                  <AssignmentCard key={assignment.id} assignment={assignment} />
                ))}
              </div>
            </article>
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
              <h2 className="text-2xl font-semibold text-white">Events to move the chapter</h2>
              <div className="mt-4 grid gap-3">
                {dashboard.eventPlans.map((eventPlan) => (
                  <div key={eventPlan.id} className="rounded-2xl bg-black/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/70">
                      {eventPlan.timing} / {eventPlan.lumaStatus.replaceAll("_", " ")}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">{eventPlan.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/64">
                      {eventPlan.expectedStudentAction}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/54">
                      NPS: {eventPlan.npsQuestion}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
              <h2 className="text-2xl font-semibold text-white">Proof to build belief</h2>
              <div className="mt-4 grid gap-3">
                {dashboard.proofItems.map((proofItem) => (
                  <div key={proofItem.id} className="rounded-2xl bg-black/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/70">
                      {proofItem.proofType.replaceAll("_", " ")} / {proofItem.sharingStatus.replaceAll("_", " ")}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">
                      {proofItem.sourceLabel}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/64">
                      Addresses: {proofItem.hesitationAddressed}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
              Watchouts
            </p>
            <div className="mt-4 grid gap-3">
              {dashboard.alerts.map((alert) => (
                <p key={alert} className="rounded-2xl bg-black/20 p-3 text-sm leading-6 text-white/72">
                  {alert}
                </p>
              ))}
            </div>
          </section>

          {dashboard.risks.length > 0 ? (
            <section className="rounded-[2rem] border border-rose-300/20 bg-rose-300/10 p-5">
              <h2 className="text-2xl font-semibold text-white">Visible risk signals</h2>
              <div className="mt-4 grid gap-3">
                {dashboard.risks.slice(0, 3).map((risk) => (
                  <article key={risk.id} className="rounded-2xl bg-black/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-100/80">
                      {risk.severity} / {risk.visibility.replaceAll("_", " ")}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">{risk.signal}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/64">
                      {risk.response_plan}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {dashboard.integrationEvents.length > 0 ? (
            <EventOutboxLog
              events={dashboard.integrationEvents}
              outboxItems={dashboard.outboxItems}
            />
          ) : null}
        </>
      )}
    </AppShell>
  );
}
