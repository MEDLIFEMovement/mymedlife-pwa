import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getAppRouteRegistry } from "@/services/app-route-registry";
import { getSltChecklistCompletionPacket } from "@/services/slt-checklist-completion-packet";
import { getSltPromotionCampaignPlan } from "@/services/slt-promotion-campaign";
import { getSltTripPrepStaffWorkspace } from "@/services/slt-trip-prep-staff-workspace";
import { getSltTripPrepWorkspace } from "@/services/slt-trip-prep-workspace";

export type SltPrepSafetyLane = {
  key:
    | "traveler_workspace"
    | "staff_dashboard"
    | "checklist_packet"
    | "traveler_profile_updates"
    | "scholarship_and_payments"
    | "forms_drive_and_provider_sync"
    | "meeting_and_notification_delivery"
    | "staff_review_and_approval"
    | "production_proof";
  label: string;
  route: string;
  status:
    | "read_only_preview"
    | "blocked_pending_future_lane";
  roleScope: readonly string[];
  requiredTables: readonly string[];
  requiredFlags: readonly string[];
  forbiddenSideEffects: readonly string[];
  plainEnglishRule: string;
};

export type SltPrepWriteSafetyContract = {
  title: string;
  summary: readonly string[];
  currentLocalWritePath: {
    exists: false;
    reason: string;
    candidateRoutes: readonly string[];
    candidateOperations: readonly string[];
  };
  currentPreviewEvidence: {
    travelerWorkspaceRoute: "/slt-prep";
    staffDashboardRoute: "/slt-prep/staff";
    checklistPacketRoute: "/admin/slt-checklist-write";
    travelerWorkspaceWritesExpected: 0;
    staffDashboardWritesExpected: 0;
    checklistPacketWritesExpected: 0;
    packetStatus: string;
  };
  globalGuards: readonly string[];
  requiredFoundations: readonly string[];
  lanes: readonly SltPrepSafetyLane[];
  validation: {
    ready: boolean;
    checks: Array<{
      key: string;
      passed: boolean;
      message: string;
    }>;
  };
};

const noWriteFlagsYet = [
  "No approved SLT Prep local write flag exists yet.",
  "No approved hosted staging or production SLT write gate exists yet.",
] as const;

