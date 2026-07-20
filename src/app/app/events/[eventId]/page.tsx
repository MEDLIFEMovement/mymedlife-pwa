import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock,
  MapPin,
  QrCode,
  Share2,
  Star,
  Users,
  UserCheck,
  X,
} from "lucide-react";

import {
  MemberBottomNav,
  type MemberBottomNavTab,
} from "@/components/member-bottom-nav";
import { ChromeDesktopPaintShell } from "@/components/chrome-desktop-paint-shell";
import type { MemberMobileIdentityContext } from "@/components/figma-member-mobile-home";
import { MemberOperationalDataUnavailable } from "@/components/member-operational-data-unavailable";
import { getLaunchLaneMemberPointsHref } from "@/services/events-points-launch-lane";
import { getLandingRouteForActor } from "@/services/landing-route";
import {
  buildLoginRedirectHrefForPath,
  shouldRedirectActorToLogin,
} from "@/services/login-route";
import { getLaunchLaneEventSnapshotById } from "@/services/launch-lane-event-snapshots";
import {
  buildMemberLaunchLaneEventDetailHref,
  getMemberLaunchLaneEventRowById,
} from "@/services/member-launch-lane-events";
import { resolveMemberEventRouteId } from "@/services/member-event-route-aliases";
import {
  mapMemberEventLoopWriteResultMessage,
  memberEventLoopPointAward,
  memberEventLoopWriteResultParam,
} from "@/services/member-event-loop-write";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getMemberRecognitionSummary } from "@/services/member-recognition";
import {
  buildMemberIdentityContext,
  getVisibleMemberLeaderboardRows,
} from "@/services/member-mobile-identity-context";
import { getMvpMemberHome } from "@/services/mvp-event-tracking-workspace";
import {
  getMockReadOnlyAppData,
  getReadOnlyAppData,
  type ReadOnlyAppData,
} from "@/services/read-only-app-data";
import { canAccessMemberWorkspace } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import {
  submitMemberEventCheckInAction,
  submitMemberEventCancelRsvpAction,
  submitMemberEventRsvpAction,
} from "./actions";

type AppEventDetailPageProps = {
  params: Promise<{
    eventId: string;
  }>;
  searchParams?: Promise<{
    source?: string;
    step?: string;
    profileSource?: string;
    campaign?: string;
    storyFilter?: string;
    story?: string;
    memberEventLoopWriteResult?: string;
  }>;
};

type EventDetailStep = "detail" | "rsvp" | "checkin" | "points";
type EventLoopResultState = ReturnType<typeof mapMemberEventLoopWriteResultMessage>;

export const metadata = getStaticRouteMetadata("rushMonthEventDetail");
export const dynamic = "force-dynamic";

export default async function AppEventDetailPage({
  params,
  searchParams,
}: AppEventDetailPageProps) {
  const emptySearchParams: {
    source?: string;
    step?: string;
    profileSource?: string;
    campaign?: string;
    storyFilter?: string;
    story?: string;
    memberEventLoopWriteResult?: string;
  } = {};
  const [{ eventId }, resolvedSearchParams, actor] = await Promise.all([
    params,
    searchParams ?? Promise.resolve(emptySearchParams),
    getLocalActorContext(),
  ]);
  if (shouldRedirectActorToLogin(actor)) {
    redirect(
      buildLoginRedirectHrefForPath(`/app/events/${eventId}`, resolvedSearchParams),
    );
  }

  if (!canAccessMemberWorkspace(actor)) {
    redirect(getLandingRouteForActor(actor));
  }

  const data = await getReadOnlyAppData({ actorUserId: actor.user.id });
  if (data.source.status === "chapter_access_missing") {
    return <MemberOperationalDataUnavailable actor={actor} message={data.source.message} />;
  }

  const resolvedEventData = getResolvedEventDetailData(actor, data, eventId);
  const { event, snapshot } = resolvedEventData;

  if (!event || !snapshot) {
    redirect("/app/events");
  }

  const studentHome = getMvpMemberHome(actor, data);
  const recognition = getMemberRecognitionSummary(actor, data);
  const memberContext = buildMemberIdentityContext(
    actor,
    studentHome,
    recognition,
    data.chapter.campus,
  );
  const step = getEventDetailStep(resolvedSearchParams.step);
  const repaintKey = buildRouteKey(`/app/events/${eventId}`, resolvedSearchParams);
  const resultState = mapMemberEventLoopWriteResultMessage(
    resolvedSearchParams.memberEventLoopWriteResult,
  );
  const backHref =
    step === "detail"
      ? getEventReturnHref(
          eventId,
          resolvedSearchParams.source,
          resolvedSearchParams.profileSource,
          resolvedSearchParams.campaign,
          resolvedSearchParams.storyFilter,
          resolvedSearchParams.story,
        )
      : step === "rsvp"
        ? buildEventStepHref(
            eventId,
            "detail",
            resolvedSearchParams.source,
            resolvedSearchParams.profileSource,
            resolvedSearchParams.campaign,
            resolvedSearchParams.storyFilter,
            resolvedSearchParams.story,
          )
        : step === "checkin"
          ? buildEventStepHref(
              eventId,
              "rsvp",
              resolvedSearchParams.source,
              resolvedSearchParams.profileSource,
              resolvedSearchParams.campaign,
              resolvedSearchParams.storyFilter,
              resolvedSearchParams.story,
            )
          : buildEventStepHref(
              eventId,
              "checkin",
              resolvedSearchParams.source,
              resolvedSearchParams.profileSource,
              resolvedSearchParams.campaign,
              resolvedSearchParams.storyFilter,
              resolvedSearchParams.story,
            );
  const activeTab = getEventDetailActiveTab(step);
  const navHrefOverrides = getEventDetailNavHrefOverrides(
    eventId,
    resolvedSearchParams.source,
    resolvedSearchParams.profileSource,
    resolvedSearchParams.campaign,
    resolvedSearchParams.storyFilter,
    resolvedSearchParams.story,
  );

  return (
    <main className="min-h-screen bg-[#d6e0f0] px-0 py-0 text-[#10223f] md:px-4 md:py-8">
      <ChromeDesktopPaintShell repaintKey={repaintKey} className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-white [backface-visibility:hidden] [transform:translateZ(0)] md:min-h-0 md:rounded-[44px] md:border-4 md:border-white/40 md:shadow-2xl">
        <div className="flex-1 overflow-y-auto pb-24">
          {step === "detail" ? (
            <EventDetailView
              event={event}
              memberContext={memberContext}
              snapshot={snapshot}
              source={resolvedSearchParams.source}
              profileSource={resolvedSearchParams.profileSource}
              campaign={resolvedSearchParams.campaign}
              storyFilter={resolvedSearchParams.storyFilter}
              storyId={resolvedSearchParams.story}
              resultState={resultState}
            />
          ) : step === "rsvp" ? (
            <EventRsvpConfirmView
              event={event}
              memberContext={memberContext}
              snapshot={snapshot}
              backHref={backHref}
              source={resolvedSearchParams.source}
              profileSource={resolvedSearchParams.profileSource}
              campaign={resolvedSearchParams.campaign}
              storyFilter={resolvedSearchParams.storyFilter}
              storyId={resolvedSearchParams.story}
              resultState={resultState}
            />
          ) : step === "checkin" ? (
            <EventCheckInView
              event={event}
              memberContext={memberContext}
              snapshot={snapshot}
              backHref={backHref}
              source={resolvedSearchParams.source}
              profileSource={resolvedSearchParams.profileSource}
              campaign={resolvedSearchParams.campaign}
              storyFilter={resolvedSearchParams.storyFilter}
              storyId={resolvedSearchParams.story}
              resultState={resultState}
            />
          ) : (
            <EventPointsImpactView
              event={event}
              memberContext={memberContext}
              snapshot={snapshot}
              backHref={backHref}
              source={resolvedSearchParams.source}
              profileSource={resolvedSearchParams.profileSource}
              campaign={resolvedSearchParams.campaign}
              storyFilter={resolvedSearchParams.storyFilter}
              storyId={resolvedSearchParams.story}
              resultState={resultState}
            />
          )}
        </div>
        <MemberBottomNav activeTab={activeTab} hrefOverrides={navHrefOverrides} />
      </ChromeDesktopPaintShell>
    </main>
  );
}

