import type { ActorAudience, LocalActorContext } from "@/services/local-actor-context";

export type RouteSmokePriority = "critical" | "important" | "support";

export type RouteSmokeItem = {
  path: string;
  label: string;
  priority: RouteSmokePriority;
  audiences: ActorAudience[];
  expectedResult: string;
  safetyAssertion: string;
};

export type RouteSmokeManifest = {
  canReadManifest: boolean;
  title: string;
  summary: string;
  routes: RouteSmokeItem[];
  counts: {
    totalRoutes: number;
    criticalRoutes: number;
    roleVariants: number;
    browserWritesExpected: 0;
    externalWritesExpected: 0;
  };
};

export function getRouteSmokeManifest(
  actor: LocalActorContext,
): RouteSmokeManifest {
  if (
    actor.audience !== "admin" &&
    actor.audience !== "ds_admin" &&
    actor.audience !== "super_admin"
  ) {
    return {
      canReadManifest: false,
      title: "Route smoke manifest hidden for this role",
      summary:
        "Chapter and coach roles should use operating routes rather than release-check manifests.",
      routes: [],
      counts: emptyCounts(),
    };
  }

  const routes = routeSmokeItems;

  return {
    canReadManifest: true,
    title: getTitle(actor),
    summary:
      "Use this manifest for manual browser smoke checks across the core Rush Month MVP routes and local actor roles.",
    routes,
    counts: {
      totalRoutes: routes.length,
      criticalRoutes: routes.filter((route) => route.priority === "critical").length,
      roleVariants: routes.reduce((total, route) => total + route.audiences.length, 0),
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

const routeSmokeItems: RouteSmokeItem[] = [
  {
    path: "/",
    label: "Role-aware home",
    priority: "critical",
    audiences: ["chapter_member", "chapter_leader", "coach", "admin", "ds_admin"],
    expectedResult: "Shows the selected local actor and the role next-action panel.",
    safetyAssertion: "No login, browser write, or external send is expected.",
  },
  {
    path: "/chapter",
    label: "Chapter home",
    priority: "critical",
    audiences: ["chapter_member", "chapter_leader", "coach", "ds_admin"],
    expectedResult:
      "Chapter roles see chapter context; DS Admin sees restricted integration-only messaging.",
    safetyAssertion: "No chapter membership write or role approval is expected.",
  },
  {
    path: "/chapter/members",
    label: "Chapter members and roles",
    priority: "critical",
    audiences: ["chapter_leader", "coach", "admin", "super_admin"],
    expectedResult:
      "Leaders and staff see roster health, join requests, role coverage, and disabled membership controls.",
    safetyAssertion:
      "Join approvals, role changes, committee moves, and member deactivation remain disabled.",
  },
  {
    path: "/rush-month",
    label: "Rush Month campaign",
    priority: "critical",
    audiences: ["chapter_member", "chapter_leader", "coach", "ds_admin"],
    expectedResult:
      "Allowed roles see campaign posture; leaders/coaches see closeout readiness; DS Admin is restricted.",
    safetyAssertion: "No phase advance, Luma write, or n8n workflow is expected.",
  },
  {
    path: "/rush-month/dashboard",
    label: "Role dashboard",
    priority: "critical",
    audiences: ["chapter_member", "chapter_leader", "coach", "ds_admin"],
    expectedResult:
      "Members see recognition; leaders/coaches see operating health; DS Admin sees integration posture only.",
    safetyAssertion: "No points write, KPI write, or leaderboard mutation is expected.",
  },
  {
    path: "/rush-month/events",
    label: "Event and NPS readiness",
    priority: "critical",
    audiences: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    expectedResult:
      "Reviewers see Rush Month event plans, student actions, NPS prompts, proof prompts, disabled Luma syncs, and disabled outbox rows.",
    safetyAssertion:
      "No Luma event create/update, attendance import, NPS reminder, warehouse export, or n8n workflow is expected.",
  },
  {
    path: "/rush-month/actions",
    label: "Assignments and follow-up",
    priority: "critical",
    audiences: ["chapter_member", "chapter_leader", "ds_admin"],
    expectedResult:
      "Members see own actions; leaders see follow-up board; DS Admin sees restricted assignment state.",
    safetyAssertion: "Assignment creation and reminders remain disabled.",
  },
  {
    path: "/rush-month/loop",
    label: "Local operating-loop demo",
    priority: "critical",
    audiences: ["chapter_leader", "coach", "admin", "super_admin"],
    expectedResult:
      "Reviewer can click through the local Rush Month loop without Supabase or external writes.",
    safetyAssertion: "All events/outbox rows remain browser-local and disabled/mock-safe.",
  },
  {
    path: "/proof-library",
    label: "Proof library",
    priority: "important",
    audiences: ["chapter_member", "chapter_leader", "admin", "ds_admin"],
    expectedResult:
      "Members see proof cards; HQ roles see sharing posture; DS Admin sees restricted proof messaging.",
    safetyAssertion: "No upload, public publish, warehouse export, or AI summary is expected.",
  },
  {
    path: "/proof-library/upload",
    label: "Proof upload readiness",
    priority: "critical",
    audiences: ["chapter_member", "chapter_leader", "admin", "super_admin"],
    expectedResult:
      "Reviewers see file requirements, consent checklist, disabled upload controls, future events, and disabled outbox posture.",
    safetyAssertion:
      "No file upload, storage bucket write, public proof URL, external export, or AI summary is expected.",
  },
  {
    path: "/rush-month/review",
    label: "HQ proof-sharing review",
    priority: "important",
    audiences: ["chapter_leader", "admin", "super_admin"],
    expectedResult:
      "Leaders can track proof posture; admin/super admin see disabled HQ decision controls.",
    safetyAssertion: "HQ decision saves and public sharing remain disabled.",
  },
  {
    path: "/coach",
    label: "Coach readout",
    priority: "critical",
    audiences: ["coach", "chapter_leader", "ds_admin"],
    expectedResult:
      "Coach sees readiness and portfolio; leader does not see portfolio rows; DS Admin is restricted.",
    safetyAssertion: "Coach decisions, reassignment, and escalation packets remain disabled.",
  },
  {
    path: "/admin",
    label: "Admin control center",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "Admin roles see coverage/readiness panels according to role; outbox remains restricted.",
    safetyAssertion: "Admin mutations, production auth, and external writes remain disabled.",
  },
  {
    path: "/admin/pilot-scope",
    label: "First pilot scope planner",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "HQ staff can compare pilot-scope options, minimum pilot routes, decision owners, and safety boundaries before naming real pilot users.",
    safetyAssertion:
      "The planner must not approve student invitations, enable browser writes, upload proof, or send external automation.",
  },
  {
    path: "/admin/staff-dry-run",
    label: "Staff dry-run guide",
    priority: "critical",
    audiences: ["admin", "ds_admin", "super_admin"],
    expectedResult:
      "HQ staff can rehearse the Rush Month MVP with fake actor emails, pass criteria, structured events to notice, and zero-write safety assertions.",
    safetyAssertion:
      "The dry run must not invite students, enable production auth, upload proof, save browser writes, or send external automation.",
  },
];

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "admin":
      return "Admin route smoke manifest";
    case "ds_admin":
      return "DS Admin route safety manifest";
    case "super_admin":
      return "Full local route smoke manifest";
    case "chapter_member":
    case "chapter_leader":
    case "coach":
      return "Route smoke manifest hidden for this role";
  }
}

function emptyCounts(): RouteSmokeManifest["counts"] {
  return {
    totalRoutes: 0,
    criticalRoutes: 0,
    roleVariants: 0,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}