const lanes = [
  {
    key: "traveler_workspace",
    label: "Traveler trip-prep workspace",
    route: "/slt-prep",
    status: "read_only_preview",
    roleScope: ["chapter_member", "chapter_leader", "coach", "admin", "super_admin"],
    requiredTables: ["traveler_profiles", "trip_checklist_items", "trip_forms", "trip_payments"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No checklist completion write.",
      "No traveler profile update.",
      "No payment write or scholarship decision.",
      "No provider sync or reminder delivery.",
    ],
    plainEnglishRule:
      "The traveler mobile SLT prep surface can preview trip-readiness truth, but it must not save forms, payments, profile, flight, or notification state until a dedicated server boundary exists.",
  },
  {
    key: "staff_dashboard",
    label: "Staff and coach traveler dashboard",
    route: "/slt-prep/staff",
    status: "read_only_preview",
    roleScope: ["coach", "admin", "super_admin"],
    requiredTables: ["traveler_profiles", "trip_checklist_items", "trip_support_notes"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No bulk follow-up save.",
      "No payment edit.",
      "No form reminder write.",
      "No meeting or notification send.",
    ],
    plainEnglishRule:
      "Staff can sort and rehearse traveler support decisions, but bulk actions remain previews only until audit, rollback, and role-safe server writes are reviewed.",
  },
  {
    key: "checklist_packet",
    label: "Admin SLT checklist completion packet",
    route: "/admin/slt-checklist-write",
    status: "read_only_preview",
    roleScope: ["admin", "ds_admin", "super_admin"],
    requiredTables: ["trip_checklist_items", "audit_logs", "internal_events"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No checklist status write.",
      "No audit row create from packet review alone.",
      "No provider or outbox send.",
      "No hidden browser mutation from preview=complete.",
    ],
    plainEnglishRule:
      "The checklist packet is a safety review surface only. It can preview one traveler-owned completion step and readiness delta, but it does not save the change.",
  },
  {
    key: "traveler_profile_updates",
    label: "Traveler profile and registration updates",
    route: "/slt-prep/profile",
    status: "blocked_pending_future_lane",
    roleScope: ["chapter_member", "admin", "super_admin"],
    requiredTables: ["traveler_profiles", "travel_documents", "emergency_contacts"],
    requiredFlags: noWriteFlagsYet,
    forbiddenSideEffects: [
      "No passport or emergency-contact write.",
      "No registration-state mutation.",
      "No direct browser save into traveler truth.",
      "No production proof claim from mock traveler rows.",
    ],
    plainEnglishRule:
      "Traveler profile and registration-looking controls stay blocked until a real traveler schema, auth-derived actor boundary, and audited save path exist.",
  },
  {
    key: "scholarship_and_payments",
    label: "Scholarship review and payment movement",
    route: "/slt-prep/payments",
    status: "blocked_pending_future_lane",
    roleScope: ["chapter_member", "admin", "super_admin"],
    requiredTables: ["trip_payment_ledgers", "scholarship_reviews", "audit_logs"],
    requiredFlags: noWriteFlagsYet,
    forbiddenSideEffects: [
      "No Shopify write.",
      "No scholarship approval or denial write.",
      "No balance change or payment-plan mutation.",
      "No fake finance proof from mock ledger rows.",
    ],
    plainEnglishRule:
      "Payment and scholarship surfaces can explain readiness, but no money-moving or approval behavior may appear live before a separate finance-safe boundary is approved.",
  },
  {
    key: "forms_drive_and_provider_sync",
    label: "Forms, Drive, HubSpot, Shopify, Luma, and Zoom sync",
    route: "/slt-prep/forms",
    status: "blocked_pending_future_lane",
    roleScope: ["chapter_member", "coach", "admin", "super_admin"],
    requiredTables: ["integration_events", "automation_outbox", "audit_logs"],
    requiredFlags: noWriteFlagsYet,
    forbiddenSideEffects: [
      "No Drive/Form write.",
      "No HubSpot sync.",
      "No Shopify sync.",
      "No Luma or Zoom mutation.",
      "No provider send or webhook execution.",
    ],
    plainEnglishRule:
      "Provider-looking SLT prep states remain mock references only. They must not imply real Forms, Drive, HubSpot, Shopify, Luma, or Zoom writes exist.",
  },
  {
    key: "meeting_and_notification_delivery",
    label: "Meetings, reminders, and traveler notifications",
    route: "/slt-prep/notifications",
    status: "blocked_pending_future_lane",
    roleScope: ["chapter_member", "coach", "admin", "super_admin"],
    requiredTables: ["automation_outbox", "message_templates", "meeting_rsvps"],
    requiredFlags: noWriteFlagsYet,
    forbiddenSideEffects: [
      "No reminder email, SMS, or push send.",
      "No Luma RSVP or Zoom meeting write.",
      "No n8n workflow execution.",
      "No fake notification delivery proof.",
    ],
    plainEnglishRule:
      "SLT reminder and notification language can stay visible, but actual delivery and meeting RSVP writes remain blocked until a dedicated communications lane is approved.",
  },
  {
    key: "staff_review_and_approval",
    label: "Staff traveler approval and checklist decisions",
    route: "/slt-prep/staff",
    status: "blocked_pending_future_lane",
    roleScope: ["coach", "admin", "super_admin"],
    requiredTables: ["trip_checklist_items", "trip_review_decisions", "audit_logs"],
    requiredFlags: noWriteFlagsYet,
    forbiddenSideEffects: [
      "No staff approval write.",
      "No checklist reopen or close write.",
      "No silent overwrite of traveler-owned state.",
      "No browser-only mock approval counted as real ops evidence.",
    ],
    plainEnglishRule:
      "Staff review can rehearse support decisions, but any real traveler approval or checklist mutation needs an audited server path and correction model first.",
  },
  {
    key: "production_proof",
    label: "Production proof posture",
    route: "/admin/slt-checklist-write",
    status: "blocked_pending_future_lane",
    roleScope: ["admin", "ds_admin", "super_admin"],
    requiredTables: ["trip_checklist_items", "audit_logs", "automation_outbox", "integration_events"],
    requiredFlags: [],
    forbiddenSideEffects: [
      "No Test/Figma/sandbox/SLT mock row counts as production proof.",
      "No localhost checklist packet screenshot counts as rollout evidence.",
      "No preview-safe traveler completion packet counts as provider, payment, or traveler-readiness proof.",
    ],
    plainEnglishRule:
      "Local SLT rehearsal stays useful for safety review only. It must not be copied into production signed-in proof, rollout packet evidence, or invite-gate truth.",
  },
] as const satisfies readonly SltPrepSafetyLane[];

