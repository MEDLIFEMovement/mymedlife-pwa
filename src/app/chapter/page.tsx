import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { mockCampaign, mockChapter, pointsSummary } from "@/data/mock-rush-month";
import { getProgressCounts } from "@/lib/rush-month";

export default function ChapterPage() {
  const progress = getProgressCounts();

  return (
    <AppShell>
      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
          Chapter home
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">{mockChapter.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
          {mockChapter.campus} in the {mockChapter.region} region. Coach:
          {" "}
          {mockChapter.coachName}. This page is the chapter front door for the
          current campaign and action loop.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Current campaign" value={mockCampaign.name} note={mockCampaign.weekLabel} />
        <MetricCard
          label="Progress"
          value={`${progress.approved}/${progress.total}`}
          note="Approved actions this week"
        />
        <MetricCard
          label="Points"
          value={`${pointsSummary.earned}/${pointsSummary.available}`}
          note="Mock points from approved proof"
        />
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
        <h2 className="text-2xl font-semibold text-white">Start here</h2>
        <p className="mt-2 text-sm leading-6 text-white/66">
          Rush Month is active. Leaders assign work, members submit proof, and
          coaches review the advance / hold / intervene state.
        </p>
        <Link
          href="/rush-month"
          className="mt-4 inline-flex rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
        >
          Open Rush Month
        </Link>
      </section>
    </AppShell>
  );
}