function buildRouteKey(
  pathname: string,
  params: {
    source?: string;
    step?: string;
    profileSource?: string;
    campaign?: string;
    storyFilter?: string;
    story?: string;
    memberEventLoopWriteResult?: string;
  },
) {
  const searchParams = new URLSearchParams();

  if (params.source) {
    searchParams.set("source", params.source);
  }

  if (params.step) {
    searchParams.set("step", params.step);
  }

  if (params.profileSource) {
    searchParams.set("profileSource", params.profileSource);
  }

  if (params.campaign) {
    searchParams.set("campaign", params.campaign);
  }

  if (params.storyFilter) {
    searchParams.set("storyFilter", params.storyFilter);
  }

  if (params.story) {
    searchParams.set("story", params.story);
  }

  if (params.memberEventLoopWriteResult) {
    searchParams.set(memberEventLoopWriteResultParam, params.memberEventLoopWriteResult);
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function getResolvedEventDetailData(
  actor: Awaited<ReturnType<typeof getLocalActorContext>>,
  data: ReadOnlyAppData,
  eventId: string,
) {
  const resolvedEventId = resolveMemberEventRouteId(data.chapterEventRows, eventId);
  const liveEvent = getMemberLaunchLaneEventRowById(actor, data, resolvedEventId);
  const liveSnapshot = getLaunchLaneEventSnapshotById(data, resolvedEventId);

  if (liveEvent && liveSnapshot) {
    return {
      event: liveEvent,
      snapshot: liveSnapshot,
    };
  }

  const mockData = getMockReadOnlyAppData(
    "Falling back to TEST event preview data because the signed-in readback does not contain this event id.",
  );

  return {
    event: getMemberLaunchLaneEventRowById(actor, mockData, eventId),
    snapshot: getLaunchLaneEventSnapshotById(mockData, eventId),
  };
}

function ensureVisibleTestLabel(value: string) {
  return /\bTEST\b/.test(value) ? value : `TEST ${value}`;
}

function EventDetailView({
  event,
  memberContext,
  snapshot,
  source,
  profileSource,
  campaign,
  storyFilter,
  storyId,
  resultState,
}: Readonly<{
  event: NonNullable<ReturnType<typeof getMemberLaunchLaneEventRowById>>;
  memberContext: MemberMobileIdentityContext;
  snapshot: NonNullable<ReturnType<typeof getLaunchLaneEventSnapshotById>>;
  source?: string;
  profileSource?: string;
  campaign?: string;
  storyFilter?: string;
  storyId?: string;
  resultState: EventLoopResultState;
}>) {
  const detailHref = buildEventStepHref(event.id, "detail", source, profileSource, campaign, storyFilter, storyId);
  const rsvpHref = buildEventStepHref(event.id, "rsvp", source, profileSource, campaign, storyFilter, storyId);
  const checkInHref = buildEventStepHref(event.id, "checkin", source, profileSource, campaign, storyFilter, storyId);
  const pointsHref = buildEventStepHref(event.id, "points", source, profileSource, campaign, storyFilter, storyId);
  const returnHref = getEventReturnHref(event.id, source, profileSource, campaign, storyFilter, storyId);
  const returnLabel = getEventReturnLabel(source);
  const sourceContext = getEventSourceContext(event.id, source, profileSource, campaign, storyFilter, storyId);
  const visibleEventTitle = ensureVisibleTestLabel(event.title);
  const visibleChapterName = memberContext.chapterName;
  const visibleLocationLabel = ensureVisibleTestLabel(snapshot.memberLocationLabel);
  const pointsAvailable = event.memberActionsClosed
    ? event.pointsAwarded
    : memberEventLoopPointAward;
  let eventStatusLabel = event.memberRsvpState === "registered" ? "RSVP'd" : "RSVP Open";
  let eventStatusVariant: "green" | "gray" = "green";
  let primaryAction: ReactNode;

  if (event.memberActionsClosed) {
    eventStatusLabel = event.memberLifecycleLabel ?? "Event closed";
    eventStatusVariant = "gray";
    primaryAction = <ClosedEventActionNotice label={event.memberLifecycleLabel} />;
  } else if (event.memberRsvpState === "registered") {
    primaryAction = (
      <div className="space-y-3 rounded-2xl border border-emerald-300/40 bg-emerald-400/20 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400">
            <CheckCircle2 size={20} className="text-white" />
          </div>
          <div>
            <p className="text-base font-extrabold text-white">You&apos;re RSVP&apos;d!</p>
            <p className="mt-0.5 text-sm text-emerald-200">
              Check in at the chapter table to preview your points impact.
            </p>
          </div>
        </div>
        <RsvpCancelControl
          event={event}
          source={source ?? "events"}
          profileSource={profileSource}
          campaign={campaign}
          storyFilter={storyFilter}
          storyId={storyId}
          variant="hero"
        />
      </div>
    );
  } else {
    primaryAction = (
      <EventLoopActionForm
        action={submitMemberEventRsvpAction}
        eventId={event.id}
        source={source ?? "events"}
        profileSource={profileSource}
        campaign={campaign}
        storyFilter={storyFilter}
        storyId={storyId}
        label="RSVP to Event"
        icon={<CheckCircle2 size={20} />}
        className="bg-[#f5a623] text-lg text-[#10223f] shadow-lg hover:opacity-90"
      />
    );
  }

  return (
    <div className="pb-10">
      <div className="bg-gradient-to-br from-[#1b4b8e] to-[#2563eb] px-5 pb-8 pt-12">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={returnHref}
            className="rounded-full bg-white/15 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
            aria-label={returnLabel}
          >
            <ChevronLeft size={18} />
          </Link>
          <p className="text-sm font-bold uppercase tracking-widest text-white">
            Event RSVP
          </p>
          <button
            type="button"
            disabled
            title="Event sharing is blocked in this preview until Luma sharing is approved"
            className="rounded-full bg-white/15 p-2.5 text-white backdrop-blur-sm"
          >
            <Share2 size={16} />
          </button>
        </div>

        <div className="mb-6 flex items-start gap-4">
          <div className="rounded-2xl bg-white/20 p-3.5">
            <CalendarDays size={28} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <Pill
                label={eventStatusLabel}
                variant={eventStatusVariant}
              />
              <Pill label={visibleChapterName} variant="blue" />
            </div>
            <h1 className="text-2xl font-extrabold leading-snug text-white">{visibleEventTitle}</h1>
            <p className="mt-1 text-sm text-blue-200">
              {visibleChapterName} · {event.memberDateTimeLabel}
            </p>
          </div>
        </div>

        {primaryAction}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <QuickStat label="RSVPs" value={String(event.rsvpCount)} />
          <QuickStat label="Points" value={String(pointsAvailable)} />
          <QuickStat label="Duration" value={getDurationLabel(snapshot.startsAt, snapshot.endsAt)} />
        </div>
      </div>

      <div className="space-y-4 px-4 pt-5">
        <EventLoopResultBanner resultState={resultState} />

        {sourceContext ? (
          <Card className="border-[#bfdbfe] bg-[#eff6ff]">
            <p className="text-xs font-bold uppercase tracking-wide text-[#1b4b8e]">
              {sourceContext.eyebrow}
            </p>
            <h2 className="mt-2 text-lg font-extrabold text-slate-950">
              {sourceContext.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {sourceContext.body}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={sourceContext.href}
                className="rounded-xl border border-[#bfdbfe] bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {sourceContext.cta}
              </Link>
            </div>
          </Card>
        ) : null}

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-950">Who&apos;s going</span>
            <span className="text-sm font-extrabold text-[#1b4b8e]">{event.rsvpCount} RSVPs</span>
          </div>
          <div className="mb-4 flex -space-x-2">
            {["MR", "JT", "AL", "SC", "DK", "PW"].map((initials, index) => (
              <AvatarPill key={initials} initials={initials} index={index} />
            ))}
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#eff6ff] text-[10px] font-bold text-[#1b4b8e]">
              +{Math.max(event.rsvpCount - 6, 0)}
            </div>
          </div>
          <div className="flex gap-2 border-t border-slate-200 pt-3">
            <button
              type="button"
              disabled
              title="Calendar export is blocked in this preview"
              className="flex-1 rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-800"
            >
              <span className="flex items-center justify-center gap-1.5">
                <CalendarDays size={15} className="text-[#1b4b8e]" /> Add to Calendar
              </span>
            </button>
            <button
              type="button"
              disabled
              title="Event sharing is blocked in this preview until Luma sharing is approved"
              className="flex-1 rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-800"
            >
              <span className="flex items-center justify-center gap-1.5">
                <Share2 size={15} className="text-[#1b4b8e]" /> Share
              </span>
            </button>
          </div>
        </Card>

        <Card>
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#1b4b8e]">
            Event Details
          </p>
          <div className="space-y-2.5 text-sm text-slate-600">
            <DetailRow icon={<CalendarDays size={15} className="text-[#1b4b8e]" />}>
              {snapshot.memberDateTimeLabel}
            </DetailRow>
            <DetailRow icon={<MapPin size={15} className="text-[#1b4b8e]" />}>
              {visibleLocationLabel}
            </DetailRow>
            <DetailRow icon={<Users size={15} className="text-[#1b4b8e]" />}>
              Organized by <span className="font-semibold text-[#1b4b8e]">Chapter leadership</span>
            </DetailRow>
          </div>
        </Card>

        <Card>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#1b4b8e]">
            About this event
          </p>
          <p className="text-sm leading-relaxed text-slate-600">
            {snapshot.promotionSummary ??
              "This chapter event is part of the launch-lane RSVP, attendance, and points loop."}
          </p>
        </Card>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Star size={18} className="fill-amber-400 text-amber-500" />
            <p className="text-sm font-bold text-slate-950">Points Available</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <PointsCard
              label="Attendance"
              value={String(pointsAvailable)}
              detail={event.memberActionsClosed ? "currently recorded" : "check-in required"}
            />
            <PointsCard
              label="Luma"
              value={event.memberLumaLabel ? "Linked" : "Off"}
              detail={event.memberLumaLabel ? "preview link only" : "future sync disabled"}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#1b4b8e]">
            Production-safe event loop
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {event.memberActionsClosed
              ? "This event is closed. The route remains available for readback, but member RSVP, check-in, attendance, and points writes cannot run."
              : "RSVP, check-in, attendance, and points can be recorded as internal myMEDLIFE TEST rows when the approved event-loop write gate is enabled. Luma and external provider writes stay off."}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            If the write gate is off, the app will show a blocked state and keep the page read-only
            instead of pretending the event was saved.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={detailHref} className="rounded-full border border-[#bfdbfe] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              Detail
            </Link>
            {!event.memberActionsClosed ? (
              <>
                <Link href={rsvpHref} className="rounded-full border border-[#bfdbfe] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                  RSVP
                </Link>
                <Link href={checkInHref} className="rounded-full border border-[#bfdbfe] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                  Check-In
                </Link>
              </>
            ) : null}
            <Link href={pointsHref} className="rounded-full border border-[#bfdbfe] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              Points
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventRsvpConfirmView({
  event,
  memberContext,
  snapshot,
  backHref,
  source,
  profileSource,
  campaign,
  storyFilter,
  storyId,
  resultState,
}: Readonly<{
  event: NonNullable<ReturnType<typeof getMemberLaunchLaneEventRowById>>;
  memberContext: MemberMobileIdentityContext;
  snapshot: NonNullable<ReturnType<typeof getLaunchLaneEventSnapshotById>>;
  backHref: string;
  source?: string;
  profileSource?: string;
  campaign?: string;
  storyFilter?: string;
  storyId?: string;
  resultState: EventLoopResultState;
}>) {
  const visibleLocationLabel = ensureVisibleTestLabel(snapshot.memberLocationLabel);
  const returnHref = getEventReturnHref(event.id, source, profileSource, campaign, storyFilter, storyId);
  const returnLabel = getEventReturnLabel(source);
  const rsvpConfirmed =
    event.memberRsvpState === "registered" ||
    resultState?.code === "rsvp_recorded" ||
    resultState?.code === "already_rsvpd";
  let rsvpHeading = rsvpConfirmed ? "You're RSVP'd!" : "Record your RSVP";
  let rsvpDescription = rsvpConfirmed
    ? "We'll see you there. Don't forget to check in when you arrive to record your points impact."
    : "Save your TEST RSVP in myMEDLIFE, then check in when you arrive to record attendance and points.";
  let rsvpPointsDetail =
    "RSVP can be recorded in myMEDLIFE when the approved internal write gate is enabled. Luma and external provider writes stay off.";
  let rsvpSafetyDetail =
    "This production-safe TEST flow records only internal myMEDLIFE rows after the write gate is approved. It does not write to Luma or any external provider.";
  let rsvpPointsLabel = "Attend and check in to earn";
  let rsvpPointsValue = memberEventLoopPointAward;
  let rsvpAction: ReactNode;

  if (event.memberActionsClosed) {
    rsvpHeading = event.memberLifecycleLabel ?? "Event closed";
    rsvpDescription = "Member RSVP and check-in are closed for this event.";
    rsvpPointsDetail = "This event is closed. No member RSVP, attendance, or points write can run.";
    rsvpSafetyDetail =
      "This route is read-only. No myMEDLIFE, Luma, notification, or external provider write can run from the closed event.";
    rsvpPointsLabel = "Points currently recorded";
    rsvpPointsValue = event.pointsAwarded;
    rsvpAction = <ClosedEventActionNotice label={event.memberLifecycleLabel} />;
  } else if (rsvpConfirmed) {
    rsvpAction = (
      <RsvpCancelControl
        event={event}
        source={source ?? "events"}
        profileSource={profileSource}
        campaign={campaign}
        storyFilter={storyFilter}
        storyId={storyId}
        variant="step"
      />
    );
  } else {
    rsvpAction = (
      <EventLoopActionForm
        action={submitMemberEventRsvpAction}
        eventId={event.id}
        source={source ?? "events"}
        profileSource={profileSource}
        campaign={campaign}
        storyFilter={storyFilter}
        storyId={storyId}
        label="Record RSVP in myMEDLIFE"
        icon={<CheckCircle2 size={16} />}
        className="bg-[#1b4b8e] text-base text-white hover:opacity-90"
      />
    );
  }
  return (
    <StepShell backHref={backHref} title="">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 size={40} className="text-emerald-600" />
        </div>
        <h1 className="mb-2 text-2xl font-extrabold text-slate-950">
          {rsvpHeading}
        </h1>
        <p className="mb-8 max-w-xs text-sm leading-relaxed text-slate-600">
          {rsvpDescription}
        </p>

        <Card className="mb-4 w-full text-left">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#1b4b8e]">Event Summary</p>
          <div className="space-y-2 text-sm text-slate-600">
            <DetailRow icon={<Users size={14} className="text-[#1b4b8e]" />}>
              {memberContext.chapterName}
            </DetailRow>
            <DetailRow icon={<CalendarDays size={14} className="text-[#1b4b8e]" />}>
              {snapshot.memberDateTimeLabel}
            </DetailRow>
            <DetailRow icon={<MapPin size={14} className="text-[#1b4b8e]" />}>
              {visibleLocationLabel}
            </DetailRow>
          </div>
        </Card>

        <div className="mb-5 w-full rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-1 flex items-center gap-2">
            <Star size={18} className="fill-amber-400 text-amber-500" />
            <span className="text-sm font-bold text-slate-950">{rsvpPointsLabel}</span>
          </div>
          <p className="ml-7 text-3xl font-extrabold text-amber-600">{rsvpPointsValue} points</p>
          <p className="ml-7 mt-1 text-xs text-amber-700">
            {rsvpPointsDetail}
          </p>
        </div>

        <EventLoopResultBanner resultState={resultState} className="mb-5 w-full text-left" />

        <div className="mb-8 flex w-full items-start gap-2 rounded-2xl bg-[#eef2ff] p-3">
          <QrCode size={18} className="mt-0.5 flex-shrink-0 text-[#1b4b8e]" />
          <p className="text-left text-sm font-medium text-[#1b4b8e]">
            {rsvpSafetyDetail}
          </p>
        </div>

        <div className="w-full space-y-2.5">
          {rsvpAction}
          {!event.memberActionsClosed ? (
            <PrimaryLink
              href={buildEventStepHref(event.id, "checkin", source, profileSource, campaign, storyFilter, storyId)}
              label="Go to Check-In"
              icon={<QrCode size={16} />}
            />
          ) : null}
          <SecondaryLink href={returnHref} label={returnLabel} />
        </div>
      </div>
    </StepShell>
  );
}

function EventCheckInView({
  event,
  memberContext,
  snapshot,
  backHref,
  source,
  profileSource,
  campaign,
  storyFilter,
  storyId,
  resultState,
}: Readonly<{
  event: NonNullable<ReturnType<typeof getMemberLaunchLaneEventRowById>>;
  memberContext: MemberMobileIdentityContext;
  snapshot: NonNullable<ReturnType<typeof getLaunchLaneEventSnapshotById>>;
  backHref: string;
  source?: string;
  profileSource?: string;
  campaign?: string;
  storyFilter?: string;
  storyId?: string;
  resultState: EventLoopResultState;
}>) {
  const visibleEventTitle = ensureVisibleTestLabel(event.title);
  const hasActiveRsvp = event.memberRsvpState === "registered";
  let checkInStatusLabel = hasActiveRsvp ? "RSVP'd" : "RSVP not active";
  let checkInStatusVariant: "green" | "gray" = hasActiveRsvp ? "green" : "gray";
  let checkInMessage = "Your RSVP is not active. Walk-in check-in can still record attendance and points in myMEDLIFE.";
  let checkInPointsLabel = `${memberEventLoopPointAward} points after check-in`;
  let checkInAction: ReactNode = <ClosedEventActionNotice label={event.memberLifecycleLabel} />;

  if (event.memberActionsClosed) {
    checkInStatusLabel = event.memberLifecycleLabel ?? "Event closed";
    checkInStatusVariant = "gray";
    checkInMessage = "Member check-in is closed for this completed or canceled event.";
    checkInPointsLabel = `${event.pointsAwarded} points currently recorded for this event`;
  } else {
    if (hasActiveRsvp) {
      checkInMessage = "Confirm the TEST check-in to record attendance and award points once in myMEDLIFE.";
    }
    checkInAction = (
      <EventLoopActionForm
        action={submitMemberEventCheckInAction}
        eventId={event.id}
        source={source ?? "events"}
        profileSource={profileSource}
        campaign={campaign}
        storyFilter={storyFilter}
        storyId={storyId}
        label="Confirm Check-In"
        icon={<UserCheck size={20} />}
        className="bg-[#1b4b8e] text-base text-white hover:opacity-90"
      />
    );
  }
  return (
    <StepShell backHref={backHref} title="Check In">
      <div className="flex flex-1 flex-col px-4 py-6">
        <Card className="mb-6 border-[#dbeafe] bg-[#eff6ff]">
          <div className="mb-2 flex items-center gap-2">
            <Pill
              label={checkInStatusLabel}
              variant={checkInStatusVariant}
            />
            <Pill label={memberContext.chapterName} variant="blue" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-950">{visibleEventTitle}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
            <Clock size={13} />
            {snapshot.memberDateTimeLabel}
          </p>
        </Card>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          {event.memberActionsClosed ? (
            <div className="mb-5 flex h-[188px] w-[188px] flex-col items-center justify-center rounded-2xl border border-slate-300 bg-slate-100 p-6 text-slate-700">
              <Clock size={36} />
              <p className="mt-3 text-base font-bold">Check-in closed</p>
            </div>
          ) : (
            <>
              <div className="mb-5 flex items-center gap-1.5 rounded-full bg-[#1b4b8e] px-3 py-1.5 text-xs font-bold text-white">
                <QrCode size={13} /> Preview event QR code
              </div>
              <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid h-[188px] w-[188px] place-items-center rounded-xl bg-[linear-gradient(135deg,#10223f_25%,transparent_25%),linear-gradient(225deg,#10223f_25%,transparent_25%),linear-gradient(45deg,#10223f_25%,transparent_25%),linear-gradient(315deg,#10223f_25%,#fff_25%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0px]">
                  <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-700">
                    Preview only
                  </div>
                </div>
              </div>
            </>
          )}
          <p className="mb-1.5 text-sm text-slate-600">
            {checkInMessage}
          </p>
          <div className="mb-6 flex items-center gap-1.5 text-sm font-bold text-amber-600">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            {checkInPointsLabel}
          </div>
        </div>

        <EventLoopResultBanner resultState={resultState} className="mb-4" />

        {checkInAction}
      </div>
    </StepShell>
  );
}

function EventPointsImpactView({
  event,
  memberContext,
  snapshot,
  backHref,
  source,
  profileSource,
  campaign,
  storyFilter,
  storyId,
  resultState,
}: {
  event: NonNullable<ReturnType<typeof getMemberLaunchLaneEventRowById>>;
  memberContext: MemberMobileIdentityContext;
  snapshot: NonNullable<ReturnType<typeof getLaunchLaneEventSnapshotById>>;
  backHref: string;
  source?: string;
  profileSource?: string;
  campaign?: string;
  storyFilter?: string;
  storyId?: string;
  resultState: EventLoopResultState;
}) {
  const visibleChapterName = memberContext.chapterName;
  const returnHref = getEventReturnHref(event.id, source, profileSource, campaign, storyFilter, storyId);
  const returnLabel = getEventReturnLabel(source);
  const checkInConfirmed =
    event.memberPointsAwarded > 0 ||
    resultState?.code === "checked_in" ||
    resultState?.code === "already_checked_in";
  const pointsDelta = checkInConfirmed
    ? Math.max(event.memberPointsAwarded, memberEventLoopPointAward)
    : 0;
  const chapterRows = getVisibleMemberLeaderboardRows(memberContext, 3).map((row) => ({
    rank: formatLeaderboardRank(row.rank),
    name: row.me ? `You (${row.name})` : row.name,
    points: row.me && event.memberPointsAwarded > 0 ? event.memberPointsAwarded : row.pts,
    highlight: Boolean(row.me),
  }));

  return (
    <StepShell backHref={backHref} title="">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 text-center">
        <div className={`mb-6 flex h-24 w-24 items-center justify-center rounded-full ${checkInConfirmed ? "bg-emerald-100" : "bg-amber-100"}`}>
          {checkInConfirmed ? (
            <CheckCircle2 size={48} className="text-emerald-600" />
          ) : (
            <Clock size={48} className="text-amber-700" />
          )}
        </div>
        <h1 className="mb-1 text-2xl font-extrabold text-slate-950">
          {checkInConfirmed ? "Checked in!" : "Check-in not recorded"}
        </h1>
        <p className="mt-2 mb-1 text-4xl font-extrabold text-amber-500">+{pointsDelta} points</p>
        <p className="mb-8 text-sm text-slate-600">
          {checkInConfirmed
            ? `Internal myMEDLIFE readback for ${visibleChapterName} after ${snapshot.memberDateTimeLabel}.`
            : `No member attendance or points completion is shown for ${visibleChapterName} until the write succeeds and durable readback confirms it.`}
        </p>

        <Card className="mb-6 w-full border-[#dbeafe] bg-[#eff6ff] text-left">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#1b4b8e]">
            Chapter Leaderboard
          </p>
          {chapterRows.map((row) => (
            <div
              key={row.name}
              className={[
                "flex items-center gap-3 border-b border-slate-200 py-2 last:border-0",
                row.highlight ? "font-bold text-[#1b4b8e]" : "",
              ].join(" ")}
            >
              <span className="w-5 text-center text-sm">{row.rank}</span>
              <span className="flex-1 text-sm">{row.name}</span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                {row.points} pts
              </span>
            </div>
          ))}
        </Card>

        <EventLoopResultBanner resultState={resultState} className="mb-4 w-full text-left" />

        <div className="w-full rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] p-4 text-left">
          <p className="text-xs font-bold uppercase tracking-wide text-[#1b4b8e]">
            Write honesty
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {checkInConfirmed
              ? "This route reflects confirmed internal TEST event-loop readback. Duplicate check-ins are blocked from awarding duplicate points, and Luma/external provider writes remain off."
              : "This route does not claim completion when the internal write is blocked or fails. No attendance, points, Luma, or external provider success is implied."}
          </p>
        </div>

        <div className="mt-6 w-full space-y-2.5">
          <PrimaryLink
            href={getLaunchLaneEventPointsHref(event.id, source, campaign, storyFilter, storyId)}
            label="View leaderboard impact"
            icon={<Star size={15} />}
          />
          <SecondaryLink href={returnHref} label={returnLabel} />
        </div>
      </div>
    </StepShell>
  );
}

function RsvpCancelControl({
  event,
  source,
  profileSource,
  campaign,
  storyFilter,
  storyId,
  variant,
}: Readonly<{
  event: NonNullable<ReturnType<typeof getMemberLaunchLaneEventRowById>>;
  source?: string;
  profileSource?: string;
  campaign?: string;
  storyFilter?: string;
  storyId?: string;
  variant: "hero" | "step";
}>) {
  if (!event.memberCanCancelRsvp) {
    return (
      <div
        className={[
          "rounded-2xl border px-4 py-3 text-sm font-semibold leading-6",
          variant === "hero"
            ? "border-white/20 bg-white/10 text-emerald-50"
            : "border-amber-200 bg-amber-50 text-amber-900",
        ].join(" ")}
      >
        {event.memberRsvpLockLabel ?? "RSVP cancellation is locked after check-in."}
      </div>
    );
  }

  return (
    <EventLoopActionForm
      action={submitMemberEventCancelRsvpAction}
      eventId={event.id}
      source={source ?? "events"}
      profileSource={profileSource}
      campaign={campaign}
      storyFilter={storyFilter}
      storyId={storyId}
      label="Cancel RSVP"
      icon={<X size={16} />}
      className={
        variant === "hero"
          ? "border border-white/30 bg-white/15 text-sm text-white hover:bg-white/25"
          : "border border-slate-300 bg-white text-base text-slate-800 hover:bg-slate-50"
      }
    />
  );
}

function formatLeaderboardRank(rank: number) {
  switch (rank) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    default:
      return String(rank);
  }
}

function StepShell({
  backHref,
  title,
  children,
}: {
  backHref: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col pb-10">
      <div className="flex items-center justify-between px-4 pt-6">
        <Link
          href={backHref}
          className="rounded-full bg-slate-100 p-2.5 text-slate-700 transition hover:bg-slate-200"
          aria-label="Back"
        >
          <ChevronLeft size={18} />
        </Link>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <div className="h-10 w-10" aria-hidden="true" />
      </div>
      {children}
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-2 py-2.5 text-center">
      <p className="text-lg font-extrabold leading-none text-white">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold text-blue-200">{label}</p>
    </div>
  );
}

function AvatarPill({ initials, index }: { initials: string; index: number }) {
  const colors = [
    "bg-teal-500",
    "bg-blue-500",
    "bg-violet-500",
    "bg-emerald-500",
    "bg-orange-400",
    "bg-pink-500",
  ];

  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white ${colors[index]}`}
    >
      {initials}
    </div>
  );
}

function DetailRow({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {icon}
      <span>{children}</span>
    </div>
  );
}

function PointsCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-amber-100 bg-white p-3 text-center">
      <p className="mb-0.5 text-xs font-semibold text-amber-700">{label}</p>
      <p className="text-2xl font-extrabold text-slate-950">{value}</p>
      <p className="text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function ClosedEventActionNotice({ label }: Readonly<{ label: string | null }>) {
  return (
    <div className="w-full rounded-2xl border border-slate-300 bg-slate-100 p-4 text-left text-slate-800">
      <div className="flex items-center gap-2">
        <Clock size={17} className="text-slate-600" />
        <p className="text-sm font-bold">{label ?? "Event closed"}</p>
      </div>
      <p className="mt-2 text-sm leading-6">
        Member RSVP, cancellation, and check-in are closed. No attendance or points write can run from this event.
      </p>
    </div>
  );
}

function EventLoopResultBanner({
  resultState,
  className = "",
}: Readonly<{
  resultState: EventLoopResultState;
  className?: string;
}>) {
  if (!resultState) {
    return null;
  }

  const classesByTone = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    info: "border-[#bfdbfe] bg-[#eff6ff] text-[#1b4b8e]",
  } satisfies Record<NonNullable<EventLoopResultState>["tone"], string>;
  const classes = classesByTone[resultState.tone];

  return (
    <output className={`block rounded-2xl border p-4 text-sm font-semibold leading-6 ${classes} ${className}`}>
      {resultState.message}
    </output>
  );
}

function EventLoopActionForm({
  action,
  eventId,
  source,
  profileSource,
  campaign,
  storyFilter,
  storyId,
  label,
  icon,
  className,
}: Readonly<{
  action: (formData: FormData) => Promise<void>;
  eventId: string;
  source?: string;
  profileSource?: string;
  campaign?: string;
  storyFilter?: string;
  storyId?: string;
  label: string;
  icon?: ReactNode;
  className: string;
}>) {
  return (
    <form action={action} className="w-full">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="source" value={source ?? ""} />
      <input type="hidden" name="profileSource" value={profileSource ?? ""} />
      <input type="hidden" name="campaign" value={campaign ?? ""} />
      <input type="hidden" name="storyFilter" value={storyFilter ?? ""} />
      <input type="hidden" name="story" value={storyId ?? ""} />
      <button
        type="submit"
        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 font-extrabold transition ${className}`}
      >
        {icon}
        {label}
      </button>
    </form>
  );
}

function PrimaryLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1b4b8e] px-4 py-4 text-base font-bold text-white transition hover:opacity-90"
    >
      {icon}
      {label}
    </Link>
  );
}

function SecondaryLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex w-full items-center justify-center rounded-2xl bg-slate-100 px-4 py-4 text-base font-semibold text-slate-800 transition hover:bg-slate-200"
    >
      {label}
    </Link>
  );
}

