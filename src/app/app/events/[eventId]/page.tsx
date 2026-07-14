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
} from "lucide-react";

import {
  MemberBottomNav,
  type MemberBottomNavTab,
} from "@/components/member-bottom-nav";
import { getLaunchLaneMemberPointsHref } from "@/services/events-points-launch-lane";
import { getLandingRouteForActor } from "@/services/landing-route";
import {
  buildLoginRedirectHref,
  shouldRedirectActorToLogin,
} from "@/services/login-route";
import { getLaunchLaneEventSnapshotById } from "@/services/launch-lane-event-snapshots";
import {
  buildMemberLaunchLaneEventDetailHref,
  getMemberLaunchLaneEventRowById,
} from "@/services/member-launch-lane-events";
import { getLocalActorContext } from "@/services/local-actor-context";
import {
  getMockReadOnlyAppData,
  getReadOnlyAppData,
  type ReadOnlyAppData,
} from "@/services/read-only-app-data";
import { canAccessMemberWorkspace } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

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
  }>;
};

type EventDetailStep = "detail" | "rsvp" | "checkin" | "points";

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
  } = {};
  const [{ eventId }, resolvedSearchParams, actor, data] = await Promise.all([
    params,
    searchParams ?? Promise.resolve(emptySearchParams),
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref(`/app/events/${eventId}`));
  }

  if (!canAccessMemberWorkspace(actor)) {
    redirect(getLandingRouteForActor(actor));
  }

  const resolvedEventData = getResolvedEventDetailData(actor, data, eventId);
  const { event, snapshot } = resolvedEventData;

  if (!event || !snapshot) {
    redirect("/app/events");
  }

  const step = getEventDetailStep(resolvedSearchParams.step);
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
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-white md:min-h-0 md:rounded-[44px] md:border-4 md:border-white/40 md:shadow-2xl">
        <div className="flex-1 overflow-y-auto pb-24">
          {step === "detail" ? (
            <EventDetailView
              event={event}
              snapshot={snapshot}
              source={resolvedSearchParams.source}
              profileSource={resolvedSearchParams.profileSource}
              campaign={resolvedSearchParams.campaign}
              storyFilter={resolvedSearchParams.storyFilter}
              storyId={resolvedSearchParams.story}
            />
          ) : step === "rsvp" ? (
            <EventRsvpConfirmView
              event={event}
              snapshot={snapshot}
              backHref={backHref}
              source={resolvedSearchParams.source}
              profileSource={resolvedSearchParams.profileSource}
              campaign={resolvedSearchParams.campaign}
              storyFilter={resolvedSearchParams.storyFilter}
              storyId={resolvedSearchParams.story}
            />
          ) : step === "checkin" ? (
            <EventCheckInView
              event={event}
              snapshot={snapshot}
              backHref={backHref}
              source={resolvedSearchParams.source}
              profileSource={resolvedSearchParams.profileSource}
              campaign={resolvedSearchParams.campaign}
              storyFilter={resolvedSearchParams.storyFilter}
              storyId={resolvedSearchParams.story}
            />
          ) : (
            <EventPointsImpactView
              event={event}
              snapshot={snapshot}
              backHref={backHref}
              source={resolvedSearchParams.source}
              profileSource={resolvedSearchParams.profileSource}
              campaign={resolvedSearchParams.campaign}
              storyFilter={resolvedSearchParams.storyFilter}
              storyId={resolvedSearchParams.story}
            />
          )}
        </div>
        <MemberBottomNav activeTab={activeTab} hrefOverrides={navHrefOverrides} />
      </div>
    </main>
  );
}

