"use client";

import { useMemo, useState } from "react";

type RoleKey = "member" | "action_lead" | "coach" | "admin";
type ActionStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "approved"
  | "changes_requested";
type OwnerRole =
  | "General Member"
  | "Action Committee Member"
  | "Action Committee Chair"
  | "E-Board Member"
  | "Chapter President / Vice President"
  | "Coach";
type EventType =
  | "user_signed_in"
  | "campaign_opened"
  | "action_assigned"
  | "action_started"
  | "evidence_submitted"
  | "evidence_approved"
  | "evidence_rejected"
  | "coach_decision_logged"
  | "points_awarded"
  | "integration_event_recorded";

type ActionCard = {
  id: string;
  title: string;
  owner: OwnerRole;
  due: string;
  proof: string;
  points: number;
  lane: "Member" | "Leader" | "Coach";
  status: ActionStatus;
  detail: string;
};

type EventCard = {
  id: string;
  type: EventType;
  title: string;
  detail: string;
  when: string;
};

const roleOrder: RoleKey[] = ["member", "action_lead", "coach", "admin"];

const roleCopy: Record<
  RoleKey,
  { label: string; description: string; surface: string; access: string }
> = {
  member: {
    label: "General Member",
    description: "Only assigned actions, proof upload, and recognition.",
    surface: "Member view",
    access: "My chapter, my actions, my proof, my points",
  },
  action_lead: {
    label: "Action Lead",
    description: "Assign work, review proof, and keep the chapter moving.",
    surface: "Leader view",
    access: "Assignments, approvals, progress, and chapter routing",
  },
  coach: {
    label: "Coach",
    description: "Monitor risk, chapter health, and the advance/hold call.",
    surface: "Coach view",
    access: "Portfolio signals, proof readiness, and intervention cues",
  },
  admin: {
    label: "Admin",
    description: "Own platform settings and mock integration wiring.",
    surface: "Admin view",
    access: "Integration stubs, event log, and emergency overrides",
  },
};

const ownerRotation: OwnerRole[] = [
  "General Member",
  "Action Committee Member",
  "Action Committee Chair",
  "E-Board Member",
  "Chapter President / Vice President",
];

const initialActions: ActionCard[] = [
  {
    id: "open-home",
    title: "Open the chapter home and read this week's operating path",
    owner: "Chapter President / Vice President",
    due: "Tue",
    proof: "Screenshot of the path review plus leader note",
    points: 10,
    lane: "Leader",
    status: "approved",
    detail: "Leader aligns the chapter around the current Rush Month objective.",
  },
  {
    id: "assign-eboard",
    title: "Assign Rush Month outreach to the E-Board",
    owner: "E-Board Member",
    due: "Wed",
    proof: "Assignment record with owner, due date, and proof requirement",
    points: 20,
    lane: "Leader",
    status: "submitted",
    detail: "This creates the first visible operating loop for the chapter.",
  },
  {
    id: "member-push",
    title: "Run the general member invite push",
    owner: "General Member",
    due: "Thu",
    proof: "Evidence upload with message preview or attendance proof",
    points: 15,
    lane: "Member",
    status: "in_progress",
    detail: "Members should know exactly what to do next and why it matters.",
  },
  {
    id: "proof-pack",
    title: "Submit the proof pack for review",
    owner: "Action Committee Chair",
    due: "Fri",
    proof: "Photo, form, or attendance proof bundle",
    points: 20,
    lane: "Leader",
    status: "changes_requested",
    detail: "Proof must be specific enough for coach review and KPI updates.",
  },
  {
    id: "coach-summary",
    title: "Prepare the coach-readable chapter health summary",
    owner: "Coach",
    due: "Fri",
    proof: "Advance / hold / intervene recommendation with rationale",
    points: 15,
    lane: "Coach",
    status: "not_started",
    detail: "Coaches need a quick read on risk, progress, and next intervention.",
  },
];

const initialEvents: EventCard[] = [
  {
    id: "evt-1",
    type: "user_signed_in",
    title: "Leader signed in",
    detail: "The chapter president opened the Rush Month workspace.",
    when: "08:03",
  },
  {
    id: "evt-2",
    type: "campaign_opened",
    title: "Rush Month opened",
    detail: "Chapter home routed into the Rush Month operating path.",
    when: "08:05",
  },
  {
    id: "evt-3",
    type: "action_assigned",
    title: "Action assigned",
    detail: "E-Board outreach task routed to the chapter leadership lane.",
    when: "08:12",
  },
  {
    id: "evt-4",
    type: "evidence_submitted",
    title: "Proof submitted",
    detail: "A member uploaded the first proof item for review.",
    when: "08:31",
  },
];