function Pill({
  label,
  variant,
}: {
  label: string;
  variant: "green" | "blue" | "gray";
}) {
  const classesByVariant = {
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    gray: "bg-slate-100 text-slate-700",
  } satisfies Record<"green" | "blue" | "gray", string>;
  const classes = classesByVariant[variant];

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes}`}>
      {label}
    </span>
  );
}

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`rounded-2xl border border-slate-200 bg-white p-4 ${className}`}>{children}</div>;
}

function getEventDetailActiveTab(step: EventDetailStep): MemberBottomNavTab {
  return step === "points" ? "points" : "events";
}

function getEventDetailNavHrefOverrides(
  eventId: string,
  source?: string,
  profileSource?: string,
  campaign?: string,
  storyFilter?: string,
  storyId?: string,
): Partial<Record<MemberBottomNavTab, string>> {
  const overrides: Partial<Record<MemberBottomNavTab, string>> = {
    events:
      source === "profile"
        ? buildEventsListHref("profile", campaign, profileSource)
        : source === "points"
          ? buildEventsListHref("points", campaign)
          : source === "stories"
            ? buildEventsListHref("stories", campaign, undefined, storyFilter)
          : source === "home"
            ? buildEventsListHref("home", campaign)
            : buildEventsListHref("events", campaign),
    points: getLaunchLaneEventPointsHref(eventId, source, campaign, storyFilter, storyId),
  };

  if (source === "home") {
    overrides.profile = buildProfileReturnHref(eventId, "home", campaign);
  } else if (source === "events") {
    overrides.profile = buildProfileReturnHref(eventId, "events", campaign);
  } else if (source === "points") {
    overrides.profile = buildProfileReturnHref(eventId, "points", campaign);
  } else if (source === "profile") {
    overrides.profile =
      profileSource === "points"
        ? buildProfileReturnHref(eventId, "points", campaign)
        : buildProfileReturnHref(null, null, campaign);
  } else if (source === "stories") {
    overrides.profile = buildProfileReturnHref(eventId, "stories", campaign, storyFilter, storyId);
  }

  return overrides;
}

function getEventDetailStep(step: string | undefined): EventDetailStep {
  if (step === "rsvp" || step === "checkin" || step === "points") {
    return step;
  }

  return "detail";
}

function buildEventStepHref(
  eventId: string,
  step: EventDetailStep,
  source?: string,
  profileSource?: string,
  campaign?: string,
  storyFilter?: string,
  storyId?: string,
) {
  const baseHref = buildMemberLaunchLaneEventDetailHref(eventId, "events");
  const url = new URL(`https://mymedlife.local${baseHref}`);
  const normalizedCampaign = normalizeCampaign(campaign);

  if (source) {
    url.searchParams.set("source", source);
  }

  if (step !== "detail") {
    url.searchParams.set("step", step);
  }

  if (source === "profile" && profileSource === "points") {
    url.searchParams.set("profileSource", "points");
  }

  if (source === "stories" && storyFilter) {
    url.searchParams.set("storyFilter", storyFilter);
  }

  if (source === "stories" && storyId) {
    url.searchParams.set("story", storyId);
  }

  if (normalizedCampaign) {
    url.searchParams.set("campaign", normalizedCampaign);
  }

  return `${url.pathname}${url.search}`;
}

