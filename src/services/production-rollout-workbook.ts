import {
  productionRolloutCsvTemplates,
  type ProductionRolloutCsvTemplate,
} from "./production-rollout-csv-templates.ts";

export type ProductionRolloutWorkbookSection = {
  filename: string;
  owner: string;
  purpose: string;
  requiredFor: string;
  headers: string[];
  allowedValues: string[];
  exampleRows: string[];
  checklist: string[];
};

type WorkbookMetadata = Omit<ProductionRolloutWorkbookSection, "headers">;

const metadataByFilename: Record<string, WorkbookMetadata> = {
  "chapters.csv": {
    filename: "chapters.csv",
    owner: "Nick / HQ launch owner",
    purpose: "Define the 30 chapters that are allowed into the first production rollout.",
    requiredFor: "30-chapter packet, Luma mappings, coach coverage, campaigns, and invite batches.",
    allowedValues: ["status: active, inactive, archived"],
    exampleRows: [
      "<chapter-id>,<chapter-name>,<campus-name>,<region>,active",
    ],
    checklist: [
      "Use stable IDs such as chapter-ucla or chapter-boston-college.",
      "Include exactly the chapters approved for this launch wave.",
      "Do not include test chapters or placeholder campus names.",
    ],
  },
  "users.csv": {
    filename: "users.csv",
    owner: "Launch owner / DS",
    purpose: "List every person who needs an account or role in the launch packet.",
    requiredFor: "Auth user creation, memberships, staff roles, launch owners, and route proof.",
    allowedValues: ["No role values in this file; roles live in memberships.csv and staff-roles.csv."],
    exampleRows: [
      "<person-email>,<display-name>",
    ],
    checklist: [
      "Use real MEDLIFE-managed or approved user emails only.",
      "Include students, student leaders, coaches, admins, DS admins, and launch owners.",
      "Do not include passwords, temporary passwords, tokens, or API keys.",
    ],
  },
  "memberships.csv": {
    filename: "memberships.csv",
    owner: "Chapter launch owner",
    purpose: "Connect students and student leaders to their chapter and workspace role.",
    requiredFor: "Member app access, leader command center access, invite counts, points, and leaderboards.",
    allowedValues: [
      "roleKey: general_member, action_committee_member, action_committee_chair, e_board_member, president_vp",
      "status: requested, approved, rejected, inactive",
    ],
    exampleRows: [
      "<student-email>,<chapter-id>,general_member,approved",
      "<leader-email>,<chapter-id>,president_vp,approved",
    ],
    checklist: [
      "Every active chapter needs at least one approved member.",
      "Every active chapter needs at least one approved student leader.",
      "A student should not appear as approved in multiple launch chapters unless that is intentional and reviewed.",
    ],
  },
  "staff-roles.csv": {
    filename: "staff-roles.csv",
    owner: "DS / HQ launch owner",
    purpose: "Grant staff, coach, DS admin, and super admin workspace access.",
    requiredFor: "Staff command center, admin backend, support ownership, and signed-in route proof.",
    allowedValues: [
      "roleKey: coach, admin, ds_admin, super_admin",
      "status: active, inactive, ended",
    ],
    exampleRows: [
      "<coach-email>,coach,active",
      "<ds-admin-email>,ds_admin,active",
    ],
    checklist: [
      "Include at least one active coach, admin, and DS Admin or Super Admin.",
      "Do not use staff roles to give students chapter access; use memberships.csv for that.",
      "Keep Super Admin limited to the smallest necessary group.",
    ],
  },
  "coach-assignments.csv": {
    filename: "coach-assignments.csv",
    owner: "Sales / coaching lead",
    purpose: "Assign coach coverage to every launch chapter.",
    requiredFor: "Staff portfolio views, support escalation, and rollout accountability.",
    allowedValues: [
      "coachType: expansion, portfolio",
      "status: active, inactive, ended",
    ],
    exampleRows: [
      "<coach-email>,<chapter-id>,portfolio,active",
    ],
    checklist: [
      "Every active chapter needs one active coach assignment.",
      "Every coachEmail must also be listed in users.csv and have an active coach role in staff-roles.csv.",
      "Use portfolio for ongoing support unless the launch owner explicitly marks the chapter as expansion.",
    ],
  },
  "campaigns.csv": {
    filename: "campaigns.csv",
    owner: "Campaign / launch owner",
    purpose: "Activate the launch campaign for each chapter.",
    requiredFor: "Event/RSVP/attendance/points launch lane and campaign-specific leader surfaces.",
    allowedValues: [
      "status: draft, active, complete, archived",
    ],
    exampleRows: [
      "<chapter-id>,Rush Month,rush-month,active",
    ],
    checklist: [
      "Every active chapter needs one active launch campaign.",
      "Use a consistent slug for the first launch campaign unless DS approves a different convention.",
      "Keep non-launch campaigns out of the first 30-chapter packet.",
    ],
  },
  "luma-calendars.csv": {
    filename: "luma-calendars.csv",
    owner: "Luma / DS owner",
    purpose: "Map each chapter to the Luma calendar that owns its event lifecycle.",
    requiredFor: "Luma event readback, RSVP, attendance/check-in, points, and leaderboards.",
    allowedValues: [
      "status: linked, needs_setup, inactive",
    ],
    exampleRows: [
      "<chapter-id>,<luma-calendar-id>,<calendar-name>,linked",
    ],
    checklist: [
      "Every active chapter needs one linked Luma calendar.",
      "Use calendar IDs only; never paste a Luma API key, token, or secret.",
      "After approval, generate the runtime registry with pnpm rollout:luma-registry.",
    ],
  },
  "pilot-event-proof.csv": {
    filename: "pilot-event-proof.csv",
    owner: "Launch owner / DS",
    purpose: "Prove the first five chapters can complete the event, RSVP, attendance, points, audit, and outbox loop.",
    requiredFor: "Five-chapter proof and the final 30-chapter invite gate.",
    allowedValues: [
      "auditEvidence: recorded, missing",
      "outboxStatus: zero_sends, sends_detected, not_checked",
      "status: ready, needs_review, blocked",
    ],
    exampleRows: [
      "<chapter-id>,<event-name>,<luma-event-id>,12,10,10,recorded,zero_sends,ready,/app/events/<event-id>,/leader?view=events,/leader?view=leaderboard,/admin/audit-log,/admin/integration-outbox,<checked-at>,<reviewer-email>,<notes>",
    ],
    checklist: [
      "Record at least five ready pilot chapters before broad invites.",
      "Each ready row needs RSVP, attendance, points, audit, zero-send outbox, route links, reviewer, and timestamp evidence.",
      "Do not treat event visibility alone as event-loop proof.",
    ],
  },
  "launch-owners.csv": {
    filename: "launch-owners.csv",
    owner: "Nick / HQ launch owner",
    purpose: "Name the humans accountable for apply, support, rollback, and launch decisions.",
    requiredFor: "Invite gate, support readiness, and rollback readiness.",
    allowedValues: [
      "ownerType: production_apply, support, rollback, launch_decision",
      "status: active, backup, inactive",
    ],
    exampleRows: [
      "<owner-email>,support,<display-name>,active",
      "<owner-email>,rollback,<display-name>,active",
      "<owner-email>,production_apply,<display-name>,active",
    ],
    checklist: [
      "Required active owners: support, rollback, production_apply.",
      "Recommended active owner: launch_decision.",
      "Every owner email must also be listed in users.csv.",
      "Support owner needs an active coach, admin, or super_admin staff role.",
      "Rollback and production_apply owners need active ds_admin or super_admin staff roles.",
      "After production data is applied, support owner needs passed route proof for /staff?view=chapters.",
      "After production data is applied, rollback and production_apply owners need passed route proof for /admin.",
    ],
  },
  "signed-in-route-proof.csv": {
    filename: "signed-in-route-proof.csv",
    owner: "Launch owner / DS",
    purpose: "Record proof that real production accounts land in the correct workspaces.",
    requiredFor: "Final 30-chapter invite gate after production data is applied.",
    allowedValues: [
      "workspace: student_app, leader_command_center, staff_command_center, admin_backend",
      "status: passed, failed, not_checked",
    ],
    exampleRows: [
      "<member-email>,student_app,/app,/app,passed,<checked-at>,<notes>",
      "<leader-email>,leader_command_center,/leader?view=overview,/leader?view=overview,passed,<checked-at>,<notes>",
    ],
    checklist: [
      "Record one passed member, leader, staff, and admin route check.",
      "Use the named support owner for /staff?view=chapters proof where possible.",
      "Use the named rollback and production_apply owners for /admin proof.",
      "Use real production accounts after production data is applied.",
      "If a route fails, fix role data before inviting students.",
    ],
  },
};

