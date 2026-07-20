import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { MemberBottomNav } from "@/components/member-bottom-nav";
import { StudentAppShell } from "@/components/student-app-shell";
import {
  ensureVisibleTestLabel,
  SltPrepSectionCard,
  SltPrepTonePill,
} from "@/components/slt-prep-primitives";
import { SltPrepSubnav } from "@/components/slt-prep-subnav";
import { RestrictedState } from "@/components/restricted-state";
import { WorkspaceAccountMenu } from "@/components/workspace-account-menu";
import { WorkspacePreviewBanner } from "@/components/workspace-preview-banner";
import {
  getSltTripPrepSubnavItems,
  getSltTripPrepWorkspace,
  sltTripPrepMobileQuickNavItems,
  withSltTripPrepTravelerHref,
} from "@/services/slt-trip-prep-workspace";
import { isPreviewWorkspaceAccess } from "@/services/workspace-access";
import type { TripPrepTraveler } from "@/shared/types/slt-trip-prep";
import { getSltPrepPageContext } from "./page-context";

type SltPrepShellMode = "standalone" | "member";
type MemberSltPrepSource = "home" | "campaigns" | null;

export async function renderSltPrepPage(
  redirectPath = "/slt-prep",
  shellMode: SltPrepShellMode = "standalone",
  memberSource: MemberSltPrepSource = null,
  travelerId?: string,
) {
  const { actor, data } = await getSltPrepPageContext(redirectPath);
  const workspace = getSltTripPrepWorkspace(actor, travelerId);
  const selectedTravelerId = workspace.traveler?.id;
  const profileHref = memberSource === "home" ? "/profile?source=home" : "/profile";
  const content = (
    <>
      <DataSourceNotice source={data.source} />
      <SltPrepSubnav items={[...getSltTripPrepSubnavItems(actor, selectedTravelerId)]} />

      {!workspace.canReadWorkspace || !workspace.traveler ? (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref={workspace.nextStep.href}
          nextLabel={workspace.nextStep.label}
        />
      ) : (
          <SltPrepOverviewSurface workspace={workspace} travelerId={selectedTravelerId} />
      )}
    </>
  );

  if (shellMode === "member") {
    return (
      <StudentAppShell
        actor={actor}
        hideTopHeader
        showMobileQuickItemHelpers={false}
        showDebugTools={false}
      >
        <div className="pb-24">
          <WorkspaceAccountMenu actor={actor} currentWorkspace="student_app" />
          {isPreviewWorkspaceAccess(actor, "student_app") ? (
            <WorkspacePreviewBanner workspaceLabel="the General Student App" />
          ) : null}
              {memberSource === "home" || memberSource === "campaigns" ? (
                <section className="mb-4 rounded-[1.4rem] border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                    {memberSource === "home"
                      ? "Opened from the TEST member home"
                      : "Opened from the TEST campaign shell"}
                  </p>
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm leading-6 text-slate-600">
                      {memberSource === "home"
                        ? "Keep the SLT handoff inside the same student shell, then step back into home when you want the next event, points, or profile move."
                        : "Keep the SLT handoff inside the same student shell, then step back into campaigns when you want the next member continuity move."}
                    </p>
                    <Link
                      href={memberSource === "home" ? "/app" : "/campaigns"}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      {memberSource === "home" ? "Back to Home" : "Back to Campaigns"}
                    </Link>
                  </div>
                </section>
              ) : null}
          {content}
        </div>
        <MemberBottomNav activeTab={null} profileHref={profileHref} />
      </StudentAppShell>
    );
  }

  return (
    <AppShell
      actor={actor}
      hideTopHeader
      mobileQuickItemsOverride={[...sltTripPrepMobileQuickNavItems]}
    >
      {content}
    </AppShell>
  );
}

