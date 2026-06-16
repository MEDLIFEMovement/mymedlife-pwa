import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { mockCampaign, mockChapter, roleContexts } from "@/data/mock-rush-month";
import { getNextMemberAction, getProgressCounts } from "@/lib/rush-month";
import { getCampaignReadinessSummary } from "@/services/campaign-ops-service";

export default function Home() {
  const nextAction = getNextMemberAction();
  const progress = getProgressCounts();
  const campaignSummary = getCampaignReadinessSummary();

  return (
    <AppShell>
      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
          {mockChapter.name}
        </p>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              myMEDLIFE turns chapter SOPs into student action.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">
              {mockCampaign.name} is the first operating loop, but the app is
              becoming a reusable campaign system for action committees, events,
              proof/testimonials, points, KPIs, and coach decisions.
            </p>
          </div>
          <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-4">
            <p className="text-sm font-semibold text-emerald-100">My next action</p>
            <h2 className="mt-2 text-xl font-semibold text-white">{nextAction.title}</h2>
            <p className="mt-2 text-sm leading-6 text-white/68">
              Evidence needed: {nextAction.evidenceRequired}
            </p>
            <Link
              href={`/rush-month/actions/${nextAction.id}`}
              className="mt-4 inline-flex rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
            >
              Open my action
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Approved"
          value={`${progress.approved}/${progress.total}`}
          note="Actions already accepted"
        />
        <MetricCard
          label="Pending review"
          value={`${progress.pendingReview}`}
          note="Evidence waiting on a leader or coach"
        />
        <MetricCard
          label="Needs work"
          value={`${progress.needsWork}`}
          note="Actions not yet ready to count"
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Campaign shells"
          value={`${campaignSummary.activeCampaigns + campaignSummary.plannedCampaigns + campaignSummary.templateCampaigns}`}
          note="Rush plus future campaign models"
        />
        <MetricCard
          label="Action events"
          value={`${campaignSummary.linkedMockEvents}`}
          note="Mock-linked only, no Luma write"
        />
        <MetricCard
          label="Proof to review"
          value={`${campaignSummary.hqProofItems}`}
          note="HQ sharing posture"
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        {[
          {
            href: "/campaigns",
            label: "Campaign Library",
            copy: "See the reusable campaign shells behind Rush Month, fundraising, volunteering, socials, Med Talks, and SLT recruitment.",
          },
          {
            href: "/action-committees",
            label: "Action Committees",
            copy: "Preview how committees organize events with owners, feedback, proof, and coach-readable outcomes.",
          },
          {
            href: "/proof-library",
            label: "Proof Library",
            copy: "Understand how bridge videos and testimonials become belief-building assets after HQ review.",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 transition hover:border-emerald-300/30 hover:bg-emerald-300/10"
          >
            <h2 className="text-lg font-semibold text-white">{item.label}</h2>
            <p className="mt-2 text-sm leading-6 text-white/64">{item.copy}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-3 lg:grid-cols-4">
        {roleContexts.map((role) => (
          <Link
            key={role.key}
            href={role.startPath}
            className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 transition hover:border-emerald-300/30 hover:bg-emerald-300/10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/44">
              {role.audience}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">{role.label}</h2>
            <p className="mt-2 text-sm leading-6 text-white/64">{role.description}</p>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
