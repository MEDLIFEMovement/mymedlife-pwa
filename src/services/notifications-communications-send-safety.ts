import { getFeatureFlagDefinition } from "@/services/admin-rollout-controls-registry";

export type NotificationsSendSafetyStatus =
  | "preview_only"
  | "review_only"
  | "blocked";

export type NotificationsSendSafetySurface = {
  key:
    | "chapter_follow_up_affordances"
    | "campaign_comms_prompts"
    | "admin_outbox_review"
    | "n8n_execution"
    | "provider_delivery";
  label: string;
  status: NotificationsSendSafetyStatus;
  roleScope: string[];
  currentPosture: string;
  sourceOfTruth: string[];
  routeEvidence: string[];
  browserWritesExpected: 0;
  externalWritesExpected: 0;
  countsAsProductionProof: false;
  blockedUntil: string[];
};

export type NotificationsSendSafetyContract = {
  title: string;
  summary: string[];
  rolloutFlagPosture: {
    key: "n8n_send";
    label: string;
    approvalPolicy: "production_blocked";
    defaultEnabledByEnvironment: {
      local: false;
      staging: false;
      production: false;
    };
    description: string;
  };
  surfaces: NotificationsSendSafetySurface[];
  requiredFoundations: string[];
  globalGuards: string[];
  operatorStopConditions: string[];
};

export function getNotificationsSendSafetyContract(): NotificationsSendSafetyContract {
  const n8nSendFlag = getFeatureFlagDefinition("n8n_send");

  if (!n8nSendFlag) {
    throw new Error("Missing n8n_send rollout control definition.");
  }

  if (
    n8nSendFlag.approvalPolicy !== "production_blocked" ||
    n8nSendFlag.defaultEnabledByEnvironment.local ||
    n8nSendFlag.defaultEnabledByEnvironment.staging ||
    n8nSendFlag.defaultEnabledByEnvironment.production
  ) {
    throw new Error("n8n_send rollout control drifted away from the blocked default.");
  }

  return {
    title: "Notifications and communications send safety: REVIEW-ONLY READINESS SPEC",
    summary: [
      "This contract is read-only. It does not create users, write Supabase rows, send email or SMS, execute n8n workflows, or enable provider delivery.",
      "Current source only supports preview-only reminder/comms affordances plus admin review of disabled integration and outbox posture.",
      "Notification-looking controls, reminder copy, and outbox rows must stay clearly separate from real production communications proof until a future approved server boundary exists.",
    ],
    rolloutFlagPosture: {
      key: "n8n_send",
      label: n8nSendFlag.label,
      approvalPolicy: "production_blocked",
      defaultEnabledByEnvironment: {
        local: false,
        staging: false,
        production: false,
      },
      description: n8nSendFlag.description,
    },
    surfaces: [
      {
        key: "chapter_follow_up_affordances",
        label: "Chapter follow-up and reminder affordances",
        status: "preview_only",
        roleScope: ["chapter_leader", "coach", "admin", "super_admin"],
        currentPosture:
          "Leader follow-up stays read-only and explicitly reports reminderPosture=disabled with remindersEnabled=0.",
        sourceOfTruth: [
          "src/services/leader-follow-up-board.ts",
          "src/services/assignment-create-write.ts",
        ],
        routeEvidence: ["/leader?view=overview", "/rush-month/actions/[assignmentId]"],
        browserWritesExpected: 0,
        externalWritesExpected: 0,
        countsAsProductionProof: false,
        blockedUntil: [
          "A reviewed server-only notification write boundary exists.",
          "Reminder templates, recipient targeting, audit reasons, and rollback posture are defined.",
        ],
      },
      {
        key: "campaign_comms_prompts",
        label: "Campaign communication prompts",
        status: "preview_only",
        roleScope: ["chapter_leader", "coach", "admin", "super_admin"],
        currentPosture:
          "Campaign plans can describe SMS/email/n8n follow-up ideas, but the current source treats them as disabled outbox destinations and planning copy only.",
        sourceOfTruth: [
          "src/services/chapter-engagement-campaign.ts",
          "src/services/mvp-coverage-checklist.ts",
        ],
        routeEvidence: ["/campaigns/chapter-engagement", "/admin/integration-outbox"],
        browserWritesExpected: 0,
        externalWritesExpected: 0,
        countsAsProductionProof: false,
        blockedUntil: [
          "A real communications schema and recipient model exist.",
          "Provider-specific stop, retry, and rollback rules are approved.",
        ],
      },
      {
        key: "admin_outbox_review",
        label: "Admin integration/outbox communications review",
        status: "review_only",
        roleScope: ["admin", "ds_admin", "super_admin"],
        currentPosture:
          "Admins can inspect structured integration events, disabled outbox rows, and live-send preflight evidence without unlocking sends, payload editing, retries, or secret access.",
        sourceOfTruth: [
          "src/services/admin-integration-outbox-workspace.ts",
          "src/services/integration-contract-review.ts",
        ],
        routeEvidence: ["/admin/integration-outbox", "/admin"],
        browserWritesExpected: 0,
        externalWritesExpected: 0,
        countsAsProductionProof: false,
        blockedUntil: [
          "A dedicated communications send contract and rollback drill are approved.",
          "Hosted staging and hosted production continue to hard-block send execution by default.",
        ],
      },
      {
        key: "n8n_execution",
        label: "n8n workflow execution",
        status: "blocked",
        roleScope: ["admin", "ds_admin", "super_admin"],
        currentPosture:
          "The n8n_send rollout control exists only as a production-blocked future gate. It is off by default in local, staging, and production.",
        sourceOfTruth: [
          "src/services/admin-rollout-controls-registry.ts",
          "src/services/admin-integration-outbox-workspace.ts",
        ],
        routeEvidence: ["/admin/integration-outbox", "/admin"],
        browserWritesExpected: 0,
        externalWritesExpected: 0,
        countsAsProductionProof: false,
        blockedUntil: [
          "Coordinator approves a hosted send gate with rollback and stop conditions.",
          "n8n payload idempotency, retry, failure, and audit readback are proven outside local/Test evidence.",
        ],
      },
      {
        key: "provider_delivery",
        label: "Email, SMS, push, and other provider delivery",
        status: "blocked",
        roleScope: ["admin", "ds_admin", "super_admin"],
        currentPosture:
          "No approved browser-facing or server-only delivery path exists for email, SMS, push, or reminder sends. Fake delivery, fake reminders, fake ownership transfer, fake points side effects, and fake invite side effects remain forbidden.",
        sourceOfTruth: [
          "src/services/chapter-engagement-campaign.ts",
          "src/services/mvp-coverage-checklist.ts",
          "src/services/admin-rollout-controls-registry.ts",
        ],
        routeEvidence: ["/admin/integration-outbox", "/campaigns/chapter-engagement"],
        browserWritesExpected: 0,
        externalWritesExpected: 0,
        countsAsProductionProof: false,
        blockedUntil: [
          "An audited send-attempt model, provider boundary, and delivery readback exist.",
          "DS/admin approve production-hosted send posture and explicit rollback ownership.",
        ],
      },
    ],
    requiredFoundations: [
      "A server-only communications write boundary with explicit local/dev and hosted-production gates.",
      "A message/template schema, recipient-targeting model, and send-attempt audit/readback model.",
      "Outbox idempotency, stop/rollback rules, and human-owned recovery for failed or partial sends.",
      "Role gates proving member, leader, staff, and admin cannot turn preview text into live delivery from browser controls.",
      "Operator proof that local/Test/Figma/sandbox rows stay excluded from production signed-in proof, rollout packet evidence, and invite-gate decisions.",
    ],
    globalGuards: [
      "Preview-cookie, localhost, local sandbox, Test/Figma, SOP/sample, and staging evidence do not count as production communications proof.",
      "Disabled or mocked outbox rows are review evidence only; they are not approval to deliver email, SMS, push, reminders, or n8n workflows.",
      "No current lane may claim real notification delivery, staff/leader ownership transfer, points awards, invite side effects, or provider sends from this contract.",
      "Hosted staging and hosted production sends stay disabled until a future Coordinator-approved gate exists.",
    ],
    operatorStopConditions: [
      "Stop if a reviewer starts treating local/Test zero-send posture as production proof.",
      "Stop if any browser control implies an email/SMS/push send happened without matching audited server readback.",
      "Stop if n8n_send, provider delivery, or retry controls appear enabled outside an approved hosted gate review.",
      "Stop if reminder, invite, points, or ownership-transfer side effects appear tied to notification preview copy.",
    ],
  };
}

