import Link from "next/link";
import type { ReactNode } from "react";

import { MetricCard } from "@/components/metric-card";
import type {
  StaffAdminSignal,
  StaffAuditItem,
  StaffBestPracticeCard,
  StaffCampaignOperationCard,
  StaffChapterDrawer,
  StaffChapterPortfolioRow,
  StaffCommandCenter,
  StaffHubSpotSignal,
  StaffProofReviewItem,
} from "@/services/staff-command-center";

type StaffCommandCenterPanelProps = {
  commandCenter: StaffCommandCenter;
};

export function StaffCommandCenterPanel({
  commandCenter,
}: StaffCommandCenterPanelProps) {
  if (!commandCenter.canReadCommandCenter) {
    return null;
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)] xl:items-start">
      <aside className="grid gap-4 xl:sticky xl:top-24">
        <section className="rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(160deg,#0b2a5d_0%,#0a3b88_52%,#081a3a_100%)] p-5 shadow-[0_24px_80px_rgba(2,14,38,0.3)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f7d05e]">
            Staff command center
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold text-white">{commandCenter.title}</h1>
            {commandCenter.sampleLabel ? (
              <span className="rounded-full border border-[#f7d05e]/30 bg-[#f7d05e]/12 px-3 py-1 text-xs font-semibold text-[#f7d05e]">
                {commandCenter.sampleLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-3 text-sm leading-6 text-white/78">{commandCenter.summary}</p>

          <article className="mt-5 rounded-[1.6rem] border border-white/12 bg-[#071836]/55 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f7d05e]/88">
              Safety posture
            </p>
            <p className="mt-3 text-sm leading-6 text-white/70">
              {commandCenter.safetyNote}
            </p>
          </article>
        </section>

        <SidebarCard eyebrow="Navigation" title="Portfolio views">
          <nav aria-label="Staff command center views" className="grid gap-2">
            {commandCenter.viewOptions.map((option) => (
              <Link
                key={option.key}
                href={option.href}
                aria-current={
                  commandCenter.selectedView === option.key ? "page" : undefined
                }
                className={[
                  "rounded-[1.15rem] px-4 py-3 text-sm font-semibold transition",
                  commandCenter.selectedView === option.key
                    ? "bg-[#f7d05e] text-[#08224c]"
                    : "border border-white/10 bg-white/[0.05] text-white/74 hover:border-[#5d8ff6]/28 hover:bg-white/[0.08] hover:text-white",
                ].join(" ")}
              >
                {option.label}
              </Link>
            ))}
          </nav>
        </SidebarCard>

        <SidebarCard eyebrow="Quick actions" title="Staff tools">
          <div className="grid gap-2">
            {commandCenter.quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={[
                  "rounded-[1.25rem] border px-4 py-4 transition",
                  action.tone === "primary"
                    ? "border-[#f7d05e]/30 bg-[#f7d05e]/12 hover:border-[#f7d05e]/46 hover:bg-[#f7d05e]/18"
                    : "border-white/10 bg-white/[0.05] hover:border-[#5d8ff6]/28 hover:bg-white/[0.08]",
                ].join(" ")}
              >
                <p
                  className={[
                    "text-sm font-semibold",
                    action.tone === "primary" ? "text-[#f7d05e]" : "text-white",
                  ].join(" ")}
                >
                  {action.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/62">{action.helper}</p>
              </Link>
            ))}
          </div>
        </SidebarCard>
      </aside>

      <div className="grid gap-4">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {commandCenter.metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              note={metric.note}
            />
          ))}
        </section>

        {commandCenter.selectedView === "chapters" ? (
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/46">
                  Portfolio filters
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Chapter portfolio table
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/64">
                  Filter the portfolio by chapter risk or search by campus, coach,
                  or next step.
                </p>
              </div>

              <form
                action="/staff"
                method="get"
                className="grid gap-3 sm:grid-cols-[1fr_auto]"
              >
                <input type="hidden" name="view" value="chapters" />
                {commandCenter.riskFilter !== "all" ? (
                  <input type="hidden" name="risk" value={commandCenter.riskFilter} />
                ) : null}
                <label className="sr-only" htmlFor="staff-search">
                  Search chapters
                </label>
                <input
                  id="staff-search"
                  name="q"
                  type="search"
                  defaultValue={commandCenter.searchQuery}
                  placeholder="Search chapters or next steps"
                  className="min-w-72 rounded-full border border-white/12 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32 focus:border-[#5d8ff6]/40"
                />
                <button
                  type="submit"
                  className="rounded-full bg-[#f7d05e] px-5 py-3 text-sm font-semibold text-[#08224c]"
                >
                  Apply
                </button>
              </form>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {commandCenter.riskFilters.map((filter) => (
                <Link
                  key={filter.key}
                  href={filter.href}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    commandCenter.riskFilter === filter.key
                      ? "bg-[#5d8ff6]/18 text-[#c9dcff]"
                      : "border border-white/10 bg-black/20 text-white/72 hover:text-white",
                  ].join(" ")}
                >
                  {filter.label}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {renderView(commandCenter)}
      </div>
    </section>
  );
}

function renderView(commandCenter: StaffCommandCenter) {
  switch (commandCenter.selectedView) {
    case "campaigns":
      return (
        <section className="grid gap-4 xl:grid-cols-2">
          {commandCenter.campaignCards.map((campaign) => (
            <CampaignCard key={campaign.slug} campaign={campaign} />
          ))}
        </section>
      );
    case "proof_ugc":
      return (
        <section className="grid gap-4 xl:grid-cols-[0.96fr_1.04fr]">
          <SectionCard eyebrow="Proof queue" title="UGC review with consent gates">
            <div className="grid gap-3">
              {commandCenter.proofReviewItems.map((item) => (
                <ProofReviewCard key={item.id} item={item} />
              ))}
            </div>
          </SectionCard>
          <SectionCard eyebrow="Feed candidates" title="What can become reusable chapter proof?">
            <div className="grid gap-3">
              {commandCenter.feedDrafts.map((draft) => (
                <FeedDraftCard key={draft.id} draft={draft} />
              ))}
            </div>
          </SectionCard>
        </section>
      );
    case "feed_studio":
      return (
        <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
          <SectionCard eyebrow="Feed studio" title="Curate drafts around real student action">
            <div className="grid gap-3">
              {commandCenter.feedDrafts.map((draft) => (
                <FeedDraftCard key={draft.id} draft={draft} />
              ))}
            </div>
          </SectionCard>
          <SectionCard eyebrow="Support rule" title="Keep the curation boring and useful">
            <div className="grid gap-3 sm:grid-cols-2">
              {commandCenter.feedInsights.map((insight) => (
                <MetricCard
                  key={insight.label}
                  label={insight.label}
                  value={insight.value}
                  note={insight.note}
                />
              ))}
            </div>
          </SectionCard>
        </section>
      );
    case "feed_analytics":
      return (
        <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
          <SectionCard eyebrow="Feed analytics" title="What stories are shaping chapter belief?">
            <div className="grid gap-3 sm:grid-cols-2">
              {commandCenter.feedInsights.map((insight) => (
                <MetricCard
                  key={insight.label}
                  label={insight.label}
                  value={insight.value}
                  note={insight.note}
                />
              ))}
            </div>
          </SectionCard>
          <SectionCard eyebrow="Recognition" title="Who is making action visible?">
            <div className="overflow-hidden rounded-[1.25rem] border border-white/10">
              <table className="min-w-full text-left text-sm text-white/72">
                <thead className="bg-black/20 text-xs uppercase tracking-[0.18em] text-white/42">
                  <tr>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Points</th>
                    <th className="px-4 py-3">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {commandCenter.leaderboardRows.map((row) => (
                    <tr key={row.displayName} className="border-t border-white/10">
                      <td className="px-4 py-3 font-semibold text-white">
                        {row.displayName}
                      </td>
                      <td className="px-4 py-3">{row.roleLabel}</td>
                      <td className="px-4 py-3">{row.points}</td>
                      <td className="px-4 py-3">{row.recognition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </section>
      );
    case "hubspot":
      return (
        <section className="grid gap-4 xl:grid-cols-2">
          {commandCenter.hubspotSignals.map((signal, index) => (
            <HubSpotSignalCard key={`${signal.title}-${index}`} signal={signal} />
          ))}
        </section>
      );
    case "best_practices":
      return (
        <section className="grid gap-4 xl:grid-cols-2">
          {commandCenter.bestPracticeCards.map((card) => (
            <BestPracticeCard key={card.id} card={card} />
          ))}
        </section>
      );
    case "admin":
      return (
        <section className="grid gap-4">
          <section className="grid gap-4 xl:grid-cols-2">
            <SectionCard eyebrow="Admin health" title="Launch posture and system guardrails">
              <div className="grid gap-3">
                {commandCenter.adminSignals.map((signal) => (
                  <AdminSignalCard key={signal.title} signal={signal} />
                ))}
              </div>
            </SectionCard>
            <SectionCard eyebrow="Automation outbox" title="Counts only unless your role owns full detail">
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricCard
                  label="Total rows"
                  value={`${commandCenter.outboxSummary.total}`}
                  note="Integration-ready outbox items visible in the local data model."
                />
                <MetricCard
                  label="Disabled rows"
                  value={`${commandCenter.outboxSummary.disabled}`}
                  note="Future sends that stay blocked until explicit approval."
                />
                <MetricCard
                  label="Mocked rows"
                  value={`${commandCenter.outboxSummary.mocked}`}
                  note="Local previews for future external payload shapes."
                />
                <MetricCard
                  label="HubSpot / Luma"
                  value={`${commandCenter.outboxSummary.hubspot} / ${commandCenter.outboxSummary.luma}`}
                  note="CRM and event handoff posture only."
                />
              </div>
            </SectionCard>
          </section>

          <SectionCard eyebrow="Audit posture" title="What is reviewable before writes are approved?">
            <div className="grid gap-3 xl:grid-cols-3">
              {commandCenter.auditItems.map((item) => (
                <AuditCard key={item.title} item={item} />
              ))}
            </div>
          </SectionCard>
        </section>
      );
    case "chapters":
    default:
      return (
        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <SectionCard eyebrow="Chapter portfolio" title="What needs a decision or support move?">
            <ChapterPortfolioTable
              rows={commandCenter.chapterRows}
              selectedChapterId={commandCenter.selectedChapterId}
            />
          </SectionCard>
          <SectionCard eyebrow="Chapter drawer" title={commandCenter.selectedChapter?.chapterName ?? "Select a chapter"}>
            {commandCenter.selectedChapter ? (
              <ChapterDrawer drawer={commandCenter.selectedChapter} />
            ) : (
              <p className="text-sm leading-6 text-white/68">
                No chapter matched the current search or risk filter.
              </p>
            )}
          </SectionCard>
        </section>
      );
  }
}

function ChapterPortfolioTable({
  rows,
  selectedChapterId,
}: {
  rows: StaffChapterPortfolioRow[];
  selectedChapterId: string | null;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm leading-6 text-white/68">
        No chapters matched the current search or risk filter.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-white/72">
          <thead className="bg-black/20 text-xs uppercase tracking-[0.18em] text-white/42">
            <tr>
              <th className="px-4 py-3">Chapter</th>
              <th className="px-4 py-3">Readiness</th>
              <th className="px-4 py-3">Decision</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3">Proof</th>
              <th className="px-4 py-3">Follow-up</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.chapterId}
                className={[
                  "border-t border-white/10",
                  selectedChapterId === row.chapterId ? "bg-[#5d8ff6]/10" : "",
                ].join(" ")}
              >
                <td className="px-4 py-3 align-top">
                  <Link
                    href={row.detailHref}
                    className="font-semibold text-white hover:text-[#f7d05e]"
                  >
                    {row.chapterName}
                  </Link>
                  <p className="mt-1 text-xs text-white/48">{row.campus}</p>
                  <p className="mt-2 text-xs leading-5 text-white/56">
                    {row.supportSummary}
                  </p>
                </td>
                <td className="px-4 py-3 align-top">
                  <p className="font-semibold text-white">{row.readinessScore}</p>
                  <p className="mt-1 text-xs text-white/48">{row.campaignName}</p>
                </td>
                <td className="px-4 py-3 align-top">
                  <Pill tone={decisionTone(row.decision)} label={decisionLabel(row.decision)} />
                </td>
                <td className="px-4 py-3 align-top">
                  <Pill tone={riskTone(row.risk)} label={row.risk} />
                </td>
                <td className="px-4 py-3 align-top">{row.proofPending}</td>
                <td className="px-4 py-3 align-top">
                  <p>{row.openFollowUps}</p>
                  <p className="mt-1 text-xs text-white/48">{row.nextStep}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChapterDrawer({ drawer }: { drawer: StaffChapterDrawer }) {
  return (
    <div className="grid gap-4">
      <div className="rounded-[1.4rem] border border-[#5d8ff6]/22 bg-[#5d8ff6]/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c9dcff]">
          Recommended staff read
        </p>
        <h3 className="mt-2 text-xl font-semibold text-white">
          {drawer.recommendedDecision}
        </h3>
        <p className="mt-2 text-sm leading-6 text-white/66">{drawer.summary}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill tone="neutral" label={drawer.campus} />
          <Pill tone="neutral" label={`Lead: ${drawer.leadName}`} />
          <Pill tone="neutral" label={`Coach: ${drawer.coachName}`} />
        </div>
      </div>

      <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
        <p className="text-sm font-semibold text-white">Focus this week</p>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-white/66">
          {drawer.focusItems.map((item) => (
            <li key={item} className="rounded-2xl bg-white/[0.05] px-3 py-3">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
        <p className="text-sm font-semibold text-white">Recent signals</p>
        <div className="mt-3 grid gap-3">
          {drawer.recentSignals.map((signal) => (
            <article key={signal.label} className="rounded-2xl bg-white/[0.05] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">{signal.label}</p>
                <Pill tone={signalTone(signal.status)} label={signal.status} />
              </div>
              <p className="mt-2 text-sm leading-6 text-white/62">{signal.detail}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {drawer.quickLinks.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-full border border-white/12 bg-black/20 px-4 py-2 text-sm font-semibold text-white"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: StaffCampaignOperationCard }) {
  return (
    <SectionCard eyebrow={campaign.status} title={campaign.name}>
      <p className="text-sm leading-6 text-white/66">{campaign.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {campaign.actionCommitteeLanes.map((lane) => (
          <Pill key={lane} tone="neutral" label={lane} />
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {campaign.primaryKpis.map((kpi) => (
          <div key={kpi} className="rounded-2xl bg-black/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
              KPI
            </p>
            <p className="mt-2 text-sm font-semibold text-white">{kpi}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm leading-6 text-white/62">
        {campaign.recommendedStaffMove}
      </p>
      <p className="mt-2 text-xs leading-5 text-white/46">
        {campaign.integrationPosture}
      </p>
      <Link
        href={campaign.href}
        className="mt-4 inline-flex rounded-full bg-[#f7d05e] px-4 py-2 text-sm font-semibold text-[#08224c]"
      >
        Open campaign
      </Link>
    </SectionCard>
  );
}

function ProofReviewCard({ item }: { item: StaffProofReviewItem }) {
  return (
    <article className="rounded-[1.3rem] border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="neutral" label={item.proofTypeLabel} />
        <Pill tone={consentTone(item.consentStatusLabel)} label={item.consentStatusLabel} />
        <Pill tone="neutral" label={item.sharingStatusLabel} />
      </div>
      <h3 className="mt-3 text-lg font-semibold text-white">{item.sourceLabel}</h3>
      <p className="mt-2 text-sm leading-6 text-white/64">{item.summary}</p>
      <p className="mt-2 text-xs leading-5 text-white/46">
        Hesitation addressed: {item.hesitationAddressed}
      </p>
      <p className="mt-2 text-xs leading-5 text-white/46">
        Recommended use: {item.recommendedUse}
      </p>
      <Link
        href={item.reviewHref}
        className="mt-4 inline-flex rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white"
      >
        Open proof review
      </Link>
    </article>
  );
}

function FeedDraftCard({
  draft,
}: {
  draft: StaffCommandCenter["feedDrafts"][number];
}) {
  return (
    <article className="rounded-[1.3rem] border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="neutral" label={draft.formatLabel} />
        <Pill tone={draft.publishStatusLabel.includes("Ready") ? "good" : "warning"} label={draft.publishStatusLabel} />
      </div>
      <h3 className="mt-3 text-lg font-semibold text-white">{draft.title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/64">{draft.curationReason}</p>
      <p className="mt-2 text-xs leading-5 text-white/46">{draft.callToAction}</p>
      <Link
        href={draft.sourceHref}
        className="mt-4 inline-flex rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white"
      >
        Open source proof
      </Link>
    </article>
  );
}

function HubSpotSignalCard({ signal }: { signal: StaffHubSpotSignal }) {
  return (
    <SectionCard eyebrow={signal.chapterLabel} title={signal.title}>
      <div className="flex flex-wrap gap-2">
        <Pill tone={signalTone(signal.statusLabel)} label={signal.statusLabel} />
        <Pill tone="neutral" label={signal.chapterLabel} />
      </div>
      <p className="mt-4 text-sm leading-6 text-white/64">{signal.detail}</p>
      <p className="mt-3 text-xs leading-5 text-white/46">Next: {signal.nextAction}</p>
    </SectionCard>
  );
}

function BestPracticeCard({ card }: { card: StaffBestPracticeCard }) {
  return (
    <SectionCard eyebrow="Best practice" title={card.title}>
      <p className="text-sm leading-6 text-white/66">{card.summary}</p>
      <div className="mt-4 rounded-2xl bg-black/20 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
          Why it works
        </p>
        <p className="mt-2 text-sm leading-6 text-white/64">{card.whyItWorks}</p>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/62">{card.nextMove}</p>
      <Link
        href={card.href}
        className="mt-4 inline-flex rounded-full bg-[#f7d05e] px-4 py-2 text-sm font-semibold text-[#08224c]"
      >
        Open playbook
      </Link>
    </SectionCard>
  );
}

function AdminSignalCard({ signal }: { signal: StaffAdminSignal }) {
  return (
    <article className="rounded-[1.3rem] border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{signal.title}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{signal.metric}</p>
        </div>
        <Pill tone={adminTone(signal.status)} label={signal.status.replaceAll("_", " ")} />
      </div>
      <p className="mt-3 text-sm leading-6 text-white/62">{signal.detail}</p>
    </article>
  );
}

function AuditCard({ item }: { item: StaffAuditItem }) {
  return (
    <article className="rounded-[1.3rem] border border-white/10 bg-black/20 p-4">
      <Pill tone="neutral" label={item.posture} />
      <h3 className="mt-3 text-lg font-semibold text-white">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/64">{item.detail}</p>
    </article>
  );
}

function SidebarCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/46">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-lg font-semibold text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SectionCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/46">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Pill({
  tone,
  label,
}: {
  tone: "good" | "warning" | "danger" | "neutral";
  label: string;
}) {
  return (
    <span
      className={[
        "rounded-full px-3 py-1 text-xs font-semibold capitalize",
        tone === "good"
          ? "bg-emerald-300/20 text-emerald-100"
          : tone === "warning"
            ? "bg-amber-300/20 text-amber-100"
            : tone === "danger"
              ? "bg-rose-300/20 text-rose-100"
              : "bg-white/10 text-white/72",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function decisionTone(decision: StaffChapterPortfolioRow["decision"]) {
  switch (decision) {
    case "advance":
      return "good";
    case "hold":
      return "warning";
    case "intervene":
      return "danger";
  }
}

function decisionLabel(decision: StaffChapterPortfolioRow["decision"]) {
  switch (decision) {
    case "advance":
      return "Advance";
    case "hold":
      return "Hold";
    case "intervene":
      return "Intervene";
  }
}

function riskTone(risk: StaffChapterPortfolioRow["risk"]) {
  switch (risk) {
    case "low":
      return "good";
    case "medium":
      return "warning";
    case "high":
      return "danger";
  }
}

function signalTone(status: string) {
  if (status.includes("disabled")) {
    return "warning";
  }

  if (status.includes("mocked") || status.includes("recorded")) {
    return "good";
  }

  if (status.includes("intervene") || status.includes("blocked")) {
    return "danger";
  }

  return "neutral";
}

function consentTone(status: string) {
  if (status === "Consent confirmed") {
    return "good";
  }

  if (status === "Internal only") {
    return "neutral";
  }

  return "warning";
}

function adminTone(status: StaffAdminSignal["status"]) {
  switch (status) {
    case "ready_readonly":
      return "good";
    case "mock_only":
      return "neutral";
    case "blocked":
      return "warning";
  }
}