export function getProductionRolloutWorkbook() {
  return productionRolloutCsvTemplates.map(toWorkbookSection);
}

export function formatProductionRolloutWorkbook(outputDirectoryName = "rollout-csv") {
  const sections = getProductionRolloutWorkbook();
  const lines = [
    "# myMEDLIFE 30-Chapter Production Rollout Workbook",
    "",
    "Use this workbook with the generated CSV templates. It is a human fill guide only; it does not create users, write Supabase rows, call Luma, send invites, or change production config.",
    "",
    "## Fill Order",
    "",
    "1. Fill chapters.csv.",
    "2. Fill users.csv.",
    "3. Fill memberships.csv, staff-roles.csv, coach-assignments.csv, campaigns.csv, and luma-calendars.csv.",
    "4. After the five-chapter pilot proof exists, fill pilot-event-proof.csv.",
    "5. Fill launch-owners.csv before any production apply or invite.",
    "6. After production data is applied, fill signed-in-route-proof.csv.",
    "",
    "## Fast Intake Sheet Headers",
    "",
    "Use these exact headers if the rollout data is collected in Google Sheets before it is converted into packet-ready CSV files. Keep the sheets free of passwords, tokens, API keys, private notes, and fake/sample rows.",
    "",
    "Roster sheet:",
    "```text",
    "email,displayName,chapterId,roleKey,status,chapterName",
    "```",
    "",
    "Chapter setup sheet:",
    "```text",
    "chapterId,chapterName,campus,region,coachEmail,coachType,calendarId,calendarName,campaignName,campaignSlug",
    "```",
    "",
    "Five-chapter pilot event-loop proof sheet:",
    "```text",
    "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditRecorded,zeroExternalSends,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail,status,notes",
    "```",
    "",
    "Production signed-in route proof sheet:",
    "```text",
    "email,workspace,observedPath,status,checkedAt,notes",
    "```",
    "",
    "Launch owner sheet:",
    "```text",
    "email,ownerType,displayName,status",
    "```",
    "",
    "## Validation Sequence",
    "",
    "```bash",
    "pnpm rollout:owner-handoff --out production-rollout-owner-handoff",
    "pnpm rollout:owner-packets --out rollout-owner-packets",
    "pnpm rollout:owner-status --owner-dir rollout-owner-packets --out production-rollout-owner-packet-status.md",
    "pnpm rollout:owner-requests --owner-dir rollout-owner-packets --out production-rollout-owner-requests",
    "pnpm rollout:owner-email-drafts --owner-dir rollout-owner-packets --out production-rollout-owner-email-drafts",
    "pnpm rollout:owner-send-tracker --owner-dir rollout-owner-packets --out production-rollout-owner-send-tracker",
    "pnpm rollout:owner-recipient-decisions --owner-dir rollout-owner-packets --recipient-assignments production-rollout-owner-send-tracker/owner-recipient-assignments.csv --out production-rollout-owner-recipient-decisions.md",
    "pnpm rollout:owner-recipients --owner-dir rollout-owner-packets --recipient-assignments production-rollout-owner-send-tracker/owner-recipient-assignments.csv --out production-rollout-owner-recipient-status.md",
    "pnpm rollout:owner-send-tracker --owner-dir rollout-owner-packets --out production-rollout-owner-send-tracker --recipient-assignments production-rollout-owner-send-tracker/owner-recipient-assignments.csv",
    "pnpm rollout:owner-followup --owner-dir rollout-owner-packets --tracker production-rollout-owner-send-tracker/owner-send-tracker.csv --out production-rollout-owner-followup-report.md",
    `pnpm rollout:assemble-owner-packets --owner-dir rollout-owner-packets --out ${outputDirectoryName}`,
    `pnpm rollout:data-request --dir ${outputDirectoryName} --out production-rollout-data-request.md`,
    `pnpm rollout:check-csv --dir ${outputDirectoryName}`,
    "pnpm rollout:build \\",
    `  --chapters ${outputDirectoryName}/chapters.csv \\`,
    `  --users ${outputDirectoryName}/users.csv \\`,
    `  --memberships ${outputDirectoryName}/memberships.csv \\`,
    `  --staff-roles ${outputDirectoryName}/staff-roles.csv \\`,
    `  --coach-assignments ${outputDirectoryName}/coach-assignments.csv \\`,
    `  --campaigns ${outputDirectoryName}/campaigns.csv \\`,
    `  --luma-calendars ${outputDirectoryName}/luma-calendars.csv \\`,
    `  --pilot-event-proof ${outputDirectoryName}/pilot-event-proof.csv \\`,
    `  --launch-owners ${outputDirectoryName}/launch-owners.csv \\`,
    `  --signed-in-route-proof ${outputDirectoryName}/signed-in-route-proof.csv \\`,
    "  --out production-rollout-packet.json",
    "pnpm rollout:check production-rollout-packet.json",
    "pnpm rollout:gaps production-rollout-packet.json --out production-rollout-gaps.md",
    `pnpm rollout:chapter-matrix --dir ${outputDirectoryName} --out production-rollout-chapter-matrix.md`,
    "pnpm rollout:luma-mappings --packet production-rollout-packet.json",
    "pnpm production:pilot-event-proof --packet production-rollout-packet.json",
    "pnpm production:signed-in-route-proof --packet production-rollout-packet.json",
    "pnpm production:invite-batches --packet production-rollout-packet.json --out production-invite-batches.md",
    "pnpm rollout:approval-summary production-rollout-packet.json --out production-rollout-approval-summary.md",
    "```",
    "",
    "## Safety Rules",
    "",
    "- Use real, approved MEDLIFE rollout data only.",
    "- Do not add passwords, API keys, tokens, secrets, helper columns, or private notes.",
    "- Keep headers exactly as generated.",
    "- Do not send invitations until the final invite gate is ready.",
    "- Keep non-launch modules out of this packet.",
    "",
    ...sections.flatMap(formatWorkbookSection),
  ];

  return `${lines.join("\n")}\n`;
}

function toWorkbookSection(
  template: ProductionRolloutCsvTemplate,
): ProductionRolloutWorkbookSection {
  const metadata = metadataByFilename[template.filename];

  if (!metadata) {
    throw new Error(`Missing rollout workbook metadata for ${template.filename}.`);
  }

  return {
    ...metadata,
    headers: template.headers,
  };
}

function formatWorkbookSection(section: ProductionRolloutWorkbookSection) {
  return [
    `## ${section.filename}`,
    "",
    `Owner: ${section.owner}`,
    "",
    `Purpose: ${section.purpose}`,
    "",
    `Required for: ${section.requiredFor}`,
    "",
    "Headers:",
    `\`${section.headers.join(",")}\``,
    "",
    "Accepted values:",
    ...formatList(section.allowedValues),
    "",
    "Example row shape:",
    ...section.exampleRows.map((row) => `\`${row}\``),
    "",
    "Checklist:",
    ...formatList(section.checklist),
    "",
  ];
}

function formatList(items: string[]) {
  return items.map((item) => `- ${item}`);
}
