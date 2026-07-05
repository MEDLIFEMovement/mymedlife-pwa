import { describe, expect, it } from "vitest";
import {
  getProductionRolloutCsvTemplateContent,
  getProductionRolloutCsvTemplateReadme,
  productionRolloutCsvTemplates,
} from "@/services/production-rollout-csv-templates";

describe("production rollout CSV templates", () => {
  it("provides the files required by the rollout builder", () => {
    expect(productionRolloutCsvTemplates.map((template) => template.filename)).toEqual([
      "chapters.csv",
      "users.csv",
      "memberships.csv",
      "staff-roles.csv",
      "coach-assignments.csv",
      "campaigns.csv",
      "luma-calendars.csv",
      "pilot-event-proof.csv",
      "launch-owners.csv",
      "signed-in-route-proof.csv",
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
      "chapterId,calendarId,calendarName,status\n",
      "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditEvidence,outboxStatus,status,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail,notes\n",
      "email,ownerType,displayName,status\n",
      "email,workspace,expectedPath,observedPath,status,checkedAt,notes\n",
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

    expect(readme).toContain(
      "pnpm rollout:workbook --out production-rollout-workbook.md --csv-dir rollout-csv",
    );
    expect(readme).toContain("pnpm rollout:check-csv --dir rollout-csv");
    expect(readme).toContain("pnpm rollout:build");
    expect(readme).toContain("--chapters rollout-csv/chapters.csv");
    expect(readme).toContain("--luma-calendars rollout-csv/luma-calendars.csv");
    expect(readme).toContain("--pilot-event-proof rollout-csv/pilot-event-proof.csv");
    expect(readme).toContain("--launch-owners rollout-csv/launch-owners.csv");
    expect(readme).toContain("--signed-in-route-proof rollout-csv/signed-in-route-proof.csv");
    expect(readme).toContain("pnpm rollout:check production-rollout-packet.json");
    expect(readme).toContain("The first rollout requires at least 500 approved student/leader users.");
    expect(readme).toContain("reviewer, timestamp, and app proof routes");
    expect(readme).toContain("The support owner needs an active coach, admin, or super_admin staff role");
    expect(readme).toContain("The rollback and production apply owners need an active ds_admin or super_admin staff role");
    expect(readme).toContain("add passed signed-in route proof");
    expect(readme).toContain("The first rollout requires at least 30 active chapters.");
  });

  it("keeps nested output paths intact in generated reviewer commands", () => {
    const readme = getProductionRolloutCsvTemplateReadme(
      ".codex-artifacts/production-rollout-csv",
    );

    expect(readme).toContain(
      "pnpm rollout:check-csv --dir .codex-artifacts/production-rollout-csv",
    );
    expect(readme).toContain(
      "pnpm rollout:workbook --out production-rollout-workbook.md --csv-dir .codex-artifacts/production-rollout-csv",
    );
    expect(readme).toContain(
      "--chapters .codex-artifacts/production-rollout-csv/chapters.csv",
    );
    expect(readme).toContain(
      "--signed-in-route-proof .codex-artifacts/production-rollout-csv/signed-in-route-proof.csv",
    );
  });
});
