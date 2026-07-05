export type ProductionRolloutCsvTemplate = {
  filename: string;
  description: string;
  headers: string[];
};

export const productionRolloutCsvTemplates: ProductionRolloutCsvTemplate[] = [
  {
    filename: "chapters.csv",
    description: "One row per launch chapter.",
    headers: ["id", "name", "campus", "region", "status"],
  },
  {
    filename: "users.csv",
    description: "One row per student, leader, coach, admin, or DS user.",
    headers: ["email", "displayName"],
  },
  {
    filename: "memberships.csv",
    description: "One row per user-to-chapter membership.",
    headers: ["email", "chapterId", "roleKey", "status"],
  },
  {
    filename: "staff-roles.csv",
    description: "One row per staff/admin role.",
    headers: ["email", "roleKey", "status"],
  },
  {
    filename: "coach-assignments.csv",
    description: "One row per coach-to-chapter assignment.",
    headers: ["coachEmail", "chapterId", "coachType", "status"],
  },
  {
    filename: "campaigns.csv",
    description: "One row per chapter launch campaign.",
    headers: ["chapterId", "name", "slug", "status"],
  },
  {
    filename: "luma-calendars.csv",
    description: "One row per chapter-to-Luma calendar mapping.",
    headers: ["chapterId", "calendarId", "calendarName", "status"],
  },
  {
    filename: "pilot-event-proof.csv",
    description: "One row per pilot chapter proving RSVP, attendance, points, audit, and outbox state.",
    headers: [
      "chapterId",
      "eventName",
      "lumaEventId",
      "rsvpCount",
      "attendanceCount",
      "pointsAwardedCount",
      "auditEvidence",
      "outboxStatus",
      "status",
      "eventRoute",
      "attendanceRoute",
      "pointsRoute",
      "auditRoute",
      "outboxRoute",
      "checkedAt",
      "reviewedByEmail",
      "notes",
    ],
  },
  {
    filename: "launch-owners.csv",
    description: "One row per named owner for production apply, support, rollback, and launch decisions.",
    headers: ["email", "ownerType", "displayName", "status"],
  },
  {
    filename: "signed-in-route-proof.csv",
    description: "One row per real signed-in route check for member, leader, staff, and admin accounts.",
    headers: [
      "email",
      "workspace",
      "expectedPath",
      "observedPath",
      "status",
      "checkedAt",
      "notes",
    ],
  },
];

export function getProductionRolloutCsvTemplateContent(
  template: ProductionRolloutCsvTemplate,
) {
  return `${template.headers.join(",")}\n`;
}

export function getProductionRolloutCsvTemplateReadme(outputDirectoryName = "rollout-csv") {
  const lines = [
    "# myMEDLIFE Production Rollout CSV Templates",
    "",
    "Fill these files with real MEDLIFE launch data.",
    "",
    "For a plain-English fill guide with owners, accepted values, examples, and the validation sequence, run:",
    "",
    "```bash",
    `pnpm rollout:workbook --out production-rollout-workbook.md --csv-dir ${outputDirectoryName}`,
    "```",
    "",
    "While filling the CSVs, get a plain count-based intake status:",
    "",
    "```bash",
    `pnpm rollout:intake-status --dir ${outputDirectoryName}`,
    "```",
    "",
    "From the repo root, validate the filled CSV folder before building a JSON packet:",
    "",
    "```bash",
    `pnpm rollout:check-csv --dir ${outputDirectoryName}`,
    "```",
    "",
    "When the CSV folder is ready, build and check the JSON packet:",
    "",
    "```bash",
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
    "```",
    "",
    "```bash",
    "pnpm rollout:check production-rollout-packet.json",
    "```",
    "",
    "Rules:",
    "- Use real user emails only.",
    "- Do not use placeholder values such as <chapter name>, TODO, TBD, PLACEHOLDER, example.com, .test, or mymedlife.test.",
    "- Do not add passwords, tokens, API keys, secrets, or helper columns.",
    "- Keep headers exactly as generated.",
    "- The first rollout requires at least 500 approved student/leader users.",
    "- Every active chapter needs at least one approved leader, one active coach assignment, and one active campaign.",
    "- Every active chapter needs a linked Luma calendar mapping.",
    "- At least 5 pilot chapters need ready event-loop proof: RSVP, attendance, points, audit, zero external sends, reviewer, timestamp, and app proof routes.",
    "- Name active support, rollback, and production apply owners before inviting chapters.",
    "- After production data is applied, add passed signed-in route proof for one member, one leader, one staff user, and one admin.",
    "- The first rollout requires at least 30 active chapters.",
    "",
    "Files:",
    ...productionRolloutCsvTemplates.map(
      (template) =>
        `- ${template.filename}: ${template.description} Headers: ${template.headers.join(",")}`,
    ),
    "",
  ];

  return lines.join("\n");
}