function getEventReturnHref(
  eventId: string,
  source?: string,
  profileSource?: string,
  campaign?: string,
  storyFilter?: string,
  storyId?: string,
) {
  return source === "home"
    ? "/app"
    : source === "profile"
      ? profileSource === "points"
        ? buildProfileReturnHref(eventId, "points", campaign)
        : buildProfileReturnHref(null, null, campaign)
      : source === "stories"
        ? buildStoriesReturnHref(storyFilter, storyId)
        : source === "points"
        ? getLaunchLaneEventPointsHref(eventId, source, campaign, storyFilter, storyId)
        : buildEventsListHref("events", campaign);
}

function getEventReturnLabel(source?: string) {
  return source === "home"
    ? "Back to Home"
    : source === "profile"
      ? "Back to Profile"
      : source === "stories"
        ? "Back to Stories"
      : source === "points"
        ? "Back to Points"
        : "Back to Events";
}

function getEventPointsSource(source?: string) {
  return source === "home" || source === "profile" || source === "stories" ? source : "events";
}

function getEventSourceContext(
  eventId: string,
  source?: string,
  profileSource?: string,
  campaign?: string,
  storyFilter?: string,
  storyId?: string,
) {
  if (source === "home") {
    return {
      eyebrow: "Opened from the TEST home walkthrough",
      title: "Keep home, events, and points in one member loop.",
      body:
        "Home sent you into this TEST event detail so you can preview RSVP, check-in, and the next points move without leaving the student shell.",
      href: "/app",
      cta: "Back to Home",
    };
  }

  if (source === "profile") {
    return {
      eyebrow: "Opened from your TEST profile",
      title: "Keep profile, events, and points in one member loop.",
      body:
        "Your TEST profile sent you here so the next chapter moment stays route-backed. Open the event flow, preview RSVP or attendance, then step back into points when you are ready.",
      href:
        profileSource === "points"
          ? buildProfileReturnHref(eventId, "points", campaign)
          : buildProfileReturnHref(null, null, campaign),
      cta: "Back to Profile",
    };
  }

  if (source === "stories") {
    return {
      eyebrow: "Opened from the TEST stories feed",
      title: "Keep stories, events, and points in one member loop.",
      body:
        "Your TEST stories feed sent you into this event detail so you can preview RSVP, attendance, and points impact without losing the mobile feed context.",
      href: buildStoriesReturnHref(storyFilter, storyId),
      cta: "Back to Stories",
    };
  }

  if (source === "points") {
    return {
      eyebrow: "Opened from Points & Recognition",
      title: "Move from TEST points readback into the next event.",
      body:
        "The member loop should not stop at the leaderboard. Use this route-backed return path to preview RSVP or attendance here, then come back to points when the chapter moment is done.",
      href: getLaunchLaneEventPointsHref(eventId, source, campaign, storyFilter, storyId),
      cta: "Back to Points",
    };
  }

  return null;
}