function nextStatus(status: ActionStatus): ActionStatus {
  switch (status) {
    case "not_started":
      return "in_progress";
    case "in_progress":
      return "submitted";
    case "submitted":
      return "approved";
    case "changes_requested":
      return "in_progress";
    case "approved":
      return "approved";
  }
}

function statusLabel(status: ActionStatus): string {
  switch (status) {
    case "not_started":
      return "Not started";
    case "in_progress":
      return "In progress";
    case "submitted":
      return "Proof submitted";
    case "approved":
      return "Approved";
    case "changes_requested":
      return "Needs changes";
  }
}

function statusTone(status: ActionStatus): string {
  switch (status) {
    case "approved":
      return "bg-emerald-400/15 text-emerald-200 ring-1 ring-inset ring-emerald-400/30";
    case "submitted":
      return "bg-sky-400/15 text-sky-200 ring-1 ring-inset ring-sky-400/30";
    case "in_progress":
      return "bg-amber-400/15 text-amber-100 ring-1 ring-inset ring-amber-400/30";
    case "changes_requested":
      return "bg-rose-400/15 text-rose-100 ring-1 ring-inset ring-rose-400/30";
    case "not_started":
      return "bg-white/10 text-white/70 ring-1 ring-inset ring-white/10";
  }
}

function eventTone(type: EventType): string {
  switch (type) {
    case "evidence_approved":
    case "points_awarded":
      return "text-emerald-200";
    case "evidence_rejected":
      return "text-rose-200";
    case "coach_decision_logged":
      return "text-cyan-200";
    case "integration_event_recorded":
      return "text-amber-200";
    default:
      return "text-white";
  }
}

