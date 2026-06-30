import Link from "next/link";
import { StudentAppShell } from "@/components/student-app-shell";
import { AssignmentCard } from "@/components/assignment-card";
import { DataSourceNotice } from "@/components/data-source-notice";
import { EventOutboxLog } from "@/components/event-outbox-log";
import { MemberRushMonthCampaignPanel } from "@/components/member-rush-month-campaign-panel";
import { MemberRecognitionPanel } from "@/components/member-recognition-panel";
import { MetricCard } from "@/components/metric-card";
import { RestrictedState } from "@/components/restricted-state";
import { buildLeaderAssignmentRouteHref } from "@/services/leader-assignment-route-href";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getMemberRecognitionSummary } from "@/services/member-recognition";
import { getMemberRushMonthCampaignOverview } from "@/services/member-rush-month-campaign-overview";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getActorSurfaceFamily } from "@/services/role-visibility";
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
  const isMemberDashboard =
    getActorSurfaceFamily(actor) === "member" && dashboard.canReadChapterTruth;
  const memberCampaignOverview = isMemberDashboard
    ? getMemberRushMonthCampaignOverview(actor, data)
    : null;

  return (
    <StudentAppShell
      actor={actor}
      hideTopHeader={isMemberDashboard}
      showMobileQuickItemHelpers={!isMemberDashboard}
      showDebugTools={!isMemberDashboard}
    >
      {!dashboard.canReadChapterTruth ? (
        <>
          <section className="app-surface-info overflow-hidden rounded-[2rem] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mymedlife-primary-button)]">
              {dashboard.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">{dashboard.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {dashboard.summary}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <DashboardHeroStat
                label="Invite KPIs"
                value={`${dashboard.kpiSummary.invitePushes}`}
              />
              <DashboardHeroStat
                label="Proof pending"
                value={`${dashboard.kpiSummary.proofPending}`}
              />
              <DashboardHeroStat
                label="Points"
                value={`${dashboard.pointsSummary.earned}`}
              />
            </div>
          </section>

          <DataSourceNotice source={data.source} />
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
      ) : isMemberDashboard ? (
        <>
          {memberCampaignOverview ? (
            <MemberRushMonthCampaignPanel overview={memberCampaignOverview} />
          ) : null}
        </>
      ) : (
        <>
          <section className="app-surface-info overflow-hidden rounded-[2rem] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mymedlife-primary-button)]">
              {dashboard.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">{dashboard.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {dashboard.summary}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <DashboardHeroStat
                label="Invite KPIs"
                value={`${dashboard.kpiSummary.invitePushes}`}
              />
              <DashboardHeroStat
                label="Proof pending"
                value={`${dashboard.kpiSummary.proofPending}`}
              />
              <DashboardHeroStat
                label="Points"
                value={`${dashboard.pointsSummary.earned}`}
              />
            </div>
          </section>

          <div className="grid gap-4 rounded-[2rem] bg-[var(--mymedlife-panel-tint)] p-4 shadow-[0_18px_50px_rgb(var(--mymedlife-deep-rgb)/0.12)]">
            <section className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
              <article className="rounded-[2rem] border border-[var(--mymedlife-border)] bg-[var(--mymedlife-info-surface)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-primary-button)]">
                  Phase
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  {dashboard.phaseSummary.label}
                </h2>
                <p className="mt-2 text-sm font-semibold text-[var(--mymedlife-primary-button)]">
                  {dashboard.phaseSummary.status}
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  {dashboard.phaseSummary.note}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <DashboardSurfaceCard
                    label="Invite KPIs"
                    value={`${dashboard.kpiSummary.invitePushes}`}
                    note="Invite signals connected to this phase."
                  />
                  <DashboardSurfaceCard
                    label="Proof pending"
                    value={`${dashboard.kpiSummary.proofPending}`}
                    note="Follow-up or review items still visible."
                  />
                  <DashboardSurfaceCard
                    label="Points"
                    value={`${dashboard.pointsSummary.earned}`}
                    note="Friendly recognition earned so far."
                  />
                </div>
              </article>

              <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Why it matters
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Keep the week legible for the role doing the work.
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                  {dashboard.whyItMatters}
                </p>
              </article>
            </section>

            <section className="rounded-[2rem] border border-[var(--mymedlife-border)] bg-[var(--mymedlife-info-surface)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-primary-button)]">
                Next best action
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                {dashboard.nextStep.label}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {dashboard.nextStep.summary}
              </p>
              <Link
                href={dashboard.nextStep.href}
                className="mt-4 inline-flex rounded-full bg-[var(--mymedlife-badge-background)] px-4 py-2 text-sm font-semibold text-[var(--mymedlife-badge-text)]"
              >
                {dashboard.nextStep.ctaLabel}
              </Link>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Role action groups
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                The work is grouped so this role can move with less guessing.
              </h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {dashboard.actionGroups.map((group) => (
                  <article
                    key={group.label}
                    className="rounded-[1.35rem] border border-slate-200 bg-[var(--mymedlife-badge-background)] p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-primary-button)]">
                      {group.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {group.summary}
                    </p>
                    <Link
                      href={group.href}
                      className="mt-4 inline-flex rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                    >
                      {group.linkLabel}
                    </Link>
                  </article>
                ))}
              </div>
            </section>

            <DataSourceNotice source={data.source} />

            {dashboard.roleFocus ? (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-primary-button)]">
                  {dashboard.roleFocus.roleLabel}
                </p>
                <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-950">
                      {dashboard.roleFocus.title}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      {dashboard.roleFocus.summary}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={dashboard.roleFocus.primaryHref}
                      className="rounded-full bg-[var(--mymedlife-badge-background)] px-4 py-2 text-sm font-semibold text-[var(--mymedlife-badge-text)]"
                    >
                      {dashboard.roleFocus.primaryLabel}
                    </Link>
                    {dashboard.roleFocus.secondaryHref ? (
                      <Link
                        href={dashboard.roleFocus.secondaryHref}
                        className="rounded-full border border-slate-200 bg-[var(--mymedlife-badge-background)] px-4 py-2 text-sm font-semibold text-slate-700"
                      >
                        {dashboard.roleFocus.secondaryLabel}
                      </Link>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {dashboard.roleFocus.items.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-slate-200 bg-[var(--mymedlife-badge-background)] p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.note}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 rounded-2xl border border-slate-200 bg-[var(--mymedlife-badge-background)] p-3 text-sm leading-6 text-slate-600">
                  {dashboard.roleFocus.safetyNote}
                </p>
              </section>
            ) : null}

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dashboard.metrics.map((metric) => (
                <DashboardSurfaceCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  note={metric.note}
                />
              ))}
            </section>

            <MemberRecognitionPanel recognition={recognition} />

            <section className="grid gap-3">
              <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
                <h2 className="text-2xl font-semibold text-slate-950">Visible assignments</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  These are the actions this local role can read. Browser save
                  controls are still disabled until a later approved auth/write goal.
                </p>
                <div className="mt-4 grid gap-3">
                  {dashboard.visibleAssignments.slice(0, 3).map((assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      actionHref={buildLeaderAssignmentRouteHref(assignment.id, {
                        source: "dashboard_assignment_card",
                      })}
                    />
                  ))}
                </div>
              </article>
            </section>

            <section className="grid gap-3 lg:grid-cols-2">
              <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
                <h2 className="text-2xl font-semibold text-slate-950">Events to move the chapter</h2>
                <div className="mt-4 grid gap-3">
                  {dashboard.eventPlans.map((eventPlan) => (
                    <div
                      key={eventPlan.id}
                      className="rounded-2xl border border-slate-200 bg-[var(--mymedlife-badge-background)] p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mymedlife-primary-button)]">
                        {eventPlan.timing} / {eventPlan.lumaStatus.replaceAll("_", " ")}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-950">
                        {eventPlan.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {eventPlan.expectedStudentAction}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        NPS: {eventPlan.npsQuestion}
                      </p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
                <h2 className="text-2xl font-semibold text-slate-950">Proof to build belief</h2>
                <div className="mt-4 grid gap-3">
                  {dashboard.proofItems.map((proofItem) => (
                    <div
                      key={proofItem.id}
                      className="rounded-2xl border border-slate-200 bg-[var(--mymedlife-badge-background)] p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mymedlife-primary-button)]">
                        {proofItem.proofType.replaceAll("_", " ")} / {proofItem.sharingStatus.replaceAll("_", " ")}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-950">
                        {proofItem.sourceLabel}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Addresses: {proofItem.hesitationAddressed}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="rounded-[2rem] border border-[var(--mymedlife-primary-button)]/30 bg-[var(--mymedlife-badge-background)] p-5 shadow-[0_10px_30px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-info)]">
                Watchouts
              </p>
              <div className="mt-4 grid gap-3">
                {dashboard.alerts.map((alert) => (
                  <p
                    key={alert}
                    className="rounded-2xl border border-[var(--mymedlife-primary-button)]/20 bg-white/70 p-3 text-sm leading-6 text-slate-700"
                  >
                    {alert}
                  </p>
                ))}
              </div>
            </section>

            {dashboard.risks.length > 0 ? (
              <section className="rounded-[2rem] border border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)]/95 p-5 shadow-[0_10px_30px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
                <h2 className="text-2xl font-semibold text-slate-950">Visible risk signals</h2>
                <div className="mt-4 grid gap-3">
                  {dashboard.risks.slice(0, 3).map((risk) => (
                    <article
                      key={risk.id}
                      className="rounded-2xl border border-[var(--mymedlife-border)] bg-white/80 p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mymedlife-info)]">
                        {risk.severity} / {risk.visibility.replaceAll("_", " ")}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-950">
                        {risk.signal}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
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
          </div>
        </>
      )}
    </StudentAppShell>
  );
}

function DashboardHeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/12 bg-white/10 p-3 backdrop-blur-sm">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-white/56">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function DashboardSurfaceCard({
  label,
  note,
  value,
}: {
  label: string;
  note: string;
  value: string;
}) {
  return (
    <section className="rounded-[1.45rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{note}</p>
    </section>
  );
}