function SltPrepOverviewSurface({
  workspace,
  travelerId,
}: {
  workspace: ReturnType<typeof getSltTripPrepWorkspace>;
  travelerId?: string;
}) {
  if (!workspace.traveler) {
    return null;
  }

  const traveler = workspace.traveler;
  const [tripName, tripSeason] = splitTripLabel(traveler.tripLabel);
  const completedCount = traveler.checklist.filter((item) => item.status === "complete").length;
  const totalCount = traveler.checklist.length;
  const nextMeeting = traveler.meetings.find((meeting) => meeting.status === "upcoming");
  const upcomingDeadlines = traveler.timeline.filter((event) => event.status !== "complete").slice(0, 3);
  const sections = buildOverviewSections(traveler);
  const alert = traveler.alerts[0];
  const visibleTripName = ensureVisibleTestLabel(tripName);
  const visibleCityLabel = ensureVisibleTestLabel(traveler.cityLabel);
  const visibleChapterName = ensureVisibleTestLabel(traveler.chapterName);

  return (
    <>
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_48px_rgba(15,23,42,0.08)]">
        <div
          className="relative px-5 pb-8 pt-10"
          style={{
            backgroundImage:
              "linear-gradient(175deg, rgba(0,52,120,0.96) 0%, rgba(0,70,150,0.9) 44%, rgba(0,80,160,0.74) 100%), url('https://images.unsplash.com/photo-1532996152552-eaffc4edfc1a?w=1200&h=720&fit=crop&auto=format&q=85')",
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-1 rounded-full bg-[#FFB81C]" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">
              myMEDLIFE
            </p>
          </div>

          <h1 className="mt-5 text-[2rem] font-black leading-none tracking-tight text-white sm:text-[2.35rem]">
            {visibleTripName}
          </h1>
          <p className="mt-1 text-sm font-semibold tracking-wide text-white/56">{tripSeason}</p>
          <p className="mt-3 text-xs text-white/55">{visibleCityLabel}</p>

          <div className="mt-7 rounded-[1.6rem] border border-white/14 bg-white/10 p-5 backdrop-blur-xl">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">
                  Departure in
                </p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-4xl font-black leading-none text-[#FFB81C]">
                    {workspace.countdownLabel.split(" ")[0]}
                  </span>
                  <span className="pb-1 text-sm font-medium text-white/60">
                    {tripSeason}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">
                  Trip readiness
                </p>
                <p className="mt-2 text-lg font-bold text-white">
                  {completedCount} of {totalCount} steps complete
                </p>
              </div>
            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-[#FFB81C] transition-all"
                style={{ width: `${workspace.readiness.score}%` }}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <SltPrepTonePill
                tone={workspace.readiness.tone}
                label={workspace.readiness.label}
              />
              <span className="rounded-full border border-white/14 bg-white/10 px-3 py-1 text-xs font-semibold text-white/78">
                {visibleChapterName}
              </span>
            </div>
          </div>
        </div>
      </section>

      {alert ? (
        <section className={getAlertChrome(alert.tone)}>
          <div className={getAlertBand(alert.tone)}>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/90">
              {getAlertLabel(alert.tone)}
            </p>
          </div>
          <div className="px-4 pb-5 pt-4">
            <p className={getAlertEyebrow(alert.tone)}>{alert.dueLabel}</p>
            <h2 className="mt-1 text-xl font-bold leading-tight text-slate-950">
              {ensureVisibleTestLabel(alert.label)}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {ensureVisibleTestLabel(alert.summary)}
            </p>
            <Link
              href={withSltTripPrepTravelerHref(alert.href, travelerId)}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#FFB81C] px-4 py-3 text-base font-bold tracking-wide text-slate-950 shadow-sm transition hover:brightness-95"
            >
              Complete next step
            </Link>
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2">
        <SltPrepSectionCard eyebrow="Next deadline" title="What is due next?" variant="light">
          {upcomingDeadlines[0] ? (
            <Link
              href={withSltTripPrepTravelerHref("/slt-prep/timeline", travelerId)}
              className="block rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-slate-300 hover:bg-slate-100/80"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {ensureVisibleTestLabel(upcomingDeadlines[0].label)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{upcomingDeadlines[0].dateLabel}</p>
                </div>
                <SltPrepTonePill
                  tone={getTimelineTone(upcomingDeadlines[0].status)}
                  label={getTimelineLabel(upcomingDeadlines[0].status)}
                  variant="light"
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {ensureVisibleTestLabel(upcomingDeadlines[0].summary)}
              </p>
            </Link>
          ) : (
            <p className="text-sm leading-6 text-slate-600">No open deadlines remain in this preview.</p>
          )}
        </SltPrepSectionCard>

        <SltPrepSectionCard eyebrow="Upcoming meeting" title="Stay ready for the next call" variant="light">
          {nextMeeting ? (
            <Link
              href={withSltTripPrepTravelerHref("/slt-prep/meetings", travelerId)}
              className="block rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-slate-300 hover:bg-slate-100/80"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {ensureVisibleTestLabel(nextMeeting.title)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{nextMeeting.timingLabel}</p>
                </div>
                <SltPrepTonePill tone="yellow" label="Upcoming" variant="light" />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {ensureVisibleTestLabel(nextMeeting.summary)}
              </p>
            </Link>
          ) : (
            <p className="text-sm leading-6 text-slate-600">No upcoming pre-trip meetings are visible right now.</p>
          )}
        </SltPrepSectionCard>
      </section>

      <SltPrepSectionCard eyebrow="Checklist" title="What is complete, missing, or due soon?" variant="light">
        <div className="grid gap-3">
          {sections.map((section) => (
            <Link
              key={section.label}
              href={withSltTripPrepTravelerHref(section.href, travelerId)}
              className="flex items-center gap-4 rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${section.iconChrome}`}>
                <span className="text-sm font-black">{section.iconLabel}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-slate-950">{section.label}</p>
                  <SltPrepTonePill tone={section.tone} label={section.badge} variant="light" />
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {ensureVisibleTestLabel(section.summary)}
                </p>
              </div>
              <span className="text-sm font-semibold text-slate-300">→</span>
            </Link>
          ))}
        </div>
      </SltPrepSectionCard>

      <SltPrepSectionCard eyebrow="Preview safety" title="What stays blocked for now" variant="light">
        <div className="grid gap-3">
              {[
            traveler.mockSources.shopify,
            traveler.mockSources.hubspot,
            traveler.mockSources.luma,
            "Payments, forms, profile edits, meeting joins, reminders, and traveler approvals stay preview-only on this student route.",
          ].map((note) => (
            <p
              key={note}
              className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600"
            >
              {ensureVisibleTestLabel(note)}
            </p>
          ))}
        </div>
      </SltPrepSectionCard>
    </>
  );
}

function buildOverviewSections(traveler: TripPrepTraveler) {
  return [
    buildOverviewSection(
      "Payments",
      "/slt-prep/payments",
      "P",
      "bg-emerald-50 text-emerald-600",
      traveler.payments.map((item) =>
        item.status === "paid"
          ? "complete"
          : item.status === "processing"
            ? "in_review"
            : "needs_attention",
      ),
      `${traveler.payments.length} payment milestones visible in preview.`,
    ),
    buildOverviewSection(
      "Required Forms",
      "/slt-prep/forms",
      "F",
      "bg-blue-50 text-blue-600",
      traveler.forms.map((item) =>
        item.status === "submitted"
          ? "complete"
          : item.status === "needs_signature"
            ? "needs_attention"
            : "in_review",
      ),
      `${traveler.forms.length} student forms remain route-backed and read-only here.`,
    ),
    buildOverviewSection(
      "Travel Details",
      "/slt-prep/checklist",
      "T",
      "bg-amber-50 text-amber-600",
      [
        ...traveler.checklist
          .filter((item) => item.category === "Travel docs" || item.category === "Flights")
          .map((item) => item.status),
        ...traveler.flights.map((flight) =>
          flight.status === "confirmed"
            ? "complete"
            : flight.status === "watch"
              ? "in_review"
              : "needs_attention",
        ),
      ],
      "Flight details and travel documents stay visible without enabling live uploads.",
    ),
    buildOverviewSection(
      "Meetings",
      "/slt-prep/meetings",
      "M",
      "bg-violet-50 text-violet-600",
      traveler.meetings.map((meeting) =>
        meeting.status === "attended"
          ? "complete"
          : meeting.status === "missed"
            ? "needs_attention"
            : "upcoming",
      ),
      "Upcoming and missed pre-trip sessions stay easy to review.",
    ),
    buildOverviewSection(
      "Extensions / Extra Tours",
      "/slt-prep/extensions",
      "E",
      "bg-cyan-50 text-cyan-600",
      traveler.extensions.map((item) =>
        item.status === "selected"
          ? "complete"
          : item.status === "considering"
            ? "upcoming"
            : "needs_attention",
      ),
      "Optional add-ons remain visible without opening live booking.",
    ),
    buildOverviewSection(
      "Packing and Preparation",
      "/slt-prep/checklist",
      "P",
      "bg-slate-100 text-slate-500",
      traveler.checklist
        .filter((item) => item.category === "Preparation")
        .map((item) => item.status),
      "Packing guidance is future-wired from the SLT prep packet and stays read-only for now.",
    ),
  ];
}

type OverviewStatus = "complete" | "in_review" | "needs_attention" | "upcoming";

function buildOverviewSection(
  label: string,
  href: string,
  iconLabel: string,
  iconChrome: string,
  statuses: OverviewStatus[],
  fallbackSummary: string,
) {
  const tone = getChecklistTone(statuses);
  const completeCount = statuses.filter((status) => status === "complete").length;
  const summary =
    statuses.length === 0
      ? fallbackSummary
      : tone === "red"
        ? `${statuses.filter((status) => status === "needs_attention").length} item${statuses.filter((status) => status === "needs_attention").length === 1 ? "" : "s"} need attention.`
        : tone === "yellow"
          ? `${statuses.filter((status) => status === "in_review" || status === "upcoming").length} due soon or still in review.`
          : `${completeCount} of ${statuses.length} complete.`;

  return {
    label,
    href,
    iconLabel,
    iconChrome,
    tone,
    badge: getChecklistBadge(tone, statuses.length === 0),
    summary,
  };
}

function getChecklistTone(statuses: OverviewStatus[]): "red" | "yellow" | "green" {
  if (statuses.length === 0) {
    return "yellow";
  }

  if (statuses.some((status) => status === "needs_attention")) {
    return "red";
  }

  if (statuses.some((status) => status === "in_review" || status === "upcoming")) {
    return "yellow";
  }

  return "green";
}

function getChecklistBadge(
  tone: "red" | "yellow" | "green",
  isFutureWired: boolean,
) {
  if (isFutureWired) {
    return "Future wired";
  }

  switch (tone) {
    case "red":
      return "Overdue";
    case "yellow":
      return "Due soon";
    case "green":
      return "Complete";
  }
}

function splitTripLabel(label: string) {
  const [name, season] = label.split("|").map((part) => part.trim());

  return [name ?? label, season ?? "Service Learning Trip"] as const;
}

function getAlertChrome(tone: "red" | "yellow" | "green") {
  switch (tone) {
    case "red":
      return "overflow-hidden rounded-[1.65rem] border border-rose-200 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.06)]";
    case "yellow":
      return "overflow-hidden rounded-[1.65rem] border border-amber-200 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.06)]";
    case "green":
      return "overflow-hidden rounded-[1.65rem] border border-emerald-200 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.06)]";
  }
}

function getAlertBand(tone: "red" | "yellow" | "green") {
  switch (tone) {
    case "red":
      return "bg-rose-600 px-4 py-2";
    case "yellow":
      return "bg-amber-500 px-4 py-2";
    case "green":
      return "bg-emerald-600 px-4 py-2";
  }
}

function getAlertLabel(tone: "red" | "yellow" | "green") {
  switch (tone) {
    case "red":
      return "Immediate action required";
    case "yellow":
      return "Action due soon";
    case "green":
      return "You're on track";
  }
}

function getAlertEyebrow(tone: "red" | "yellow" | "green") {
  switch (tone) {
    case "red":
      return "text-xs font-semibold uppercase tracking-wide text-rose-500";
    case "yellow":
      return "text-xs font-semibold uppercase tracking-wide text-amber-600";
    case "green":
      return "text-xs font-semibold uppercase tracking-wide text-emerald-600";
  }
}

function getTimelineTone(
  status: "complete" | "current" | "next" | "upcoming",
): "red" | "yellow" | "green" {
  switch (status) {
    case "complete":
      return "green";
    case "current":
    case "next":
    case "upcoming":
      return "yellow";
  }
}

function getTimelineLabel(status: "complete" | "current" | "next" | "upcoming") {
  switch (status) {
    case "complete":
      return "Complete";
    case "current":
      return "Current";
    case "next":
      return "Next";
    case "upcoming":
      return "Upcoming";
  }
}