export default function Home() {
  const [selectedRole, setSelectedRole] = useState<RoleKey>("action_lead");
  const [actions, setActions] = useState(initialActions);
  const [events, setEvents] = useState(initialEvents);

  const metrics = useMemo(() => {
    const approved = actions.filter((item) => item.status === "approved");
    const submitted = actions.filter((item) => item.status === "submitted");
    const inProgress = actions.filter((item) => item.status === "in_progress");
    const blocked = actions.filter(
      (item) =>
        item.status === "changes_requested" || item.status === "not_started",
    );
    const totalPoints = approved.reduce((sum, item) => sum + item.points, 0);
    const proofPending = actions.filter(
      (item) => item.status === "submitted" || item.status === "changes_requested",
    );
    const overdue = actions.filter((item) => item.status === "not_started");

    return {
      approvedCount: approved.length,
      submittedCount: submitted.length,
      inProgressCount: inProgress.length,
      blockedCount: blocked.length,
      proofPendingCount: proofPending.length,
      overdueCount: overdue.length,
      totalPoints,
    };
  }, [actions]);

  const decision = useMemo(() => {
    if (metrics.overdueCount > 1 || metrics.blockedCount > 1) {
      return {
        label: "hold",
        tone: "bg-amber-400/15 text-amber-100 ring-1 ring-inset ring-amber-400/30",
        reason: "Too many actions are stalled or waiting on revisions.",
      };
    }

    if (metrics.approvedCount >= 3 && metrics.proofPendingCount <= 1) {
      return {
        label: "advance",
        tone: "bg-emerald-400/15 text-emerald-100 ring-1 ring-inset ring-emerald-400/30",
        reason: "The chapter is moving and proof is in good shape.",
      };
    }

    return {
      label: "intervene",
      tone: "bg-rose-400/15 text-rose-100 ring-1 ring-inset ring-rose-400/30",
      reason: "A coach check-in is still needed before the next push.",
    };
  }, [metrics]);

  const visibleActions = useMemo(() => {
    if (selectedRole === "member") {
      return actions.filter(
        (item) =>
          item.lane === "Member" ||
          item.owner === "General Member" ||
          item.status !== "approved",
      );
    }

    return actions;
  }, [actions, selectedRole]);

  const myNextAction = useMemo(() => {
    if (selectedRole === "member") {
      return actions.find((item) => item.owner === "General Member" && item.status !== "approved") ?? actions[2];
    }

    if (selectedRole === "coach") {
      return actions.find((item) => item.owner === "Coach") ?? actions[4];
    }

    return actions.find((item) => item.status !== "approved") ?? actions[0];
  }, [actions, selectedRole]);

  function logEvent(type: EventType, title: string, detail: string) {
    setEvents((current) => [
      {
        id: `evt-${Date.now()}`,
        type,
        title,
        detail,
        when: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      ...current,
    ].slice(0, 8));
  }

  function advanceAction(id: string) {
    const action = actions.find((item) => item.id === id);

    if (!action) {
      return;
    }

    const status = nextStatus(action.status);
    const eventType: EventType =
      status === "in_progress"
        ? "action_started"
        : status === "submitted"
          ? "evidence_submitted"
          : "evidence_approved";

    setActions((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
            }
          : item,
      ),
    );

    logEvent(
      eventType,
      `${action.title} updated`,
      `${action.owner} moved the item to ${statusLabel(status).toLowerCase()}.`,
    );

    if (status === "approved") {
      logEvent(
        "points_awarded",
        `${action.points} points awarded`,
        `Proof accepted for ${action.title}.`,
      );
    }
  }

  function requestChanges(id: string) {
    const action = actions.find((item) => item.id === id);

    if (!action) {
      return;
    }

    setActions((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "changes_requested",
            }
          : item,
      ),
    );

    logEvent(
      "evidence_rejected",
      `${action.title} flagged for changes`,
      "Leader requested a tighter proof package before approval.",
    );
  }

  function reassignAction(id: string) {
    const action = actions.find((item) => item.id === id);

    if (!action) {
      return;
    }

    const currentIndex = ownerRotation.indexOf(action.owner);
    const nextOwner = ownerRotation[(currentIndex + 1) % ownerRotation.length];

    setActions((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              owner: nextOwner,
            }
          : item,
      ),
    );

    logEvent(
      "action_assigned",
      `${action.title} reassigned`,
      `${nextOwner} now owns this chapter action.`,
    );
  }

  function logIntegration() {
    logEvent(
      "integration_event_recorded",
      "Mock integration handoff saved",
      "HubSpot, Luma, and warehouse connectors remain read-only in MVP.",
    );
  }

  return (
    <main className="min-h-screen px-4 pb-8 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className="rounded-[2rem] border border-white/12 bg-white/6 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
                  myMEDLIFE
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    Chapter operating system for Rush Month.
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72 sm:text-base">
                    A mobile-first, production-style workspace for assigning work,
                    collecting proof, updating points, and giving coaches a clean
                    advance / hold / intervene read.
                  </p>
                </div>
              </div>

              <div className="hidden rounded-2xl border border-white/10 bg-black/20 p-3 text-right text-xs text-white/70 sm:block">
                <div className="font-semibold text-white">www.myMEDLIFE.org</div>
                <div className="mt-1">Custom PWA track</div>
                <div>Mock-first integrations</div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {roleOrder.map((role) => {
                const active = selectedRole === role;
                const copy = roleCopy[role];

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-emerald-300/40 bg-emerald-300/12 shadow-[0_0_0_1px_rgba(110,231,183,0.12)]"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white">
                        {copy.surface}
                      </span>
                      <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-white/56">
                        {copy.label}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/68">
                      {copy.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100">
                  Chapter home
                </span>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    Rush Month, without the clutter.
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
                    Students should know what matters next, leaders should see who
                    owns each step, and coaches should get a decision-ready view
                    instead of a passive SOP library.
                  </p>
                </div>
              </div>

              <div className="grid min-w-[12rem] grid-cols-2 gap-2 text-xs text-white/68">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/48">
                    Current campaign
                  </div>
                  <div className="mt-1 font-medium text-white">Rush Month</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/48">
                    Decision
                  </div>
                  <div className="mt-1 font-medium text-white capitalize">
                    {decision.label}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <MetricCard label="Points earned" value={`${metrics.totalPoints}`} note="From approved actions" />
              <MetricCard label="Proof pending" value={`${metrics.proofPendingCount}`} note="Needs leader review" />
              <MetricCard label="Chapter read" value={decision.label} note={decision.reason} tone={decision.tone} />
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/15 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-white/48">
                      This week
                    </div>
                    <h3 className="mt-1 text-lg font-semibold text-white">
                      Operating path
                    </h3>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/72">
                    Chapter-scoped
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    "Open the chapter home and align the leader team",
                    "Assign owner, due date, and proof requirements",
                    "Submit proof, review it, and award points",
                    "Pull a coach-readable advance / hold / intervene state",
                  ].map((item, index) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3"
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-300/15 text-sm font-semibold text-emerald-100">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-6 text-white/76">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-white/48">
                      My next step
                    </div>
                    <h3 className="mt-1 text-lg font-semibold text-white">
                      {myNextAction.title}
                    </h3>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone(myNextAction.status)}`}>
                    {statusLabel(myNextAction.status)}
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-sm leading-6 text-white/72">
                  <p>{myNextAction.detail}</p>
                  <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-3">
                    <Row label="Owner" value={myNextAction.owner} />
                    <Row label="Due" value={myNextAction.due} />
                    <Row label="Proof needed" value={myNextAction.proof} />
                    <Row label="Points" value={`${myNextAction.points}`} />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => advanceAction(myNextAction.id)}
                    className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d] transition hover:bg-emerald-200"
                  >
                    {selectedRole === "coach"
                      ? "Move to coach review"
                      : myNextAction.status === "approved"
                        ? "Record follow-up"
                        : "Advance action"}
                  </button>
                  <button
                    type="button"
                    onClick={() => logIntegration()}
                    className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Mock handoff
                  </button>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/12 bg-white/6 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-white/48">
                  Chapter snapshot
                </div>
                <h3 className="mt-1 text-xl font-semibold text-white">
                  Role rules at a glance
                </h3>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                {roleCopy[selectedRole].label}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <InfoCard label="Surface" value={roleCopy[selectedRole].surface} />
              <InfoCard label="Access" value={roleCopy[selectedRole].access} />
              <InfoCard label="Visibility" value="Chapter-scoped by default" />
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-white/48">
                Acceptance test
              </div>
              <div className="mt-2 space-y-2 text-sm leading-6 text-white/76">
                <p>Leader opens Rush Month, assigns work, reviews proof, and sees KPIs move.</p>
                <p>Member sees only assigned work and proof requirements.</p>
                <p>Coach sees the chapter decision state and intervention signal.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <MiniStat label="Approved" value={`${metrics.approvedCount}`} />
              <MiniStat label="In progress" value={`${metrics.inProgressCount}`} />
              <MiniStat label="Blocked" value={`${metrics.blockedCount}`} />
              <MiniStat label="Overdue" value={`${metrics.overdueCount}`} />
            </div>
          </aside>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/12 bg-white/6 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-white/48">
                  Rush Month board
                </div>
                <h3 className="mt-1 text-xl font-semibold text-white">
                  Role-based actions and proof
                </h3>
              </div>
              <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/70">
                Mobile-first
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {visibleActions.map((action) => (
                <article
                  key={action.id}
                  className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-white/56">
                          {action.lane}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusTone(action.status)}`}>
                          {statusLabel(action.status)}
                        </span>
                      </div>
                      <h4 className="text-lg font-semibold leading-7 text-white">
                        {action.title}
                      </h4>
                      <p className="max-w-2xl text-sm leading-6 text-white/70">
                        {action.detail}
                      </p>
                    </div>

                    <div className="grid min-w-[12rem] gap-2 text-sm text-white/72">
                      <Row label="Owner" value={action.owner} />
                      <Row label="Due" value={action.due} />
                      <Row label="Proof" value={action.proof} />
                      <Row label="Points" value={`${action.points}`} />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => advanceAction(action.id)}
                      className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#081b18] transition hover:bg-emerald-100"
                    >
                      {action.status === "not_started"
                        ? "Start"
                        : action.status === "in_progress"
                          ? "Submit proof"
                          : action.status === "submitted"
                            ? "Approve"
                            : action.status === "changes_requested"
                              ? "Resubmit"
                              : "Follow-up"}
                    </button>
                    {selectedRole !== "member" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => requestChanges(action.id)}
                          className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                          Request changes
                        </button>
                        <button
                          type="button"
                          onClick={() => reassignAction(action.id)}
                          className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                          Reassign
                        </button>
                      </>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <section className="rounded-[2rem] border border-white/12 bg-white/6 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-white/48">
                    Proof review
                  </div>
                  <h3 className="mt-1 text-xl font-semibold text-white">
                    Evidence queue
                  </h3>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                  {metrics.proofPendingCount} pending
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {actions.filter((item) => item.status !== "not_started").length > 0 ? (
                  actions
                    .filter((item) => item.status !== "not_started")
                    .map((action) => (
                      <div
                        key={action.id}
                        className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-white">
                              {action.title}
                            </div>
                            <p className="mt-1 text-sm leading-6 text-white/68">
                              {action.proof}
                            </p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusTone(action.status)}`}>
                            {statusLabel(action.status)}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => advanceAction(action.id)}
                            className="rounded-full bg-emerald-300 px-3 py-2 text-xs font-semibold text-[#09221d] transition hover:bg-emerald-200"
                          >
                            {action.status === "submitted" ? "Approve proof" : "Move forward"}
                          </button>
                          <button
                            type="button"
                            onClick={() => requestChanges(action.id)}
                            className="rounded-full border border-white/12 bg-white/6 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                          >
                            Request changes
                          </button>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/68">
                    No proof is waiting yet. Once a member submits evidence, it
                    appears here for leader review.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/12 bg-white/6 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-white/48">
                    Coach packet
                  </div>
                  <h3 className="mt-1 text-xl font-semibold text-white">
                    Advance / hold / intervene
                  </h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${decision.tone}`}>
                  {decision.label}
                </span>
              </div>

              <div className="mt-4 space-y-3 text-sm leading-6 text-white/76">
                <p>{decision.reason}</p>
                <div className="grid gap-2 rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
                  <Row label="Approved actions" value={`${metrics.approvedCount}`} />
                  <Row label="Proof pending" value={`${metrics.proofPendingCount}`} />
                  <Row label="Risk signals" value={`${metrics.blockedCount}`} />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    logEvent(
                      "coach_decision_logged",
                      `Coach decision: ${decision.label}`,
                      decision.reason,
                    )
                  }
                  className="w-full rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#081d19] transition hover:bg-emerald-100"
                >
                  Log coach decision
                </button>
              </div>
            </section>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/12 bg-white/6 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
            <div className="text-xs uppercase tracking-[0.24em] text-white/48">
              Integration boundaries
            </div>
            <h3 className="mt-1 text-xl font-semibold text-white">
              Mock-first handoff surfaces
            </h3>
            <div className="mt-4 space-y-3 text-sm leading-6 text-white/72">
              <BoundaryCard
                name="HubSpot"
                detail="Mirror chapter, contact, and lifecycle state later. No silent writebacks in MVP."
              />
              <BoundaryCard
                name="Luma"
                detail="Store URL and event identifiers now. Attendance sync stays mocked until approval."
              />
              <BoundaryCard
                name="Data Hub / warehouse"
                detail="Event history and KPI events are ready for a future source-of-truth pipeline."
              />
              <BoundaryCard
                name="n8n"
                detail="Reminders, escalation packets, retries, and failure logs stay behind the mock boundary."
              />
              <BoundaryCard
                name="Power BI"
                detail="Staff dashboards will read the KPI ledger after the operating loop is stable."
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/12 bg-white/6 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-white/48">
                  Event log
                </div>
                <h3 className="mt-1 text-xl font-semibold text-white">
                  Structured activity stream
                </h3>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                audit-friendly
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className={`text-sm font-semibold ${eventTone(event.type)}`}>
                        {event.title}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-white/68">
                        {event.detail}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-white/56">
                      {event.when}
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] uppercase tracking-[0.2em] text-white/40">
                    {event.type.replaceAll("_", " ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone?: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
      <div className="text-xs uppercase tracking-[0.24em] text-white/48">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${tone ?? "text-white"}`}>
        {value}
      </div>
      <p className="mt-2 text-sm leading-6 text-white/64">{note}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
      <div className="text-[11px] uppercase tracking-[0.22em] text-white/46">{label}</div>
      <div className="mt-1 text-sm leading-6 text-white">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-white/10 bg-black/20 p-3">
      <div className="text-[11px] uppercase tracking-[0.22em] text-white/46">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-white/48">{label}</span>
      <span className="text-right text-white">{value}</span>
    </div>
  );
}

function BoundaryCard({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
      <div className="text-sm font-semibold text-white">{name}</div>
      <p className="mt-1 text-sm leading-6 text-white/68">{detail}</p>
    </div>
  );
}
