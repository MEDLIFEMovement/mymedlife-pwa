import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Flag,
  Trophy,
} from "lucide-react";

import type { AppOwnedCampaignReadback } from "@/services/campaign-readback";
import type { CampaignStarterShellReadiness } from "@/services/campaign-starter-shell-readiness";
import type { CampaignReadinessSummary, CampaignShell } from "@/shared/types/campaigns";

type FigmaMemberCampaignsPageProps = {
  campaigns: CampaignShell[];
  summary: CampaignReadinessSummary;
  readiness: CampaignStarterShellReadiness;
  readback?: AppOwnedCampaignReadback | null;
};

export function FigmaMemberCampaignsPage({
  campaigns,
  summary,
  readiness,
  readback = null,
}: FigmaMemberCampaignsPageProps) {
  const activeCampaign = campaigns.find((campaign) => campaign.status === "active") ?? campaigns[0];
  const visibleCampaigns = activeCampaign ? campaigns : [];
  const actionGroups = readback?.actionGroups ?? [
    {
      role: "General Members",
      actionSummary: "Invite friends · RSVP · attend the event",
      completionLabel: "1/3 done",
    },
    {
      role: "Action Committee Chairs",
      actionSummary: "Coordinate tabling · track leads · brief members",
      completionLabel: "3/5 done",
    },
    {
      role: "E-Board",
      actionSummary: "Review KPIs · manage Luma · assign tasks",
      completionLabel: "4/6 done",
    },
  ];
  const goodLooksLike = readback?.goodLooksLike ?? [
    "Intro event is live on Luma with RSVP link",
    "Every member has one assigned action",
    "Attendance feeds the points leaderboard",
    "Follow-up happens within 24 hours",
  ];

  if (readback && !activeCampaign) {
    return (
      <main
        className="min-h-screen bg-[#f7f4ee] pb-24"
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      >
        <div className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4ee] px-5 pb-10 pt-12 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
          <Link
            href="/app"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1B4B8E] text-white"
            aria-label="Back to student home"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="mt-8 text-2xl font-extrabold text-[#1a0a0a]">
            No app-owned campaign is active
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#7a5a5a]">
            {readback.sourceMessage} No TEST campaign has been substituted for
            this signed-in account.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-[#f7f4ee] pb-24"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4ee] shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="bg-[#1B4B8E] px-5 pb-7 pt-12 text-white">
          <Link
            href="/app"
            className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
            aria-label="Back to student home"
          >
            <ArrowLeft size={18} />
          </Link>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
            {readback
              ? `${activeCampaign?.status ?? "unavailable"} · App-owned`
              : "TEST active · Week 1 of 4"}
          </span>
          <h1 className="mt-3 text-2xl font-extrabold">
            {activeCampaign?.name ?? "Campaigns"}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-blue-100">
            {activeCampaign?.studentPromise ??
              "Campaigns turn MEDLIFE action into clear student steps."}
          </p>
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-blue-100">
              <span>Chapter progress</span>
              <span className="font-bold text-white">
                {readback ? readback.progressLabel : "67%"}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-[#F5A623]"
                style={{ width: `${readback?.progressPercent ?? 67}%` }}
              />
            </div>
          </div>
        </div>

        <section className="space-y-5 px-4 pt-5">
          <div className="rounded-2xl border border-[#d8e3f8] bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1B4B8E]">
                <Flag size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#1B4B8E]">
                  Current Phase
                </p>
                <p className="mt-0.5 text-sm font-bold text-[#1a0a0a]">
                  {readback?.currentPhaseLabel ?? "TEST Visibility + Lead Capture"}
                </p>
                <p className="mt-0.5 text-xs text-[#7a5a5a]">
                  {readback?.currentPhaseDetail ??
                    "TEST Luma event linked · RSVP path visible"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <StudentSectionLabel>Campaign KPIs</StudentSectionLabel>
            <div className="grid grid-cols-2 gap-2">
              <StudentKpiCard label="Active" value={summary.activeCampaigns} note="launch campaign" />
              <StudentKpiCard
                label="Events"
                value={summary.linkedMockEvents}
                note={readback ? "app-owned links" : "TEST mock-linked"}
              />
              <StudentKpiCard label="Proof" value={summary.hqProofItems} note="HQ review items" />
              <StudentKpiCard
                label="Integrations"
                value={summary.disabledIntegrationEvents}
                note="disabled safely"
              />
            </div>
          </div>

          <div>
            <StudentSectionLabel>Assigned Actions by Role</StudentSectionLabel>
            <div className="space-y-2">
              {actionGroups.length > 0 ? actionGroups.map((group) => (
                <Link
                  key={group.role}
                  href="/rush-month/actions"
                  className="block rounded-2xl border border-[#e5ded3] bg-white p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-bold text-[#1a0a0a]">{group.role}</p>
                    <span className="font-mono text-xs font-semibold text-[#7a5a5a]">
                      {group.completionLabel}
                    </span>
                  </div>
                  <p className="text-xs text-[#7a5a5a]">{group.actionSummary}</p>
                </Link>
              )) : (
                <div className="rounded-2xl border border-[#e5ded3] bg-white p-4">
                  <p className="text-sm font-bold text-[#1a0a0a]">
                    No app-owned assignments are visible
                  </p>
                  <p className="mt-1 text-xs text-[#7a5a5a]">
                    Assignment counts stay at zero until a real assignment is recorded.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <StudentSectionLabel>What Good Looks Like</StudentSectionLabel>
            <div className="space-y-3 rounded-2xl border border-[#e5ded3] bg-white p-4">
              {goodLooksLike.map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#1B4B8E]" />
                  <p className="text-sm leading-snug text-[#1a0a0a]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {readback?.nextEvent || !readback ? (
            <Link
              href={
                readback?.nextEvent
                  ? `/app/events/${readback.nextEvent.id}?source=campaigns`
                  : "/app/events"
              }
              className="flex items-center gap-3 rounded-2xl border border-[#d8e3f8] bg-[#edf4ff] p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1B4B8E]">
                <CalendarDays size={18} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#1a0a0a]">
                  {readback?.nextEvent?.title ?? "TEST Rush Month Info Night"}
                </p>
                <p className="text-xs text-[#4c668b]">
                  {readback?.nextEvent
                    ? `${readback.nextEvent.statusLabel} · Open event detail`
                    : "TEST event · RSVP · attendance · points"}
                </p>
              </div>
              <Trophy size={20} className="text-[#F5A623]" />
            </Link>
          ) : (
            <div className="rounded-2xl border border-[#e5ded3] bg-white p-4">
              <p className="text-sm font-bold text-[#1a0a0a]">
                No app-owned event is attached
              </p>
              <p className="mt-1 text-xs text-[#7a5a5a]">
                The campaign will link to event detail after a real chapter event is recorded.
              </p>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href="/app/stories"
              className="rounded-2xl border border-[#e5ded3] bg-white p-4"
            >
              <p className="text-sm font-bold text-[#1a0a0a]">Open MEDLIFE Stories</p>
              <p className="mt-1 text-xs leading-5 text-[#7a5a5a]">
                Review the field-story feed in a preview-safe route, not a public publishing lane.
              </p>
            </Link>
            <Link
              href="/proof-library/upload"
              className="rounded-2xl border border-[#e5ded3] bg-white p-4"
            >
              <p className="text-sm font-bold text-[#1a0a0a]">
                Preview proof upload requirements
              </p>
              <p className="mt-1 text-xs leading-5 text-[#7a5a5a]">
                See consent, storage, and blocked upload rules before any proof write path exists.
              </p>
            </Link>
            <Link
              href="/app/slt-prep?source=campaigns"
              className="rounded-2xl border border-[#e5ded3] bg-white p-4"
            >
              <p className="text-sm font-bold text-[#1a0a0a]">Open TEST member SLT prep</p>
              <p className="mt-1 text-xs leading-5 text-[#7a5a5a]">
                Keep campaign planning in the same preview-safe member shell before any write or
                travel proof work appears.
              </p>
            </Link>
          </div>

          {readiness.canReadReadiness ? (
            <div className="rounded-2xl border border-[#e5ded3] bg-white p-4">
              <StudentSectionLabel>{readiness.title}</StudentSectionLabel>
              <p className="mt-2 text-sm leading-6 text-[#7a5a5a]">{readiness.summary}</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <StudentKpiCard label="Ready" value={readiness.presentCount} note="shells" />
                <StudentKpiCard label="Missing" value={readiness.missingCount} note="shells" />
                <StudentKpiCard label="Writes" value={readiness.externalWritesExpected} note="external" />
              </div>
            </div>
          ) : null}

          {visibleCampaigns.length > 1 ? (
            <div>
              <StudentSectionLabel>Other Campaigns</StudentSectionLabel>
              <div className="space-y-2">
                {visibleCampaigns.slice(1).map((campaign) => (
                  <Link
                    key={campaign.slug}
                    href={`/campaigns/${campaign.slug}`}
                    className="block rounded-2xl border border-[#e5ded3] bg-white p-4"
                  >
                    <p className="text-sm font-bold text-[#1a0a0a]">{campaign.name}</p>
                    <p className="mt-1 text-xs leading-5 text-[#7a5a5a]">{campaign.summary}</p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function StudentSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1B4B8E]">
      {children}
    </p>
  );
}

function StudentKpiCard({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e5ded3] bg-white p-3">
      <p className="text-xs leading-tight text-[#7a5a5a]">{label}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-xl font-extrabold text-[#1a0a0a]">{value}</span>
      </div>
      <p className="mt-1 text-[10px] font-semibold text-[#7a5a5a]">{note}</p>
    </div>
  );
}
