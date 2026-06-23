import Link from "next/link";

import { AssignmentCard } from "@/components/assignment-card";
import {
  type MemberActionRouteSource,
  buildMemberActionRouteHref,
} from "@/services/member-action-route-href";
import type { Assignment } from "@/shared/types/domain";

type MemberRushMonthActionsPanelProps = {
  assignments: Assignment[];
  source?: MemberActionRouteSource | null;
};

export function MemberRushMonthActionsPanel({
  assignments,
  source,
}: MemberRushMonthActionsPanelProps) {
  const nextAssignment = assignments[0] ?? null;
  const inProgressCount = assignments.filter((assignment) => assignment.status === "in_progress").length;
  const submittedCount = assignments.filter((assignment) => assignment.status === "submitted").length;
  const sourceContext = getMemberActionsSourceContext(source);

  return (
    <section className="grid gap-4">
      <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(180deg,#2455a4_0%,#2a5fb5_48%,#21457d_100%)] p-5 shadow-[0_24px_80px_rgba(2,14,38,0.28)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#dbe8ff]">
          Rush Month
        </p>
        <h1 className="mt-3 text-[2.1rem] font-semibold leading-none text-white">
          My Actions
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/78">
          These are the actions assigned to you right now. Open the next one, do
          it clearly, and submit proof that shows what happened.
        </p>

        {sourceContext ? (
          <div className="mt-5 rounded-[1.35rem] border border-white/14 bg-white/[0.07] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/58">
                  {sourceContext.eyebrow}
                </p>
                <p className="mt-2 text-lg font-semibold text-white">{sourceContext.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/74">
                  {sourceContext.detail}
                </p>
              </div>
              <Link
                href={sourceContext.href}
                className="inline-flex w-fit rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-semibold text-white/88 transition hover:border-white/24 hover:bg-white/12 hover:text-white"
              >
                {sourceContext.backLabel}
              </Link>
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MemberActionStat
            label="Assigned"
            value={`${assignments.length}`}
            note="Assigned to you right now"
          />
          <MemberActionStat
            label="In progress"
            value={`${inProgressCount}`}
            note="Started and still in motion"
          />
          <MemberActionStat
            label="Submitted"
            value={`${submittedCount}`}
            note="Sent in and waiting for review"
          />
        </div>

        {nextAssignment ? (
          <article className="mt-5 rounded-[1.7rem] border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#f7d05e]">
              Start here
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {nextAssignment.title}
            </h2>
            <p className="mt-2 text-sm text-white/74">{nextAssignment.dueLabel}</p>
            <p className="mt-3 text-sm leading-6 text-white/76">
              {nextAssignment.instructions}
            </p>
            <Link
              href={buildMemberActionRouteHref(nextAssignment.id, { source: source ?? undefined })}
              className="mt-4 inline-flex rounded-full bg-[#f7d05e] px-4 py-2.5 text-sm font-semibold text-[#08224c]"
            >
              Start next action
            </Link>
          </article>
        ) : null}
      </section>

      <section className="app-surface-info rounded-[2rem] p-5">
        <p className="app-eyebrow app-eyebrow-blue">Assigned Actions</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          Assigned Actions
        </h2>
        <p className="app-copy mt-3">
          Open any task to see what to do, why it matters, and what proof counts.
        </p>
      </section>

      {assignments.length > 0 ? (
        <section className="grid gap-3">
          {assignments.map((assignment) => (
            <AssignmentCard
              key={`member-${assignment.id}`}
              assignment={assignment}
              source={source ?? undefined}
            />
          ))}
        </section>
      ) : (
        <section className="app-surface rounded-[2rem] p-5">
          <p className="app-eyebrow app-eyebrow-slate">No actions yet</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            When a chapter leader assigns work, it will appear here with a due date,
            clear steps, and proof expectations.
          </p>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <MemberRouteLink
          href={buildMemberCompanionRouteHref("/campaigns", source)}
          eyebrow="Campaign"
          title="See why this week matters"
          detail="Go back to the Rush Month campaign view for KPIs and chapter context."
        />
        <MemberRouteLink
          href={buildMemberCompanionRouteHref("/rush-month/events", source)}
          eyebrow="Events"
          title="Turn events into action"
          detail="Use the event flow when your task depends on a chapter moment or RSVP."
        />
        <MemberRouteLink
          href={buildMemberEvidenceRouteHref(source)}
          eyebrow="Proof"
          title="See what happens after you submit"
          detail="Your proof queue shows what is ready, waiting, or needs more context."
        />
      </section>
    </section>
  );
}

function getMemberActionsSourceContext(source: MemberActionRouteSource | null | undefined) {
  switch (source) {
    case "campaigns":
      return {
        eyebrow: "From campaigns",
        title: "These actions came from the Rush Month campaign view.",
        detail:
          "Stay inside the campaign loop: pick the next task, finish it clearly, and keep the proof tied to the same Rush Month context you just reviewed.",
        href: "/campaigns",
        backLabel: "Back to campaigns",
      };
    case "evidence":
      return {
        eyebrow: "From proof",
        title: "These actions came from your proof queue.",
        detail:
          "The proof route should send you back into the exact member work that still needs context, evidence, or one cleaner story before review.",
        href: "/rush-month/evidence",
        backLabel: "Back to proof",
      };
    case "home":
      return {
        eyebrow: "From home",
        title: "These actions came from your member home priority.",
        detail:
          "The home screen handed you into this action list as the next step for the week. Keep the task flow simple and return once you know what to do next.",
        href: "/",
        backLabel: "Back to home",
      };
    case "events":
      return {
        eyebrow: "From events",
        title: "These actions came from the events route.",
        detail:
          "Use the actions list to finish the concrete follow-up an event surfaced, then keep the proof connected to that same chapter moment.",
        href: "/rush-month/events",
        backLabel: "Back to events",
      };
    case "points":
      return {
        eyebrow: "From points",
        title: "These actions came from points and recognition.",
        detail:
          "Recognition should keep moving you toward a real next action. Finish the task here, then return once the points loop makes sense again.",
        href: "/rush-month/leaderboard",
        backLabel: "Back to points",
      };
    case "profile":
      return {
        eyebrow: "From profile",
        title: "These actions came from your profile route.",
        detail:
          "Profile should point you back into real work. Use this list to pick the next owned task, then return to profile with that progress in mind.",
        href: "/profile",
        backLabel: "Back to profile",
      };
    default:
      return null;
  }
}

function MemberActionStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="rounded-[1.2rem] border border-white/12 bg-white/10 p-3 backdrop-blur-sm">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-white/56">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-white/64">{note}</p>
    </article>
  );
}

function MemberRouteLink({
  href,
  eyebrow,
  title,
  detail,
}: {
  href: string;
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="app-surface rounded-[1.4rem] p-4 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff]"
    >
      <p className="app-eyebrow app-eyebrow-blue">{eyebrow}</p>
      <h3 className="mt-2 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </Link>
  );
}

function buildMemberCompanionRouteHref(
  href: "/campaigns" | "/rush-month/events",
  source: MemberActionRouteSource | null | undefined,
) {
  if (!source) {
    return href;
  }

  const supportedSourcesByHref: Record<typeof href, MemberActionRouteSource[]> = {
    "/campaigns": ["home", "events", "points", "profile"],
    "/rush-month/events": ["home", "campaigns", "points", "profile"],
  };

  if (!supportedSourcesByHref[href].includes(source)) {
    return href;
  }

  const searchParams = new URLSearchParams();
  searchParams.set("source", source);

  return `${href}?${searchParams.toString()}`;
}

function buildMemberEvidenceRouteHref(source: MemberActionRouteSource | null | undefined) {
  if (!source || source === "evidence") {
    return "/rush-month/evidence";
  }

  return `/rush-month/evidence?source=${source}`;
}