export function getSltPrepWriteSafetyContract(): SltPrepWriteSafetyContract {
  const memberActor = getMockLocalActorContext("member.a@mymedlife.test");
  const coachActor = getMockLocalActorContext("coach@mymedlife.test");
  const adminActor = getMockLocalActorContext("admin@mymedlife.test");
  const dsAdminActor = getMockLocalActorContext("ds.admin@mymedlife.test");

  const travelerWorkspace = getSltTripPrepWorkspace(memberActor);
  const staffWorkspace = getSltTripPrepStaffWorkspace(coachActor);
  const packet = getSltChecklistCompletionPacket(adminActor);
  const dsAdminPacket = getSltChecklistCompletionPacket(dsAdminActor);
  const campaignPlan = getSltPromotionCampaignPlan(coachActor);
  const routeHrefs = new Set(getAppRouteRegistry().map((route) => route.href));

  const validationChecks = [
    {
      key: "traveler_workspace_zero_writes",
      passed:
        travelerWorkspace.canReadWorkspace &&
        travelerWorkspace.counts.browserWritesExpected === 0 &&
        travelerWorkspace.counts.externalWritesExpected === 0,
      message:
        "Traveler SLT prep stays readable while browser and external writes remain at zero.",
    },
    {
      key: "staff_dashboard_zero_writes",
      passed:
        staffWorkspace.canReadDashboard &&
        staffWorkspace.counts.browserWritesExpected === 0 &&
        staffWorkspace.counts.externalWritesExpected === 0,
      message:
        "Coach/staff traveler dashboard remains preview-only with no browser or provider writes.",
    },
    {
      key: "checklist_packet_zero_writes",
      passed:
        packet.canReadPacket &&
        packet.counts.browserWritesExpected === 0 &&
        packet.counts.externalWritesExpected === 0 &&
        packet.status === "evidence_observed",
      message:
        "The admin SLT checklist packet still previews one candidate completion without saving it.",
    },
    {
      key: "ds_admin_packet_not_operating_surface",
      passed:
        dsAdminPacket.canReadPacket &&
        dsAdminPacket.status === "evidence_observed" &&
        dsAdminPacket.verificationPacket.canPromoteToStagingReview,
      message:
        "DS Admin can inspect the SLT checklist packet as a safety surface, not as a traveler-operating write console.",
    },
    {
      key: "route_registry_covers_slt_prep_surfaces",
      passed:
        routeHrefs.has("/app/slt-prep") &&
        routeHrefs.has("/slt-prep") &&
        routeHrefs.has("/slt-prep/checklist") &&
        routeHrefs.has("/slt-prep/forms") &&
        routeHrefs.has("/slt-prep/payments") &&
        routeHrefs.has("/slt-prep/notifications") &&
        routeHrefs.has("/slt-prep/profile") &&
        routeHrefs.has("/slt-prep/staff") &&
        routeHrefs.has("/admin/slt-checklist-write"),
      message:
        "The visible SLT prep routes are registered, so the safety contract can pin their current posture explicitly.",
    },
    {
      key: "campaign_plan_keeps_provider_writes_off",
      passed:
        campaignPlan.canReadPlan &&
        campaignPlan.browserWritesExpected === 0 &&
        campaignPlan.externalWritesExpected === 0 &&
        campaignPlan.closeoutChecks.some((check) => check.includes("No deposit, reminder, CRM")),
      message:
        "The deeper SLT campaign planning layer still says deposits, reminders, and CRM/provider sends are off.",
    },
  ];

  return {
    title: "SLT Prep data/write safety contract: READ-ONLY readiness spec",
    summary: [
      "Current SLT Prep surfaces are honest preview and review aids only. They do not save traveler state, trigger provider syncs, or prove production readiness.",
      "There is no approved SLT Prep browser write, local server write, staged write, or production write path in the repo today.",
      "Checklist completion, traveler profile, scholarship review, payments, forms, Drive, HubSpot, Shopify, Luma, Zoom, staff approvals, reminders, and notifications all need separate audited boundaries before any control can become live.",
    ],
    currentLocalWritePath: {
      exists: false,
      reason:
        "No dedicated SLT Prep write schema or server action exists yet. Current repo behavior is limited to traveler/staff preview workspaces plus the admin checklist completion packet.",
      candidateRoutes: [
        "/slt-prep/checklist",
        "/slt-prep/profile",
        "/slt-prep/payments",
        "/slt-prep/notifications",
        "/admin/slt-checklist-write",
      ],
      candidateOperations: [
        "traveler_checklist_completion",
        "traveler_profile_update",
        "scholarship_decision",
        "trip_payment_update",
        "provider_sync_or_reminder_delivery",
      ],
    },
    currentPreviewEvidence: {
      travelerWorkspaceRoute: "/slt-prep",
      staffDashboardRoute: "/slt-prep/staff",
      checklistPacketRoute: "/admin/slt-checklist-write",
      travelerWorkspaceWritesExpected: 0,
      staffDashboardWritesExpected: 0,
      checklistPacketWritesExpected: 0,
      packetStatus: packet.status,
    },
    globalGuards: [
      "No fake trip registration, checklist completion, traveler profile update, scholarship decision, payment movement, provider sync, reminder delivery, or staff approval may be implied by current SLT preview surfaces.",
      "No Forms/Drive/HubSpot/Shopify/Luma/Zoom label may be treated as proof that a real provider write path exists.",
      "No Test/Figma/sandbox/SLT mock evidence may count as production proof, rollout evidence, or invite-gate truth.",
      "Hosted staging and hosted production SLT writes remain disabled until a future Coordinator-approved gate exists.",
    ],
    requiredFoundations: [
      "A real SLT traveler schema that splits traveler-owned, staff-owned, and system-owned fields.",
      "Server-only write boundaries that derive actor identity from auth/session context instead of client-provided role or email.",
      "Per-operation write flags for local/dev review and a separate hosted production-disable posture.",
      "Audit and internal-event readback for checklist completion, profile changes, scholarship/payment decisions, and staff review steps.",
      "Explicit outbox and provider boundaries for reminders, notifications, Forms/Drive, HubSpot, Shopify, Luma, and Zoom behavior.",
      "Correction, rollback, and stop rules so traveler state cannot be silently overwritten or reopened without audit evidence.",
    ],
    lanes,
    validation: {
      ready: validationChecks.every((check) => check.passed),
      checks: validationChecks,
    },
  };
}

