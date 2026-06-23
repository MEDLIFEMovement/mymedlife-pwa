import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { EventOutboxLog } from "@/components/event-outbox-log";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import type { MemberActionRouteSource } from "@/services/member-action-route-href";
import { getRushMonthEventsRouteRedirectHref } from "@/services/owned-route-redirect";
import { isMemberSurfaceFamily } from "@/services/role-visibility";
import {
  type EventDetailCheckStatus,
  getRushMonthEventDetailWorkspace,
} from "@/services/rush-month-event-detail";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthEventDetail");
export const dynamic = "force-dynamic";

type RushMonthEventDetailPageProps = {
  params: Promise<{
    eventId: string;
  }>;
  searchParams?: Promise<{
    returnTo?: string;
    source?: string;
  }>;
};

export default async function RushMonthEventDetailPage({
  params,
  searchParams,
}: RushMonthEventDetailPageProps) {
  const { eventId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const actor = await getLocalActorContext();
  const redirectHref = getRushMonthEventsRouteRedirectHref(actor, {
    eventId,
    source: resolvedSearchParams?.source,
  });

  if (redirectHref) {
    redirect(redirectHref);
  }

  const memberActionSource = parseMemberEventSource(resolvedSearchParams?.source);
  const workspace = getRushMonthEventDetailWorkspace(actor, eventId, memberActionSource);

  if (!workspace) {
    notFound();
  }

  if (!workspace.canReadWorkspace || !workspace.event) {
    const isMemberEventSurface = isMemberSurfaceFamily(actor);

    return (
      <AppShell
        actor={actor}
        hideTopHeader={isMemberEventSurface}
        showMobileQuickItemHelpers={!isMemberEventSurface}
        showDebugTools={!isMemberEventSurface}
      >
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref={workspace.nextStep.href}
          nextLabel={workspace.nextStep.label}
        />
      </AppShell>
    );
  }

  const event = workspace.event;
  const isMemberWorkspace = isMemberSurfaceFamily(actor);
  const memberBackLink = getMemberBackLink(memberActionSource);
  const memberSourceContext = getMemberEventDetailSourceContext(memberActionSource);
  const chapterEventContext = getChapterEventDetailSourceContext(
    resolvedSearchParams?.source,
    resolvedSearchParams?.returnTo,
    event.title,
  );

  return (
    <AppShell
      actor={actor}
      hideTopHeader={isMemberWorkspace}
      showMobileQuickItemHelpers={!isMemberWorkspace}
      showDebugTools={!isMemberWorkspace}
    >
      {isMemberWorkspace ? (
        <>
          <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(145deg,#0a3b88_0%,#0b4f9b_58%,#081a3a_100%)] p-4 shadow-[0_24px_80px_rgba(2,14,38,0.32)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/82">
                    {workspace.title}
                  </span>
                  <span className="rounded-full border border-[#f7d05e]/30 bg-[#f7d05e]/12 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#f7d05e]">
                    {event.rsvpStatusLabel}
                  </span>
                </div>
                <h1 className="mt-2.5 text-[2rem] font-semibold leading-tight text-white">
                  {event.title}
                </h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  {event.memberLumaLabel ? (
                    <span className="rounded-full border border-[#d8b4fe]/28 bg-[#7c3aed]/16 px-3 py-1 text-xs font-semibold text-white/92">
                      {event.memberLumaLabel}
                    </span>
                  ) : null}
                  <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs font-semibold text-white/82">
                    {event.memberCampaignLabel}
                  </span>
                  <span className="rounded-full border border-[#f7d05e]/28 bg-[#f7d05e]/12 px-3 py-1 text-xs font-semibold text-[#fde68a]">
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
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <Link
                    href={workspace.nextStep.href}
                    className="inline-flex rounded-full bg-[#f7d05e] px-4 py-2.5 text-sm font-semibold text-[#08224c]"
                  >
                    {workspace.nextStep.label}
                  </Link>
                  <Link
                    href={workspace.proofNextStep.href}
                    className="inline-flex rounded-full border border-white/18 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-white/28 hover:bg-[#eef5ff] hover:text-slate-950"
                  >
                    {workspace.proofNextStep.label}
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
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      {getMemberEventSupportLabel(event)}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <span className="rounded-full border border-[#dbeafe] bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#2563eb]">
                  {event.memberCampaignLabel}
                </span>
                <span className="rounded-full border border-[#fef3c7] bg-[#fffbeb] px-3 py-1 text-xs font-semibold text-[#a16207]">
                  {event.memberPointsLabel}
                </span>
              </div>
            </section>

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
                follow-up signal, and one proof note that helps the next person
                understand why MEDLIFE feels active on campus.
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
                  <MemberDetailBlock label="Feedback plan" value={event.feedbackPlan} />
                </div>
              </section>

              <section className="app-surface rounded-[2rem] p-4">
                <p className="app-eyebrow app-eyebrow-blue">What to capture after</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Turn the event into proof someone else can believe.
                </h2>
                <div className="mt-4 grid gap-3">
                  <MemberDetailBlock label="Proof prompt" value={event.proofPrompt} />
                  <MemberDetailBlock label="NPS question" value={event.npsQuestion} />
                  <MemberDetailBlock
                    label="Why this matters"
                    value="A clean proof note or testimonial helps the next student understand why MEDLIFE is worth joining."
                  />
                </div>
              </section>
            </section>
          </div>

        </>
      ) : (
        <>
      {chapterEventContext ? (
        <section className="rounded-[2rem] border border-[#bfdbfe] bg-[#f8fbff] p-5">
          <p className="app-eyebrow app-eyebrow-blue">{chapterEventContext.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {chapterEventContext.title}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            {chapterEventContext.detail}
          </p>
          <a
            href={chapterEventContext.href}
            className="mt-4 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950"
          >
            {chapterEventContext.backLabel}
          </a>
        </section>
      ) : null}
      <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(145deg,#0a3b88_0%,#0b4f9b_58%,#081a3a_100%)] p-5 shadow-[0_24px_80px_rgba(2,14,38,0.32)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f7d05e]">
              {workspace.title}
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{event.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/78">
              {workspace.summary}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <EventHeroStat label="Timing" value={event.timing} />
              <EventHeroStat label="RSVP" value={event.rsvpStatusLabel} />
              <EventHeroStat label="Owner" value={event.ownerRole} />
            </div>
          </div>
          <Link
            href="/rush-month/events"
            className="w-fit rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white"
          >
            Back to events
          </Link>
        </div>
      </section>

      <DataSourceNotice source={actor.source} />

      <div className="grid gap-4 rounded-[2rem] bg-[#eef3fb] p-4 shadow-[0_18px_50px_rgba(5,24,60,0.12)]">
        <section className="rounded-[2rem] border border-[#bfdbfe] bg-[#eaf2ff] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2563eb]">
                What should I do next?
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                {workspace.nextStep.detail}
              </h2>
            </div>
            <Link
              href={workspace.nextStep.href}
              className="w-fit rounded-full bg-[#86efac] px-4 py-2 text-sm font-semibold text-[#14532d]"
            >
              {workspace.nextStep.label}
            </Link>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStat label="Timing" value={event.timing} />
          <MiniStat label="RSVP" value={event.rsvpStatusLabel} />
          <MiniStat label="Owner" value={event.ownerRole} />
          <MiniStat label="Event type" value={event.eventTypeLabel} />
          <MiniStat label="External writes" value={`${workspace.counts.externalWritesExpected}`} />
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap gap-2">
            <CheckStatusPill status={event.rsvpStatusTone}>
              {event.rsvpStatusLabel}
            </CheckStatusPill>
            <LumaStatusPill status={event.lumaStatusTone} label={event.lumaStatusLabel} />
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {event.committeeName}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {event.supportLane} lane
            </span>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <DetailBlock label="RSVP posture" value={event.rsvpDetail} />
            <DetailBlock label="Student action" value={event.expectedStudentAction} />
            <DetailBlock label="Feedback plan" value={event.feedbackPlan} />
            <DetailBlock label="NPS question" value={event.npsQuestion} />
            <DetailBlock label="Proof prompt" value={event.proofPrompt} />
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Readiness checks
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {workspace.readinessChecks.map((check) => (
              <article
                key={check.label}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-slate-950">{check.label}</p>
                  <CheckStatusPill status={check.status} />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{check.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <EventOutboxLog
          events={workspace.futureStructuredEvents}
          outboxItems={workspace.disabledOutboxItems}
        />

        <section className="rounded-[2rem] border border-[#f7d05e]/30 bg-[#fff8df] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a16207]">
            Safety boundary
          </p>
          <div className="mt-4 grid gap-2">
            {workspace.safetyNotes.map((note) => (
              <p
                key={note}
                className="rounded-2xl border border-[#f7d05e]/20 bg-white/70 p-3 text-sm leading-6 text-slate-700"
              >
                {note}
              </p>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            Browser writes expected: {workspace.counts.browserWritesExpected}. External
            writes expected: {workspace.counts.externalWritesExpected}.
          </p>
        </section>
      </div>
        </>
      )}
    </AppShell>
  );
}

function parseMemberEventSource(
  source?: string,
): MemberActionRouteSource | null {
  switch (source) {
    case "home":
      return "home";
    case "campaigns":
      return "campaigns";
    case "events":
      return "events";
    case "points":
      return "points";
    case "profile":
      return "profile";
    default:
      return null;
  }
}

function getMemberBackLink(source: MemberActionRouteSource | null) {
  if (source === "home") {
    return {
      href: "/",
      label: "Back to home",
    };
  }

  if (source === "campaigns") {
    return {
      href: "/campaigns",
      label: "Back to campaign",
    };
  }

  if (source === "points") {
    return {
      href: "/rush-month/leaderboard",
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
    href: "/rush-month/events",
      label: "Back to events",
  };
}

function getMemberEventDetailSourceContext(source: MemberActionRouteSource | null) {
  switch (source) {
    case "home":
      return {
        eyebrow: "From home",
        detail:
          "Home surfaced this chapter moment as the next place to show up. Keep the weekly loop attached while you review the event plan.",
      };
    case "campaigns":
      return {
        eyebrow: "From campaigns",
        detail:
          "Campaign context explains why this event matters. Keep the larger Rush Month loop attached while you review this event detail.",
      };
    case "points":
      return {
        eyebrow: "From points",
        detail:
          "Points and recognition led you here because this event can move the next approved action forward.",
      };
    case "profile":
      return {
        eyebrow: "From profile",
        detail:
          "Profile pointed you into a real chapter moment. Keep that member-owned handoff attached while you review this event detail.",
      };
    default:
      return null;
  }
}

function getChapterEventDetailSourceContext(
  source: string | undefined,
  returnTo: string | undefined,
  eventTitle: string,
) {
  if (source !== "chapter_event_review") {
    return null;
  }

  return {
    eyebrow: "From chapter events",
    title: `${eventTitle} is still the event in focus.`,
    detail:
      "Keep committee context, proof posture, and follow-up ownership attached to this event while you inspect the broader Rush Month event flow.",
    href: normalizeChapterEventReturnTo(returnTo),
    backLabel: "Back to chapter events",
  };
}

function normalizeChapterEventReturnTo(value: string | undefined) {
  if (!value) {
    return "/chapter?view=events";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/chapter?view=events";
  }

  return value;
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
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "mocked"
        ? "border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]"
        : "border-amber-200 bg-amber-50 text-amber-700";

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

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function CheckStatusPill({
  status,
  children,
}: {
  status: EventDetailCheckStatus;
  children?: string;
}) {
  const className =
    status === "ready"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : status === "mocked"
        ? "border-cyan-300/30 bg-cyan-300/15 text-cyan-100"
        : "border-amber-300/30 bg-amber-300/15 text-amber-100";

  return (
    <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${className}`}>
      {children ?? status}
    </span>
  );
}

function LumaStatusPill({
  label,
  status,
}: {
  label: string;
  status: "mock_linked" | "not_linked" | "future_sync_disabled";
}) {
  const className =
    status === "mock_linked"
      ? "border-cyan-300/30 bg-cyan-300/15 text-cyan-100"
      : status === "future_sync_disabled"
        ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function EventHeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/12 bg-white/10 p-3 backdrop-blur-sm">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-white/56">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
