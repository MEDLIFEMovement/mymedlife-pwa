import Link from "next/link";

import { AssignmentCard } from "@/components/assignment-card";
import {
  getLaunchLaneMemberEventsHref,
  getLaunchLaneMemberPointsHref,
} from "@/services/events-points-launch-lane";
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
      <section className="overflow-hidden rounded-[2rem] border border-[#bfdbfe] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_54%,#edf4ff_100%)] p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2563eb]">
          Rush Month
        </p>
        <h1 className="mt-3 text-[2.1rem] font-semibold leading-none text-slate-950">
          My Actions
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          These are the actions assigned to you right now. Open the next one, do
          it clearly, and submit proof that shows what happened.
        </p>

        {sourceContext ? (
          <div className="mt-5 rounded-[1.35rem] border border-[#bfdbfe] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {sourceContext.eyebrow}
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{sourceContext.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {sourceContext.detail}
                </p>
              </div>
              <Link
                href={sourceContext.href}
                className="inline-flex w-fit rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#2563eb] transition hover:border-[#93c5fd] hover:bg-[#eef5ff]"
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
          <article className="mt-5 rounded-[1.7rem] border border-[#bfdbfe] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
              Start here
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {nextAssignment.title}
            </h2>
            <p className="mt-2 text-sm text-slate-500">{nextAssignment.dueLabel}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {nextAssignment.instructions}
            </p>
            <Link
              href={buildMemberActionRouteHref(nextAssignment.id, { source: source ?? undefined })}
              className="mt-4 inline-flex rounded-full bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
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
          href={getLaunchLaneMemberEventsHref(source ?? undefined)}
          eyebrow="Events"
          title="Stay with the event loop"
          detail="Open the chapter event tied to this work so RSVP, attendance, and points stay in one place."
        />
        <MemberRouteLink
          href={getLaunchLaneMemberPointsHref(source ?? undefined)}
          eyebrow="Points"
          title="See the point impact"
          detail="Use the leaderboard to confirm how completed work changes chapter momentum."
        />
        <MemberRouteLink
          href="/profile"
          eyebrow="Profile"
          title="Return to your role view"
          detail="Profile keeps your identity, role, and next step close without opening extra modules."
        />
      </section>
    </section>
  );
}

function getMemberActionsSourceContext(source: MemberActionRouteSource | null | undefined) {
  switch (source) {
    case "campaigns":
      return {
        eyebrow: "From a parked route",
        title: "These actions were handed off from the launch lane.",
        detail:
          "Campaign browsing is parked during this launch pass. Use the action list to finish the work, then return to the member event loop instead of reopening a separate campaign surface.",
        href: getLaunchLaneMemberEventsHref("campaigns"),
        backLabel: "Back to events",
      };
    case "evidence":
      return {
        eyebrow: "From a parked route",
        title: "These actions were handed off from your proof queue.",
        detail:
          "Proof browsing is parked during this launch pass. Use the action list to finish the work, then return to points and recognition instead of opening a separate proof surface.",
        href: getLaunchLaneMemberPointsHref("points"),
        backLabel: "Back to points",
      };
    case "home":
      return {
        eyebrow: "From home",
        title: "These actions came from your member home priority.",
        detail:
          "The home screen handed you into this action list as the next step for the week. Keep the task flow simple and return once you know what to do next.",
        href: "/app",
        backLabel: "Back to home",
      };
    case "events":
      return {
        eyebrow: "From events",
        title: "These actions came from the events route.",
        detail:
          "Use the actions list to finish the concrete follow-up an event surfaced, then keep the proof connected to that same chapter moment.",
        href: getLaunchLaneMemberEventsHref("events"),
        backLabel: "Back to events",
      };
    case "points":
      return {
        eyebrow: "From points",
        title: "These actions came from points and recognition.",
        detail:
          "Recognition should keep moving you toward a real next action. Finish the task here, then return once the points loop makes sense again.",
        href: getLaunchLaneMemberPointsHref("points"),
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
    <article className="rounded-[1.2rem] border border-[#bfdbfe] bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-600">{note}</p>
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
