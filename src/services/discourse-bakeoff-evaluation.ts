export type DiscourseBakeoffStatus = "pwa_leads" | "reference_only" | "needs_pilot_confirmation";

export type DiscourseBakeoffItem = {
  key: string;
  label: string;
  status: DiscourseBakeoffStatus;
  mymedlifePosture: string;
  discoursePosture: string;
  recommendation: string;
  routeEvidence: string[];
};

export type DiscourseBakeoffEvaluation = {
  title: string;
  summary: string;
  finalRecommendation: string;
  launchCall: "mymedlife_mvp_discourse_reference_only";
  items: DiscourseBakeoffItem[];
  nextSteps: string[];
};

export function getDiscourseBakeoffEvaluation(): DiscourseBakeoffEvaluation {
  return {
    title: "Discourse vs myMEDLIFE bake-off",
    summary:
      "This compares the current myMEDLIFE MVP against the Discourse prototype for the jobs that matter most in pilot: role-aware execution, proof/review flow, chapter oversight, and launch safety.",
    finalRecommendation:
      "Use myMEDLIFE as the MVP and pilot operating system. Keep Discourse as a prototype and reference layer for content, examples, and stakeholder comparison, not as the source of truth for chapter operations.",
    launchCall: "mymedlife_mvp_discourse_reference_only",
    items: [
      {
        key: "student_action_loop",
        label: "Student action loop",
        status: "pwa_leads",
        mymedlifePosture:
          "The member route sequence already supports home, actions, action detail, evidence prep, leaderboard, event review, and profile as one connected operating path.",
        discoursePosture:
          "Discourse can illustrate content and discussion, but it is not a purpose-built action system for assignment state, proof intake, or points/KPI readback.",
        recommendation:
          "Run the pilot student loop in myMEDLIFE and use Discourse only as a reference when copy or messaging needs comparison.",
        routeEvidence: [
          "/chapter",
          "/rush-month",
          "/rush-month/actions",
          "/rush-month/actions/member-push",
          "/rush-month/evidence",
        ],
      },
      {
        key: "leader_and_staff_ops",
        label: "Leader, coach, and staff operations",
        status: "pwa_leads",
        mymedlifePosture:
          "Chapter leaders, coaches, staff, and admins each have dedicated dashboards and review surfaces with different permissions and next actions.",
        discoursePosture:
          "Discourse is better for publishing updates than for multi-role operational control, chapter health review, or guarded approval flows.",
        recommendation:
          "Keep operational ownership in myMEDLIFE because the role split is already visible and extensible there.",
        routeEvidence: ["/chapter", "/coach", "/staff", "/admin"],
      },
      {
        key: "proof_points_audit",
        label: "Proof, points, KPI, and audit traceability",
        status: "pwa_leads",
        mymedlifePosture:
          "myMEDLIFE has typed proof packets, points/KPI ledger rows, integration readback, audit review, and write-readiness gates designed around feature traceability.",
        discoursePosture:
          "Discourse does not naturally provide append-only points/KPI ledgers, audit-first write promotion, or integration outbox review.",
        recommendation:
          "Use myMEDLIFE for any workflow that needs evidence, review, points, KPI, or audit history.",
        routeEvidence: [
          "/admin/proof-write",
          "/admin/integration-outbox",
          "/admin/audit-log",
          "/admin/release-readiness",
        ],
      },
      {
        key: "mobile_and_launch_safety",
        label: "Mobile/PWA readiness and launch safety",
        status: "pwa_leads",
        mymedlifePosture:
          "The app already includes an offline/PWA shell, route smoke plans, launch-gate review, database security review, and blocked live-write controls.",
        discoursePosture:
          "Discourse can be viewed on mobile, but it is not being developed here as the installable chapter operating system or guarded launch surface.",
        recommendation:
          "Take mobile pilot and launch-safety reviews through myMEDLIFE, then use Discourse only as a comparison artifact if stakeholders ask.",
        routeEvidence: ["/offline", "/admin/design-qa", "/admin/launch-gate", "/admin/database-security"],
      },
      {
        key: "community_and_reference_content",
        label: "Reference content and community context",
        status: "reference_only",
        mymedlifePosture:
          "myMEDLIFE focuses on chapter operations, readiness, and review flows instead of long-form discussion or community-thread patterns.",
        discoursePosture:
          "Discourse still has value as a familiar prototype/reference layer for announcements, examples, and broad content inspection.",
        recommendation:
          "Keep Discourse available as reference content, but do not let it own operational truth or pilot workflows.",
        routeEvidence: ["/admin/review-path", "/admin/nick-review"],
      },
      {
        key: "pilot_confirmation",
        label: "Pilot confirmation step",
        status: "needs_pilot_confirmation",
        mymedlifePosture:
          "The architecture and review surfaces point clearly toward myMEDLIFE, but the team still needs a one-chapter pilot to validate real-user ergonomics.",
        discoursePosture:
          "Discourse remains useful as a comparison baseline during the pilot, especially if the team wants to sanity-check clarity and onboarding copy.",
        recommendation:
          "Before broad rollout, run the one-chapter pilot in myMEDLIFE and use Discourse only to pressure-test communication patterns, not operations.",
        routeEvidence: ["/admin/staff-dry-run", "/admin/pilot-scope", "/admin/nick-review"],
      },
    ],
    nextSteps: [
      "Keep Discourse reference-only in documentation and launch calls.",
      "Run the staff dry run and one-chapter pilot against myMEDLIFE routes, not Discourse routes.",
      "Do not promote live writes or integrations until the Phase 2 security gates are complete.",
    ],
  };
}
