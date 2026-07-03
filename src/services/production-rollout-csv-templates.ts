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
    "  --out production-rollout-packet.json",
    "```",
    "",
    "```bash",
    "pnpm rollout:check production-rollout-packet.json",
    "```",
    "",
    "Rules:",
    "- Use real user emails only.",
    "- Do not add passwords, tokens, API keys, secrets, or helper columns.",
    "- Keep headers exactly as generated.",
    "- Every active chapter needs at least one approved leader, one active coach assignment, and one active campaign.",
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
