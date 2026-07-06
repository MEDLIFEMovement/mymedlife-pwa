import { describe, expect, it } from "vitest";
import {
  formatProductionRolloutWorkbook,
  getProductionRolloutWorkbook,
} from "@/services/production-rollout-workbook";
import { productionRolloutCsvTemplates } from "@/services/production-rollout-csv-templates";

describe("production rollout workbook", () => {
  it("covers every generated CSV template in order", () => {
    expect(getProductionRolloutWorkbook().map((section) => section.filename)).toEqual(
      productionRolloutCsvTemplates.map((template) => template.filename),
    );
  });

  it("documents accepted values and validation commands without fake launch rows", () => {
    const workbook = formatProductionRolloutWorkbook("rollout-csv");

    expect(workbook).toContain("# myMEDLIFE 30-Chapter Production Rollout Workbook");
    expect(workbook).toContain("pnpm rollout:owner-packets --out rollout-owner-packets");
    expect(workbook).toContain(
      "pnpm rollout:data-request --dir rollout-csv --out production-rollout-data-request.md",
    );
    expect(workbook).toContain("pnpm rollout:check-csv --dir rollout-csv");
    expect(workbook).toContain("pnpm rollout:gaps production-rollout-packet.json");
    expect(workbook).toContain("pnpm rollout:chapter-matrix --dir rollout-csv");
    expect(workbook).toContain("pnpm rollout:approval-summary production-rollout-packet.json");
    expect(workbook).toContain("pnpm production:invite-batches --packet production-rollout-packet.json");
    expect(workbook).toContain("roleKey: general_member, action_committee_member, action_committee_chair, e_board_member, president_vp");
    expect(workbook).toContain("ownerType: production_apply, support, rollback, launch_decision");
    expect(workbook).toContain("Support owner needs an active coach, admin, or super_admin staff role.");
    expect(workbook).toContain("Rollback and production_apply owners need active ds_admin or super_admin staff roles.");
    expect(workbook).toContain("support owner needs passed route proof for /staff?view=chapters");
    expect(workbook).toContain("rollback and production_apply owners need passed route proof for /admin");
    expect(workbook).toContain("workspace: student_app, leader_command_center, staff_command_center, admin_backend");
    expect(workbook).toContain("<student-email>,<chapter-id>,general_member,approved");
    expect(workbook).not.toContain("member.001@medlifemovement.org");
    expect(workbook).not.toContain("test@example.com");
  });

  it("keeps credential-like fields out of workbook headers", () => {
    const workbook = getProductionRolloutWorkbook();
    const headers = workbook.flatMap((section) => section.headers);

    expect(headers).not.toEqual(
      expect.arrayContaining(["password", "token", "secret", "apiKey", "api_key"]),
    );
  });
});