export function formatNotificationsSendSafetyContract(
  contract: NotificationsSendSafetyContract,
): string {
  return [
    contract.title,
    "",
    "Summary:",
    ...formatList(contract.summary),
    "",
    "Rollout flag posture:",
    `- ${contract.rolloutFlagPosture.key}: ${contract.rolloutFlagPosture.label}`,
    `  - approval policy: ${contract.rolloutFlagPosture.approvalPolicy}`,
    `  - defaults: local=${String(contract.rolloutFlagPosture.defaultEnabledByEnvironment.local)}, staging=${String(contract.rolloutFlagPosture.defaultEnabledByEnvironment.staging)}, production=${String(contract.rolloutFlagPosture.defaultEnabledByEnvironment.production)}`,
    `  - description: ${contract.rolloutFlagPosture.description}`,
    "",
    "Surfaces:",
    ...contract.surfaces.flatMap((surface) => [
      `- ${surface.label}`,
      `  - status: ${surface.status}`,
      `  - role scope: ${surface.roleScope.join(", ")}`,
      `  - production proof: ${surface.countsAsProductionProof ? "allowed" : "blocked"}`,
      `  - posture: ${surface.currentPosture}`,
      `  - routes: ${surface.routeEvidence.join(", ")}`,
      "  - source of truth:",
      ...formatNestedList(surface.sourceOfTruth),
      "  - blocked until:",
      ...formatNestedList(surface.blockedUntil),
    ]),
    "",
    "Required foundations:",
    ...formatList(contract.requiredFoundations),
    "",
    "Global guards:",
    ...formatList(contract.globalGuards),
    "",
    "Operator stop conditions:",
    ...formatList(contract.operatorStopConditions),
  ].join("\n");
}

function formatList(items: string[]) {
  return items.map((item) => `- ${item}`);
}

function formatNestedList(items: string[]) {
  return items.map((item) => `    - ${item}`);
}