export function formatSltPrepWriteSafetyContract(): string {
  const contract = getSltPrepWriteSafetyContract();

  return [
    contract.title,
    "",
    "Summary:",
    ...formatList(contract.summary),
    "",
    "Current local write path:",
    `- exists: ${contract.currentLocalWritePath.exists ? "yes" : "no"}`,
    `- reason: ${contract.currentLocalWritePath.reason}`,
    "- candidate routes:",
    ...formatNestedList(contract.currentLocalWritePath.candidateRoutes),
    "- candidate operations:",
    ...formatNestedList(contract.currentLocalWritePath.candidateOperations),
    "",
    "Current preview evidence:",
    `- traveler workspace route: ${contract.currentPreviewEvidence.travelerWorkspaceRoute}`,
    `- staff dashboard route: ${contract.currentPreviewEvidence.staffDashboardRoute}`,
    `- checklist packet route: ${contract.currentPreviewEvidence.checklistPacketRoute}`,
    `- traveler workspace writes expected: ${contract.currentPreviewEvidence.travelerWorkspaceWritesExpected}`,
    `- staff dashboard writes expected: ${contract.currentPreviewEvidence.staffDashboardWritesExpected}`,
    `- checklist packet writes expected: ${contract.currentPreviewEvidence.checklistPacketWritesExpected}`,
    `- checklist packet status: ${contract.currentPreviewEvidence.packetStatus}`,
    "",
    "Lanes:",
    ...contract.lanes.flatMap((lane) => [
      `- ${lane.label}`,
      `  - route: ${lane.route}`,
      `  - status: ${lane.status}`,
      `  - role scope: ${lane.roleScope.join(", ")}`,
      "  - required tables:",
      ...formatNestedList(lane.requiredTables),
      "  - required flags:",
      ...formatNestedList(lane.requiredFlags.length > 0 ? [...lane.requiredFlags] : ["none yet"]),
      "  - forbidden side effects:",
      ...formatNestedList(lane.forbiddenSideEffects),
      `  - rule: ${lane.plainEnglishRule}`,
    ]),
    "",
    "Global guards:",
    ...formatList(contract.globalGuards),
    "",
    "Required foundations:",
    ...formatList(contract.requiredFoundations),
    "",
    "Validation:",
    ...contract.validation.checks.map(
      (check) => `- ${check.passed ? "PASS" : "FAIL"} ${check.key}: ${check.message}`,
    ),
  ].join("\n");
}

function formatList(items: readonly string[]) {
  return items.map((item) => `- ${item}`);
}

function formatNestedList(items: readonly string[]) {
  return items.map((item) => `    - ${item}`);
}