function getLaunchLaneEventPointsHref(
  eventId: string,
  source?: string,
  campaign?: string,
  storyFilter?: string,
  storyId?: string,
) {
  const baseHref =
    source === "stories"
      ? "/app/points?source=stories"
      : getLaunchLaneMemberPointsHref(getEventPointsSource(source));
  const url = new URL(`https://mymedlife.local${baseHref}`);
  const normalizedCampaign = normalizeCampaign(campaign);

  if (
    source === "events" ||
    source === "home" ||
    source === "profile" ||
    source === "points" ||
    source === "stories"
  ) {
    url.searchParams.set("event", eventId);
  }

  if (source === "stories" && storyFilter) {
    url.searchParams.set("storyFilter", storyFilter);
  }

  if (source === "stories" && storyId) {
    url.searchParams.set("story", storyId);
  }

  if (normalizedCampaign) {
    url.searchParams.set("campaign", normalizedCampaign);
  }

  return `${url.pathname}${url.search}`;
}

function buildProfileReturnHref(
  eventId: string | null,
  source: "events" | "home" | "points" | "stories" | null,
  campaign?: string,
  storyFilter?: string,
  storyId?: string,
) {
  const url = new URL(
    `https://mymedlife.local${
      source === "home"
        ? "/profile?source=home"
        : source === "events"
          ? "/profile?source=events"
        : source === "points"
          ? "/profile?source=points"
        : source === "stories"
          ? "/profile?source=stories"
      : "/profile"
    }`,
  );
  const normalizedCampaign = normalizeCampaign(campaign);

  if (eventId) {
    url.searchParams.set("event", eventId);
  }

  if (normalizedCampaign) {
    url.searchParams.set("campaign", normalizedCampaign);
  }

  if (source === "stories" && storyFilter) {
    url.searchParams.set("storyFilter", storyFilter);
  }

  if (source === "stories" && storyId) {
    url.searchParams.set("story", storyId);
  }

  return `${url.pathname}${url.search}`;
}