function getResolvedEventDetailData(
  actor: Awaited<ReturnType<typeof getLocalActorContext>>,
  data: ReadOnlyAppData,
  eventId: string,
) {
  const liveEvent = getMemberLaunchLaneEventRowById(actor, data, eventId);
  const liveSnapshot = getLaunchLaneEventSnapshotById(data, eventId);

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
  snapshot,
  source,
  profileSource,
  campaign,
  storyFilter,
  storyId,
}: {
  event: NonNullable<ReturnType<typeof getMemberLaunchLaneEventRowById>>;
  snapshot: NonNullable<ReturnType<typeof getLaunchLaneEventSnapshotById>>;
  source?: string;
  profileSource?: string;
  campaign?: string;
  storyFilter?: string;
  storyId?: string;
}) {
  const detailHref = buildEventStepHref(event.id, "detail", source, profileSource, campaign, storyFilter, storyId);
  const rsvpHref = buildEventStepHref(event.id, "rsvp", source, profileSource, campaign, storyFilter, storyId);
  const checkInHref = buildEventStepHref(event.id, "checkin", source, profileSource, campaign, storyFilter, storyId);
  const pointsHref = buildEventStepHref(event.id, "points", source, profileSource, campaign, storyFilter, storyId);
  const returnHref = getEventReturnHref(event.id, source, profileSource, campaign, storyFilter, storyId);
  const returnLabel = getEventReturnLabel(source);
  const sourceContext = getEventSourceContext(event.id, source, profileSource, campaign, storyFilter, storyId);
  const visibleEventTitle = ensureVisibleTestLabel(event.title);
  const visibleChapterName = ensureVisibleTestLabel(snapshot.chapterName);
  const visibleLocationLabel = ensureVisibleTestLabel(snapshot.memberLocationLabel);

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
              <Pill label={event.memberRsvpState === "registered" ? "RSVP'd" : "RSVP Open"} variant="green" />
              <Pill label={visibleChapterName} variant="blue" />
            </div>
            <h1 className="text-2xl font-extrabold leading-snug text-white">{visibleEventTitle}</h1>
            <p className="mt-1 text-sm text-blue-200">
              {visibleChapterName} · {event.memberDateTimeLabel}
            </p>
          </div>
        </div>

        {event.memberRsvpState === "registered" ? (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-300/40 bg-emerald-400/20 p-4">
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
        ) : (
          <Link
            href={rsvpHref}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f5a623] px-4 py-4 text-lg font-extrabold text-[#10223f] shadow-lg transition hover:opacity-90"
          >
            <CheckCircle2 size={20} />
            RSVP to Event
          </Link>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <QuickStat label="RSVPs" value={String(event.rsvpCount)} />
          <QuickStat label="Points" value={String(event.pointsAwarded)} />
          <QuickStat label="Duration" value={getDurationLabel(snapshot.startsAt, snapshot.endsAt)} />
        </div>
      </div>

      <div className="space-y-4 px-4 pt-5">
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
              disabled
              title="Calendar export is blocked in this preview"
              className="flex-1 rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-800"
            >
              <span className="flex items-center justify-center gap-1.5">
                <CalendarDays size={15} className="text-[#1b4b8e]" /> Add to Calendar
              </span>
            </button>
            <button
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
              value={String(event.pointsAwarded)}
              detail="check-in required"
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
            Route-backed preview
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            This event detail route is wired for review. RSVP, check-in, and points-impact
            steps are route-backed local preview states here, with no live writes or external
            sends.
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            Review the full TEST event loop here, then use the approved in-person attendance flow
            for real RSVP, check-in, and points-award writes.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={detailHref} className="rounded-full border border-[#bfdbfe] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              Detail
            </Link>
            <Link href={rsvpHref} className="rounded-full border border-[#bfdbfe] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              RSVP
            </Link>
            <Link href={checkInHref} className="rounded-full border border-[#bfdbfe] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              Check-In
            </Link>
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
  snapshot,
  backHref,
  source,
  profileSource,
  campaign,
  storyFilter,
  storyId,
}: {
  event: NonNullable<ReturnType<typeof getMemberLaunchLaneEventRowById>>;
  snapshot: NonNullable<ReturnType<typeof getLaunchLaneEventSnapshotById>>;
  backHref: string;
  source?: string;
  profileSource?: string;
  campaign?: string;
  storyFilter?: string;
  storyId?: string;
}) {
  const visibleLocationLabel = ensureVisibleTestLabel(snapshot.memberLocationLabel);
  const returnHref = getEventReturnHref(event.id, source, profileSource, campaign, storyFilter, storyId);
  const returnLabel = getEventReturnLabel(source);
  return (
    <StepShell backHref={backHref} title="">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 size={40} className="text-emerald-600" />
        </div>
        <h1 className="mb-2 text-2xl font-extrabold text-slate-950">You&apos;re RSVP&apos;d!</h1>
        <p className="mb-8 max-w-xs text-sm leading-relaxed text-slate-600">
          We&apos;ll see you there. Don&apos;t forget to check in when you arrive to preview your points impact.
        </p>

        <Card className="mb-4 w-full text-left">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#1b4b8e]">Event Summary</p>
          <div className="space-y-2 text-sm text-slate-600">
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
            <span className="text-sm font-bold text-slate-950">Attend and check in to earn</span>
          </div>
          <p className="ml-7 text-3xl font-extrabold text-amber-600">{event.pointsAwarded} points</p>
          <p className="ml-7 mt-1 text-xs text-amber-700">
            Route-backed preview only. No attendance write is sent from this screen.
          </p>
        </div>

        <div className="mb-8 flex w-full items-start gap-2 rounded-2xl bg-[#eef2ff] p-3">
          <QrCode size={18} className="mt-0.5 flex-shrink-0 text-[#1b4b8e]" />
          <p className="text-left text-sm font-medium text-[#1b4b8e]">
            The real pilot flow still requires approved attendance handling. This route shows the
            next check-in state without writing to Luma or your points ledger.
          </p>
        </div>

        <div className="w-full space-y-2.5">
          <PrimaryLink
            href={buildEventStepHref(event.id, "checkin", source, profileSource, campaign, storyFilter, storyId)}
            label="Go to Check-In"
            icon={<QrCode size={16} />}
          />
          <SecondaryLink href={returnHref} label={returnLabel} />
        </div>
      </div>
    </StepShell>
  );
}

function EventCheckInView({
  event,
  snapshot,
  backHref,
  source,
  profileSource,
  campaign,
  storyFilter,
  storyId,
}: {
  event: NonNullable<ReturnType<typeof getMemberLaunchLaneEventRowById>>;
  snapshot: NonNullable<ReturnType<typeof getLaunchLaneEventSnapshotById>>;
  backHref: string;
  source?: string;
  profileSource?: string;
  campaign?: string;
  storyFilter?: string;
  storyId?: string;
}) {
  const visibleEventTitle = ensureVisibleTestLabel(event.title);
  return (
    <StepShell backHref={backHref} title="Check In">
      <div className="flex flex-1 flex-col px-4 py-6">
        <Card className="mb-6 border-[#dbeafe] bg-[#eff6ff]">
          <div className="mb-2 flex items-center gap-2">
            <Pill label="RSVP'd" variant="green" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-950">{visibleEventTitle}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
            <Clock size={13} />
            {snapshot.memberDateTimeLabel}
          </p>
        </Card>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
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
          <p className="mb-1.5 text-sm text-slate-600">
            Use the approved attendance flow at the event. This route only previews the next state.
          </p>
          <div className="mb-6 flex items-center gap-1.5 text-sm font-bold text-amber-600">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            Preview {event.pointsAwarded} points after check-in
          </div>
        </div>

        <PrimaryLink
          href={buildEventStepHref(event.id, "points", source, profileSource, campaign, storyFilter, storyId)}
          label="Confirm Check-In"
          icon={<UserCheck size={20} />}
        />
      </div>
    </StepShell>
  );
}

function EventPointsImpactView({
  event,
  snapshot,
  backHref,
  source,
  profileSource,
  campaign,
  storyFilter,
  storyId,
}: {
  event: NonNullable<ReturnType<typeof getMemberLaunchLaneEventRowById>>;
  snapshot: NonNullable<ReturnType<typeof getLaunchLaneEventSnapshotById>>;
  backHref: string;
  source?: string;
  profileSource?: string;
  campaign?: string;
  storyFilter?: string;
  storyId?: string;
}) {
  const visibleChapterName = ensureVisibleTestLabel(snapshot.chapterName);
  const returnHref = getEventReturnHref(event.id, source, profileSource, campaign, storyFilter, storyId);
  const returnLabel = getEventReturnLabel(source);
  const chapterRows = [
    { rank: "🥇", name: "TEST Aisha N.", points: 220 },
    { rank: "🥈", name: "TEST Marcus T.", points: 185 },
    { rank: "🥉", name: "You (TEST Sofia R.)", points: 165, highlight: true },
  ];

  return (
    <StepShell backHref={backHref} title="">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 size={48} className="text-emerald-600" />
        </div>
        <h1 className="mb-1 text-2xl font-extrabold text-slate-950">Checked in!</h1>
        <p className="mt-2 mb-1 text-4xl font-extrabold text-amber-500">+{event.pointsAwarded} points</p>
        <p className="mb-8 text-sm text-slate-600">
          Local preview of the post-check-in state for {visibleChapterName}.
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

        <div className="w-full rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] p-4 text-left">
          <p className="text-xs font-bold uppercase tracking-wide text-[#1b4b8e]">
            Preview honesty
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            This is a route-backed member preview of the exported points-earned state. The real
            points ledger still depends on the approved attendance and write sequence.
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
  variant: "green" | "blue";
}) {
  const classes =
    variant === "green"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-blue-50 text-blue-700";

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
