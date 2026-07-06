import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { productionRolloutCsvTemplates } from "@/services/production-rollout-csv-templates";

describe("production rollout data collection doc", () => {
  const doc = readFileSync(
    join(process.cwd(), "docs/production-rollout-data-collection.md"),
    "utf8",
  );

  it("names every required CSV template", () => {
    for (const template of productionRolloutCsvTemplates) {
      expect(doc).toContain(`\`${template.filename}\``);
    }
  });

  it("keeps launch safety boundaries visible", () => {
    expect(doc).toContain("Do not put passwords, API keys, tokens, secrets");
    expect(doc).toContain("External writes remain off");
    expect(doc).toContain("This packet does not apply data by itself");
  });

  it("gives reviewers copy-ready source sheet headers", () => {
    expect(doc).toContain("## Fast Intake Sheet Headers");
    expect(doc).toContain(
      "email,displayName,chapterId,roleKey,status,chapterName",
    );
    expect(doc).toContain(
      "chapterId,chapterName,campus,region,coachEmail,coachType,calendarId,calendarName,campaignName,campaignSlug",
    );
    expect(doc).toContain(
      "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditRecorded,zeroExternalSends,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail,status,notes",
    );
    expect(doc).toContain("email,workspace,observedPath,status,checkedAt,notes");
    expect(doc).toContain("email,ownerType,displayName,status");
  });

  it("points reviewers to the build, validation, handoff, and launch checks", () => {
    expect(doc).toContain("pnpm rollout:build");
    expect(doc).toContain("pnpm rollout:chapter-matrix --dir rollout-csv");
    expect(doc).toContain("pnpm rollout:check production-rollout-packet.json");
    expect(doc).toContain("pnpm rollout:handoff production-rollout-packet.json");
    expect(doc).toContain("pnpm production:launch-check --packet");
    expect(doc).toContain("pnpm production:data-counts > production-live-data-counts.txt");
    expect(doc).toContain("pnpm production:signed-in-route-proof --packet");
    expect(doc).toContain("pnpm rollout:approval-summary production-rollout-packet.json");
    expect(doc).toContain("--live-data-counts production-live-data-counts.txt");
    expect(doc).toContain("500 approved memberships");
    expect(doc).toContain("5 production Luma event links");
    expect(doc).toContain("The `support` owner must have an active `coach`, `admin`, or `super_admin`");
    expect(doc).toContain("The `rollback` and `production_apply` owners must have active `ds_admin` or");
    expect(doc).toContain("the `support` owner must have passed route");
    expect(doc).toContain("the `rollback` and `production_apply`");
  });
});
