import type { DraftLiveContentStatus } from "./draft-live-content-safety.ts";

export type SopTemplateApprovalStateReadiness = {
  state: DraftLiveContentStatus;
  label: string;
  canAffectLiveBehavior: boolean;
  countsAsRolloutEvidence: boolean;
  approvals: string[];
  evidence: string[];
  blockedUntil: string[];
};

export type SopTemplateApprovalReadinessReport = {
  title: string;
  summary: string[];
  states: SopTemplateApprovalStateReadiness[];
  globalGuards: string[];
  operatorChecks: string[];
};

const stateDefinitions: SopTemplateApprovalStateReadiness[] = [
  {
    state: "draft",
    label: "Draft template or SOP",
    canAffectLiveBehavior: false,
    countsAsRolloutEvidence: false,
    approvals: [
      "Content owner can draft locally or in sandbox only.",
      "Move to reviewed only after owner confirms the content is no longer placeholder or sample text.",
    ],
    evidence: [
      "Must stay marked draft and remain outside launch-lane runtime behavior.",
      "Must remain excluded from production rollout packets and signed-in proof evidence.",
    ],
    blockedUntil: [
      "Explicit human review removes placeholder, sample, or SOP-draft language.",
      "DS/admin approval path is defined before any attempt to schedule or publish.",
    ],
  },
  {
    state: "reviewed",
    label: "Reviewed but not scheduled",
    canAffectLiveBehavior: false,
    countsAsRolloutEvidence: false,
    approvals: [
      "Content owner confirms the record is real candidate content, not Figma/Test/sample material.",
      "DS/admin still must approve before any scheduled or live use.",
    ],
    evidence: [
      "Review note should identify who reviewed it and when.",
      "Launch packet, invite gate, and signed-in proof must still ignore it.",
    ],
    blockedUntil: [
      "DS/admin names the promotion owner.",
      "Any live routing or automation dependency is still disabled or absent.",
    ],
  },
  {
    state: "scheduled",
    label: "Scheduled for future publication",
    canAffectLiveBehavior: false,
    countsAsRolloutEvidence: false,
    approvals: [
      "DS/admin approves the planned promotion window.",
      "Content owner and DS/admin agree what separate activation step would make it live.",
    ],
    evidence: [
      "State alone is not activation proof.",
      "There must be evidence that member/leader/staff/admin live shells still behave as if the content is off.",
    ],
    blockedUntil: [
      "A separate live activation path exists and is approved.",
      "A reviewer can show the content is still excluded from rollout evidence and live routing.",
    ],
  },
  {
    state: "live",
    label: "Live production content",
    canAffectLiveBehavior: true,
    countsAsRolloutEvidence: false,
    approvals: [
      "Explicit DS/admin approval is required before a template or SOP can become live.",
      "Content owner confirms the final live record is real production content, not copied sample material.",
      "Launch owner confirms the content is outside the current rollout evidence lane unless a future lane explicitly adds it.",
    ],
    evidence: [
      "Live promotion must be documented separately from rollout packet assembly.",
      "The live record must no longer carry draft/template/sample/SOP markers.",
    ],
    blockedUntil: [
      "The repo has an approved activation path beyond this report.",
      "Any external writes or workflow side effects remain separately approved and off by default.",
    ],
  },
  {
    state: "archived",
    label: "Archived or retired content",
    canAffectLiveBehavior: false,
    countsAsRolloutEvidence: false,
    approvals: [
      "Content owner or DS/admin can archive once the record should no longer participate in active workflows.",
    ],
    evidence: [
      "Archived content stays out of launch behavior and rollout evidence.",
      "Archived rows should remain auditable but not routable into live launch flows.",
    ],
    blockedUntil: [
      "Any reactivation would need a fresh DS/admin review instead of silently reusing the archived row.",
    ],
  },
];

export function getSopTemplateApprovalReadinessReport(): SopTemplateApprovalReadinessReport {
  return {
    title: "SOP/template approval readiness: REVIEW-ONLY SAFETY SPEC",
    summary: [
      "This report is read-only. It does not create users, write Supabase rows, send invites, call providers, or enable live SOP behavior.",
      "Its purpose is to keep draft/template/SOP/sample content separate from launch-lane behavior until a future approved activation path exists.",
      "Draft, reviewed, scheduled, live, and archived need different operator expectations, but only explicit DS/admin approval can move content toward live behavior.",
    ],
    states: stateDefinitions,
    globalGuards: [
      "Draft/template/SOP/sample markers do not count as production rollout evidence.",
      "Preview-cookie, localhost, local sandbox, Test/Figma, staging, and sample screenshots do not count as proof that SOP content is production-live.",
      "No state other than live may affect member, leader, staff, or admin live behavior.",
      "Even live content stays outside the current rollout packet and signed-in proof lanes unless a future approved lane explicitly includes it.",
      "Any future live activation must keep external writes, invites, and provider side effects off by default until separately approved.",
    ],
    operatorChecks: [
      "Confirm the record still carries an honest state: draft, reviewed, scheduled, live, or archived.",
      "Confirm the record is not using Test/Figma/sample/SOP placeholder content as if it were real launch content.",
      "Confirm production rollout packet, signed-in route proof, and invite-gate evidence remain unchanged by this content.",
      "Confirm DS/admin approval is named before any record is treated as schedulable or live.",
      "Confirm any future live activation path is reviewed as a separate launch-lane decision, not hidden inside template ingestion.",
    ],
  };
}

export function formatSopTemplateApprovalReadinessReport(
  report: SopTemplateApprovalReadinessReport,
): string {
  return [
    report.title,
    "",
    "Summary:",
    ...formatList(report.summary),
    "",
    "State expectations:",
    ...report.states.flatMap((state) => [
      `- ${state.state.toUpperCase()} ${state.label}`,
      `  - can affect live behavior: ${state.canAffectLiveBehavior ? "yes" : "no"}`,
      `  - counts as rollout evidence: ${state.countsAsRolloutEvidence ? "yes" : "no"}`,
      "  - approvals:",
      ...formatNestedList(state.approvals),
      "  - evidence:",
      ...formatNestedList(state.evidence),
      "  - blocked until:",
      ...formatNestedList(state.blockedUntil),
    ]),
    "",
    "Global guards:",
    ...formatList(report.globalGuards),
    "",
    "Operator checks:",
    ...formatList(report.operatorChecks),
  ].join("\n");
}

function formatList(items: string[]) {
  return items.map((item) => `- ${item}`);
}

function formatNestedList(items: string[]) {
  return items.map((item) => `    - ${item}`);
}
