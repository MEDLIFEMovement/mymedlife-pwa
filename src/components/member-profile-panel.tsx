import Link from "next/link";

import type { ProfileWorkspace } from "@/services/profile-workspace";
import type { MemberRecognitionSummary } from "@/services/member-recognition";
import type { StudentHomeWorkspace } from "@/services/student-home-workspace";

type MemberProfilePanelProps = {
  chapterName: string;
  displayName: string;
  workspace: ProfileWorkspace;
  studentHome: StudentHomeWorkspace;
  recognition: MemberRecognitionSummary;
};

export function MemberProfilePanel({
  chapterName,
  displayName,
  workspace,
  studentHome,
  recognition,
}: MemberProfilePanelProps) {
  const firstName = displayName.split(" ")[0] ?? displayName;
  const visibleBadges = recognition.badges.slice(0, 4);

  return (
    <section className="grid gap-4">
      <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(180deg,#2455a4_0%,#2a5fb5_48%,#21457d_100%)] shadow-[0_24px_80px_rgba(2,14,38,0.28)]">
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#dbe8ff]">
                {chapterName}
              </p>
              <h1 className="mt-2 text-[2.25rem] font-semibold leading-none text-white sm:text-[2.6rem]">
                Hi, {firstName}
              </h1>
              <p className="mt-2 text-sm text-white/78">
                Keep your chapter role, progress, and next step close at hand.
              </p>
            </div>
            <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs font-semibold text-white/78">
              {workspace.profileLabel}
            </span>
          </div>

          <article className="mt-5 rounded-[1.6rem] border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#f7d05e]">
                  Profile snapshot
                </p>
                <h2 className="mt-2 text-xl font-semibold leading-tight text-white">
                  {displayName}
                </h2>
                <p className="mt-2 text-sm text-white/74">
                  {workspace.profileLabel} · {chapterName}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xl font-semibold text-white">
                {firstName.slice(0, 1)}
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/74">
              Keep this surface centered on identity, role, and the next step. Recognition
              and points stay visible lower on the route instead of turning profile into a
              second dashboard.
            </p>
          </article>
        </div>
      </section>

      <section className="app-surface-info rounded-[1.8rem] p-4 sm:p-5">
        <p className="app-eyebrow app-eyebrow-blue">Next step</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          {workspace.nextStep.detail}
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          Pick up the next step that matters most without losing your place in the
          member experience.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={workspace.nextStep.href}
            className="inline-flex rounded-full bg-[#f7d05e] px-4 py-2.5 text-sm font-semibold text-[#08224c]"
          >
            {workspace.nextStep.label}
          </Link>
          <Link
            href={`${studentHome.campaign.campaignsHref}?source=profile`}
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            Open campaign
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="app-surface rounded-[2rem] p-5">
          <p className="app-eyebrow app-eyebrow-blue">About you</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            The basics your chapter sees.
          </h2>
          <div className="mt-4 grid gap-3">
            {workspace.identityRows.map((row) => (
              <ProfileRowCard key={row.label} row={row} />
            ))}
          </div>
        </section>

        <section className="app-surface rounded-[2rem] p-5">
          <p className="app-eyebrow app-eyebrow-blue">Chapter access</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Where you fit in right now.
          </h2>
          <div className="mt-4 grid gap-3">
            {workspace.scopeRows.map((row) => (
              <ProfileRowCard key={row.label} row={row} />
            ))}
          </div>
        </section>
      </section>

      <section className="app-surface rounded-[1.8rem] p-4 sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="app-eyebrow app-eyebrow-blue">Recognition</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Recognition and momentum.</h2>
          </div>
          <Link
            href="/rush-month/leaderboard?source=profile"
            className="text-sm font-semibold text-[#2563eb]"
          >
            Open points
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {visibleBadges.map((badge) => (
            <span key={badge.label} className={getBadgeClassName(badge.tone)}>
              {badge.label}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">{studentHome.points.recognition}</p>
      </section>
    </section>
  );
}

function ProfileRowCard({
  row,
}: {
  row: ProfileWorkspace["identityRows"][number];
}) {
  return (
    <article className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-4">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {row.label}
      </p>
      <p className="mt-2 text-base font-semibold text-slate-950">{row.value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{row.detail}</p>
    </article>
  );
}

function getBadgeClassName(tone: MemberRecognitionSummary["badges"][number]["tone"]) {
  switch (tone) {
    case "gold":
      return "rounded-full border border-[#f7d05e]/40 bg-[#fff8df] px-3 py-1.5 text-sm font-semibold text-[#a16207]";
    case "blue":
      return "rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-sm font-semibold text-[#2563eb]";
    case "green":
      return "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700";
    case "slate":
      return "rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700";
  }
}
