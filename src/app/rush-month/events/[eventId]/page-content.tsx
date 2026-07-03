import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { runLaunchLaneMemberRsvpAction } from "@/app/launch-lane/actions";
import { StudentAppShell } from "@/components/student-app-shell";
import {
  EventLoopStrip,
  type EventLoopStripItem,
} from "@/components/event-loop-strip";
import { MemberLiveRsvpCard } from "@/components/member-live-rsvp-card";
import { RestrictedState } from "@/components/restricted-state";
import { getLumaLivePilotGateDurable } from "@/services/luma-live-pilot";
import {
  getLaunchLaneResultNotice,
  getMemberLaunchLaneRsvpCard,
  getMemberLaunchLaneRsvpCardForEvent,
  type MemberLaunchLaneRsvpCard,
} from "@/services/luma-launch-lane-workspace";
import { getLumaPilotPersistenceReadiness } from "@/services/luma-live-pilot-persistence";
import { getLaunchLaneMemberPointsHref } from "@/services/events-points-launch-lane";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import type { MemberActionRouteSource } from "@/services/member-action-route-href";
import { buildMemberLaunchLaneEventDetailHref } from "@/services/member-launch-lane-events";
import { getRushMonthEventsRouteRedirectHref } from "@/services/owned-route-redirect";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import {
  type EventDetailCheckStatus,
  getRushMonthEventDetailWorkspace,
} from "@/services/rush-month-event-detail";

export type RushMonthEventDetailPageProps = {
  params: Promise<{
    eventId: string;
  }>;
  searchParams?: Promise<{
    returnTo?: string;
    source?: string;
    lumaResult?: string;
    lumaMessage?: string;
  }>;
};

type RushMonthEventDetailRenderProps = RushMonthEventDetailPageProps & {
  routeFamily?: "app" | "legacy";
};