function buildEventsListHref(
  source: "events" | "home" | "profile" | "points" | "stories",
  campaign?: string,
  profileSource?: string,
  storyFilter?: string,
) {
  const url = new URL(`https://mymedlife.local/app/events`);
  const normalizedCampaign = normalizeCampaign(campaign);

  if (source !== "events") {
    url.searchParams.set("source", source);
  }

  if (source === "profile" && profileSource === "points") {
    url.searchParams.set("profileSource", "points");
  }

  if (source === "stories" && storyFilter) {
    url.searchParams.set("storyFilter", storyFilter);
  }

  if (normalizedCampaign) {
    url.searchParams.set("campaign", normalizedCampaign);
  }

  return `${url.pathname}${url.search}`;
}

function buildStoriesReturnHref(storyFilter?: string, storyId?: string) {
  const url = new URL("https://mymedlife.local/app/stories");

  if (storyFilter) {
    url.searchParams.set("filter", storyFilter);
  }

  if (storyId) {
    url.searchParams.set("story", storyId);
  }

  return `${url.pathname}${url.search}`;
}

function normalizeCampaign(campaign?: string) {
  return campaign && campaign !== "All" ? campaign : undefined;
}

function getDurationLabel(startsAt: string | null, endsAt: string | null) {
  if (!startsAt || !endsAt) {
    return "TBD";
  }

  const durationHours =
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / (1000 * 60 * 60);

  if (!Number.isFinite(durationHours) || durationHours <= 0) {
    return "TBD";
  }

  return `${Math.round(durationHours)} hrs`;
}
