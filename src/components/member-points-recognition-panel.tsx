import Link from "next/link";

import type { MemberActionRouteSource } from "@/services/member-action-route-href";
import type { MemberRecognitionSummary } from "@/services/member-recognition";

type MemberPointsRecognitionPanelProps = {
  recognition: MemberRecognitionSummary;
  selectedCampaignId?: string;
  source?: MemberActionRouteSource | null;
};

export function MemberPointsRecognitionPanel({
  recognition,
  selectedCampaignId,
  source,
}: MemberPointsRecognitionPanelProps) {
  if (!recognition.canReadRecognition) {
    return null;
  }

  const selectedCampaign =
    recognition.campaignPoints.find((campaign) => campaign.id === selectedCampaignId) ?? null;
  const sourceContext = getMemberPointsSourceContext(source);
  const campaignFocusHref = (campaignId: string) => {
    const searchParams = new URLSearchParams();
    searchParams.set("campaign", campaignId);

    if (source) {
      searchParams.set("source", source);
    }

    return `/rush-month/leaderboard?${searchParams.toString()}#campaign-focus`;
  };

  return (
    <section className="grid gap-3">
      <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(180deg,#2455a4_0%,#2a5fb5_48%,#21457d_100%)] p-4 shadow-[0_24px_80px_rgba(2,14,38,0.28)]">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#dbe8ff]">
          UCLA MEDLIFE
        </p>
        <h1 className="mt-2 text-[2.1rem] font-semibold leading-tight text-white sm:text-[2.5rem]">
          Points &amp; Recognition
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">
          Points come from meaningful action.
        </p>
        {sourceContext ? (
          <div className="mt-4 rounded-[1.3rem] border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-xl">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#dbe8ff]">
                  {sourceContext.eyebrow}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/78">
                  {sourceContext.compactDetail}
                </p>
              </div>
              <Link
                href={sourceContext.href}
                className="inline-flex w-fit rounded-full border border-white/14 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/24 hover:bg-white/14"
              >
                {sourceContext.backLabel}
              </Link>
            </div>
          </div>
        ) : null}
        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {recognition.topStats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-[1.4rem] border border-white/12 bg-white/10 px-4 py-3.5 backdrop-blur-sm"
            >
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/58">
                {stat.label}
              </p>
              <p className="mt-2.5 text-3xl font-semibold leading-none text-white">
                {stat.value}
              </p>
              <p className="mt-1.5 text-xs leading-5 text-white/72">{stat.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="app-surface rounded-[1.8rem] p-4">
        <p className="app-eyebrow app-eyebrow-blue">Points by Campaign</p>
        <div className="mt-3 grid gap-2.5">
          {recognition.campaignPoints.map((campaign) => {
            const width = Math.max(
              8,
              Math.min(100, Math.round((campaign.earned / campaign.available) * 100)),
            );

            return (
              <Link
                key={campaign.label}
                href={campaignFocusHref(campaign.id)}
                aria-current={selectedCampaign?.id === campaign.id ? "page" : undefined}
                className={[
                  "rounded-[1.4rem] border p-3.5 transition",
                  selectedCampaign?.id === campaign.id
                    ? "border-[#bfdbfe] bg-[#fbfdff]"
                    : "border-slate-200 bg-slate-50 hover:border-[#bfdbfe] hover:bg-[#fbfdff]",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-slate-950">{campaign.label}</h2>
                  <span className="text-sm font-semibold text-slate-600">
                    {campaign.earned} / {campaign.available} pts
                  </span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[#2b5fb4]"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {selectedCampaign ? (
        <section
          id="campaign-focus"
          className="app-surface-info rounded-[1.8rem] p-4"
        >
          <p className="app-eyebrow app-eyebrow-blue">Campaign focus</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {selectedCampaign.label}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            {selectedCampaign.detail}
          </p>
          <Link
            href={recognition.explainer.ctaHref}
            className="mt-4 inline-flex rounded-full bg-[#f7d05e] px-4 py-2.5 text-sm font-semibold text-[#08224c]"
          >
            {recognition.explainer.ctaLabel}
          </Link>
        </section>
      ) : null}

      <section className="app-surface rounded-[1.8rem] p-4">
        <p className="app-eyebrow app-eyebrow-blue">Badges Earned</p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {recognition.badges.map((badge) => (
            <article
              key={badge.label}
              className={getBadgeCardClassName(badge.tone)}
            >
              <div className="flex items-start gap-3">
                <div className={getBadgeIconClassName(badge.tone)}>
                  <span aria-hidden="true">☆</span>
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-slate-950">{badge.label}</p>
                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    {getBadgeDetail(badge.label)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="app-surface rounded-[1.8rem] p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="app-eyebrow app-eyebrow-blue">Chapter Leaderboard - Rush Month</p>
          </div>
        </div>
        <div className="mt-3 grid gap-2">
          {recognition.leaderboard.map((row, index) => (
            <article
              key={row.id}
              className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {index + 1}. {row.displayName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{row.roleLabel}</p>
                </div>
                <span className="rounded-full border border-[#f7d05e]/30 bg-[#fff8df] px-3 py-1 text-sm font-semibold text-[#a16207]">
                  {row.points} pts
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="app-surface rounded-[1.8rem] p-4">
        <p className="app-eyebrow app-eyebrow-blue">Recent Approved Actions</p>
        <div className="mt-3 grid gap-2.5">
          {recognition.recentApprovedActions.map((action) => (
            <Link
              key={`${action.title}-${action.pointsLabel}`}
              href={action.href}
              className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-3.5 transition hover:border-[#bfdbfe] hover:bg-[#fbfdff]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">{action.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{action.detail}</p>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                  {action.pointsLabel}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="app-surface-warm rounded-[1.8rem] p-4">
        <p className="app-eyebrow app-eyebrow-warm">{recognition.explainer.title}</p>
        <p className="mt-3 text-sm leading-7 text-slate-700">{recognition.explainer.body}</p>
        <Link
          href={recognition.explainer.ctaHref}
          className="mt-4 inline-flex text-sm font-semibold text-[#2563eb]"
        >
          {recognition.explainer.ctaLabel} →
        </Link>
      </section>
    </section>
  );
}

function getMemberPointsSourceContext(source: MemberActionRouteSource | null | undefined) {
  switch (source) {
    case "home":
      return {
        eyebrow: "From home",
        compactDetail:
          "Home handed you into recognition as part of the weekly loop. Review progress here and still jump back without losing the member-home context.",
        href: "/",
        backLabel: "Back to home",
      };
    case "campaigns":
      return {
        eyebrow: "From campaigns",
        compactDetail:
          "Campaign context explains why these points matter. Use recognition here without losing the larger campaign loop you came from.",
        href: "/campaigns",
        backLabel: "Back to campaigns",
      };
    case "events":
      return {
        eyebrow: "From events",
        compactDetail:
          "Events can turn into recognition when the follow-up is real. Review points here, then return to the event loop if you still need that context.",
        href: "/rush-month/events",
        backLabel: "Back to events",
      };
    case "profile":
      return {
        eyebrow: "From profile",
        compactDetail:
          "Profile should stay distinct while still connecting to meaningful recognition. Review your standing here and return when you need the broader member summary.",
        href: "/profile",
        backLabel: "Back to profile",
      };
    default:
      return null;
  }
}

function getBadgeCardClassName(tone: MemberRecognitionSummary["badges"][number]["tone"]) {
  switch (tone) {
    case "gold":
      return "rounded-[1.35rem] border border-[#f7d05e]/30 bg-[#fffdf5] p-4";
    case "blue":
      return "rounded-[1.35rem] border border-[#bfdbfe] bg-[#fbfdff] p-4";
    case "green":
      return "rounded-[1.35rem] border border-emerald-200 bg-[#f7fffb] p-4";
    case "slate":
      return "rounded-[1.35rem] border border-slate-200 bg-slate-50/70 p-4 opacity-80";
  }
}

function getBadgeIconClassName(tone: MemberRecognitionSummary["badges"][number]["tone"]) {
  switch (tone) {
    case "gold":
      return "flex h-10 w-10 items-center justify-center rounded-full border border-[#f7d05e]/40 bg-[#fff8df] text-[#a16207]";
    case "blue":
      return "flex h-10 w-10 items-center justify-center rounded-full border border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]";
    case "green":
      return "flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "slate":
      return "flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-500";
  }
}

function getBadgeDetail(label: string) {
  switch (label) {
    case "Rush Starter":
      return "Complete first Rush Month action";
    case "Connector":
      return "Invite 10+ members to a chapter event";
    case "Evidence Pro":
      return "3 approvals in a single week";
    case "Chapter MVP":
      return "Top 3 on leaderboard for 2 weeks";
    default:
      return "Chapter recognition badge";
  }
}