export async function renderRushMonthEventDetailPage({
  params,
  searchParams,
  routeFamily = "legacy",
}: RushMonthEventDetailRenderProps) {
  const { eventId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const actor = await getLocalActorContext();

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref(buildMemberLaunchLaneEventDetailHref(eventId)));
  }

  const redirectHref = getRushMonthEventsRouteRedirectHref(actor, {
    eventId,
    source: resolvedSearchParams?.source,
    routeFamily,
  });

  if (redirectHref) {
    redirect(redirectHref);
  }

  const data = await getReadOnlyAppData();

  const memberActionSource = parseMemberEventSource(resolvedSearchParams?.source);
  const workspace = getRushMonthEventDetailWorkspace(
    actor,
    eventId,
    memberActionSource,
    data,
  );

  if (!workspace) {
    notFound();
  }

  if (!workspace.canReadWorkspace || !workspace.event) {
    return (
      <StudentAppShell
        actor={actor}
        hideTopHeader
        showMobileQuickItemHelpers={false}
        showDebugTools={false}
      >
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref={workspace.nextStep.href}
          nextLabel={workspace.nextStep.label}
        />
      </StudentAppShell>
    );
  }

  const event = workspace.event;
  const memberBackLink = getMemberBackLink(memberActionSource);
  const memberSourceContext = getMemberEventDetailSourceContext(memberActionSource);
  const liveLoop = await getMemberEventDetailLiveLoop(
    actor,
    data,
    event.title,
    Boolean(event.memberLumaLabel),
  );
  const rsvpReturnTo = memberActionSource
    ? buildMemberLaunchLaneEventDetailHref(event.id, memberActionSource)
    : buildMemberLaunchLaneEventDetailHref(event.id);
  const resultNotice = getLaunchLaneResultNotice(resolvedSearchParams ?? {});

  return (
    <StudentAppShell
      actor={actor}
      hideTopHeader
      showMobileQuickItemHelpers={false}
      showDebugTools={false}
    >
      <>
          <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(145deg,#0a3b88_0%,#0b4f9b_58%,#081a3a_100%)] p-4 shadow-[0_24px_80px_rgba(2,14,38,0.32)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/82">
                    {workspace.title}
                  </span>
                  <span className="rounded-full border border-[#2563eb]/30 bg-[#2563eb]/12 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                    {event.rsvpStatusLabel}
                  </span>
                </div>
                <h1 className="mt-2.5 text-[2rem] font-semibold leading-tight text-white">
                  {event.title}
                </h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  {event.memberLumaLabel ? (
                    <span className="rounded-full border border-[#60a5fa]/28 bg-[#2563eb]/16 px-3 py-1 text-xs font-semibold text-white/92">
                      {event.memberLumaLabel}
                    </span>
                  ) : null}
                  <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs font-semibold text-white/82">
                    {event.memberCampaignLabel}
                  </span>
                  <span className="rounded-full border border-[#2563eb]/28 bg-[#2563eb]/12 px-3 py-1 text-xs font-semibold text-[#2563eb]">
                    {event.memberPointsLabel}
                  </span>
                </div>
                <div className="mt-3 grid gap-1.5 text-sm text-white/82">
                  <p>{event.memberDateTimeLabel}</p>
                  <p>{event.memberLocationLabel}</p>
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/78">
                  {workspace.summary}
                </p>
                {memberSourceContext ? (
                  <div className="mt-4 max-w-xl rounded-[1.3rem] border border-white/12 bg-white/10 p-3.5 backdrop-blur-sm">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#dbe8ff]">
                      {memberSourceContext.eyebrow}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/78">
                      {memberSourceContext.detail}
                    </p>
                  </div>
                ) : null}
                <div className="mt-4 max-w-3xl rounded-[1.3rem] border border-[#2563eb]/22 bg-[#dbeafe]/10 p-3.5">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                    Event loop
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/80">
                    Luma holds the event, RSVP shows intent, attendance confirms
                    who showed up, and points move once the chapter can trust the
                    record.
                  </p>
                  <EventLoopStrip
                    items={buildMemberEventLoopItems(event, liveLoop?.card ?? null)}
                    className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <Link
                    href={workspace.nextStep.href}
                    className="inline-flex rounded-full bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-[#08224c]"
                  >
                    {workspace.nextStep.label}
                  </Link>
                  <Link
                    href={workspace.secondaryStep.href}
                    className="inline-flex rounded-full border border-white/18 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-white/28 hover:bg-[#eef5ff] hover:text-slate-950"
                  >
                    {workspace.secondaryStep.label}
                  </Link>
                </div>
              </div>
              <Link
                href={memberBackLink.href}
                className="w-fit rounded-full border border-white/14 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/24 hover:bg-white/14"
              >
                {memberBackLink.label}
              </Link>
            </div>
          </section>

          <div className="grid gap-3 rounded-[2rem] bg-[#eef3fb] p-4 shadow-[0_18px_50px_rgba(5,24,60,0.12)]">
            <section
              id="rsvp-status"
              className="app-surface rounded-[2rem] p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <p className="app-eyebrow app-eyebrow-blue">RSVP status</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    {event.rsvpStatusLabel}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {event.rsvpDetail}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <MemberEventStatusPill
                    tone={event.rsvpStatusTone}
                    label={event.rsvpStatusLabel}
                  />
                  {getMemberEventSupportLabel(event) ? (
                    <span className="rounded-full border border-slate-200 bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-slate-600">
                      {getMemberEventSupportLabel(event)}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <span className="rounded-full border border-[#dbeafe] bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#2563eb]">
                  {event.memberCampaignLabel}
                </span>
                <span className="rounded-full border border-[#dbeafe] bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                  {event.memberPointsLabel}
                </span>
              </div>
            </section>

            {liveLoop?.card ? (
            <MemberLiveRsvpCard
              card={liveLoop.card}
              returnTo={rsvpReturnTo}
              leaderboardHref={liveLoop.pointsHref}
              enabled={liveLoop.enabled}
              action={runLaunchLaneMemberRsvpAction}
              resultNotice={resultNotice}
              eyebrow="Live event loop"
            />
            ) : null}

            <section className="app-surface rounded-[2rem] p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="app-eyebrow app-eyebrow-blue">Why this event matters</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    Make the chapter feel easy to say yes to.
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                This event should create one real student moment, one useful
                follow-up signal, and one clean attendance record that helps the
                chapter leaderboard move for the right reasons.
              </p>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
              <section className="app-surface rounded-[2rem] p-4">
                <p className="app-eyebrow app-eyebrow-blue">What to do at this event</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Show up, do the action, and help the chapter feel real.
                </h2>
                <div className="mt-4 grid gap-3">
                  <MemberDetailBlock label="Student action" value={event.expectedStudentAction} />
                  <MemberDetailBlock label="RSVP posture" value={event.rsvpDetail} />
                  <MemberDetailBlock
                    label="Attendance confirmation"
                    value="After the event, the chapter confirms who actually showed up from the same event record before points move."
                  />
                </div>
              </section>

              <section className="app-surface rounded-[2rem] p-4">
                <p className="app-eyebrow app-eyebrow-blue">What happens after you attend</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Attendance turns into points when the chapter can trust the record.
                </h2>
                <div className="mt-4 grid gap-3">
                  <MemberDetailBlock label="Point impact" value={event.memberPointsLabel} />
                  <MemberDetailBlock
                    label="Leaderboard view"
                    value="Once attendance is confirmed, open the leaderboard to see how this event changes chapter momentum."
                  />
                  <MemberDetailBlock
                    label="Why this matters"
                    value="Simple event, attendance, and points rules make it easier for members and leaders to trust how recognition works."
                  />
                </div>
              </section>
            </section>
          </div>
      </>
    </StudentAppShell>
  );
}

function parseMemberEventSource(
  source?: string,
): MemberActionRouteSource | null {
  switch (source) {
    case "home":
    case "events":
    case "points":
    case "profile":
      return source;
    case "campaigns":
      return null;
    default:
      return null;
  }
}

function getMemberBackLink(source: MemberActionRouteSource | null) {
  if (source === "home") {
    return {
      href: "/app",
      label: "Back to home",
    };
  }

  if (source === "points") {
    return {
      href: "/app/points",
      label: "Back to points",
    };
  }

  if (source === "profile") {
    return {
      href: "/profile",
      label: "Back to profile",
    };
  }

  return {
    href: "/app/events",
    label: "Back to events",
  };
}

function getMemberEventDetailSourceContext(source: MemberActionRouteSource | null) {
  switch (source) {
    case "home":
      return {
        eyebrow: "From home",
        detail:
          "Home surfaced this chapter moment as the next place to show up. Keep the weekly loop attached while you inspect the event plan.",
      };
    case "points":
      return {
        eyebrow: "From points",
        detail:
          "Points and recognition led you here because this event can move the chapter leaderboard forward.",
      };
    case "profile":
      return {
        eyebrow: "From profile",
        detail:
          "Profile pointed you into a real chapter moment. Keep that member-owned handoff attached while you inspect this event detail.",
      };
    default:
      return null;
  }
}

async function getMemberEventDetailLiveLoop(
  actor: Awaited<ReturnType<typeof getLocalActorContext>>,
  data: Awaited<ReturnType<typeof getReadOnlyAppData>>,
  eventTitle: string,
  allowFallbackToAnyLinkedEvent: boolean,
) {
  const [gate, readiness] = await Promise.all([
    getLumaLivePilotGateDurable(),
    getLumaPilotPersistenceReadiness(),
  ]);
  const matchedCard = getMemberLaunchLaneRsvpCardForEvent(actor, data, {
    eventTitle,
  });
  const card =
    matchedCard ??
    (allowFallbackToAnyLinkedEvent
      ? getMemberLaunchLaneRsvpCard(actor, data)
      : null);

  return {
    card,
    enabled: gate.rsvpWritesEnabled && readiness.ready,
    pointsHref: getLaunchLaneMemberPointsHref("events"),
  };
}

function buildMemberEventLoopItems(
  event: {
    memberLumaLabel: string | null;
    memberPointsLabel: string;
    rsvpStatusLabel: string;
    rsvpStatusTone: EventDetailCheckStatus;
  },
  liveCard: Pick<
    MemberLaunchLaneRsvpCard,
    "rsvpCount" | "attendanceCount" | "pointsAwarded"
  > | null,
): EventLoopStripItem[] {
  return [
    {
      label: "Event",
      detail: event.memberLumaLabel ? "Luma linked" : "Chapter invite",
      tone: event.memberLumaLabel ? "blue" : "slate",
    },
    {
      label: "RSVP",
      detail: liveCard ? `${liveCard.rsvpCount} RSVP` : event.rsvpStatusLabel,
      tone: event.rsvpStatusTone === "disabled" ? "slate" : "blue",
    },
    {
      label: "Attendance",
      detail: liveCard
        ? `${liveCard.attendanceCount} attended`
        : "Check-in confirms turnout",
      tone: liveCard && liveCard.attendanceCount > 0 ? "gold" : "slate",
    },
    {
      label: "Points",
      detail: liveCard
        ? `${liveCard.pointsAwarded} pts awarded`
        : event.memberPointsLabel,
      tone: liveCard && liveCard.pointsAwarded > 0 ? "gold" : "yellow",
    },
  ];
}

function MemberDetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-surface-soft rounded-[1rem] p-3">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function MemberEventStatusPill({
  label,
  tone,
}: {
  label: string;
  tone: EventDetailCheckStatus;
}) {
  const className =
    tone === "ready"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : tone === "mocked"
        ? "border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]"
        : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <span
      className={[
        "rounded-full border px-3 py-1 text-xs font-semibold",
        className,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function getMemberEventSupportLabel(event: {
  lumaStatusTone:
    | "linked"
    | "mock_linked"
    | "future_sync_disabled"
    | "none"
    | "not_linked";
  memberLumaLabel: string | null;
}) {
  if (!event.memberLumaLabel) {
    return null;
  }

  switch (event.lumaStatusTone) {
    case "mock_linked":
      return "Invite link ready";
    case "future_sync_disabled":
      return "Chapter invite";
    case "linked":
      return event.memberLumaLabel;
    case "none":
    case "not_linked":
      return null;
  }
}
