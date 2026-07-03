import { describe, expect, it } from "vitest";
import {
  getProductionRolloutCsvTemplateContent,
  getProductionRolloutCsvTemplateReadme,
  productionRolloutCsvTemplates,
} from "@/services/production-rollout-csv-templates";

describe("production rollout CSV templates", () => {
  it("provides the six files required by the rollout builder", () => {
    expect(productionRolloutCsvTemplates.map((template) => template.filename)).toEqual([
      "chapters.csv",
      "users.csv",
      "memberships.csv",
      "staff-roles.csv",
      "coach-assignments.csv",
      "campaigns.csv",
    ]);
  });

  it("generates header-only CSV content without fake launch rows", () => {
    expect(
      productionRolloutCsvTemplates.map((template) =>
        getProductionRolloutCsvTemplateContent(template),
      ),
    ).toEqual([
      "id,name,campus,region,status\n",
      "email,displayName\n",
      "email,chapterId,roleKey,status\n",
      "email,roleKey,status\n",
      "coachEmail,chapterId,coachType,status\n",
      "chapterId,name,slug,status\n",
    ]);
  });

  it("keeps credential-like columns out of every generated template", () => {
    const forbidden = ["password", "token", "secret", "apiKey", "api_key"];
    const allHeaders = productionRolloutCsvTemplates.flatMap(
      (template) => template.headers,
    );

    expect(allHeaders.some((header) => forbidden.includes(header))).toBe(false);
  });

  it("documents the build and check commands for launch reviewers", () => {
    const readme = getProductionRolloutCsvTemplateReadme("rollout-csv");

    expect(readme).toContain("pnpm rollout:check-csv --dir rollout-csv");
    expect(readme).toContain("pnpm rollout:build");
    expect(readme).toContain("--chapters rollout-csv/chapters.csv");
    expect(readme).toContain("pnpm rollout:check production-rollout-packet.json");
    expect(readme).toContain("The first rollout requires at least 30 active chapters.");
  });
});
