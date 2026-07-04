import { describe, expect, it } from "vitest";

import {
  buildTestProductionCleanupSql,
  buildTestProductionSeedSql,
  getTestProductionSeedEnvironment,
  getTestProductionSeedSummary,
  validateTestProductionSeedEnvironment,
} from "@/services/test-production-seed-environment";

describe("test production seed environment", () => {
  it("creates the seven requested Test chapters with distinct scenarios", () => {
    const environment = getTestProductionSeedEnvironment();

    expect(environment.rows.chapters.map((chapter) => chapter.name)).toEqual([
      "Test Boston University",
      "Test Boston College",
      "Test Duke",
      "Test McGill",
      "Test New York University",
      "Test UCLA",
      "Test University of Texas",
    ]);
    expect(new Set(environment.chapterScenarios.map((chapter) => chapter.scenario)).size).toBe(7);
  });

  it("uses only Test-prefixed visible names and fake example.com logins", () => {
    const environment = getTestProductionSeedEnvironment();
    const visibleValues = [
      ...environment.rows.profiles.map((row) => row.display_name),
      ...environment.rows.chapters.map((row) => row.name),
      ...environment.rows.actionCommittees.map((row) => row.name),
      ...environment.rows.assignments.map((row) => row.title),
      ...environment.rows.chapterEvents.map((row) => row.title),
      ...environment.rows.evidenceItems.map((row) => row.summary),
      ...environment.rows.pointsEvents.map((row) => row.reason),
    ];

    expect(visibleValues.every((value) => value.startsWith("Test"))).toBe(true);
    expect(
      environment.rows.authUsers.every(
        (user) => user.email.startsWith("test.") && user.email.endsWith("@example.com"),
      ),
    ).toBe(true);
  });

  it("covers roles, task states, evidence states, and disabled external posture", () => {
    const environment = getTestProductionSeedEnvironment();
    const loginRoles = new Set(environment.logins.map((login) => login.role));
    const assignmentStatuses = new Set(environment.rows.assignments.map((row) => row.status));
    const evidenceStatuses = new Set(environment.rows.evidenceItems.map((row) => row.status));

    for (const role of [
      "general_member",
      "president_vp",
      "coach",
      "admin",
      "ds_admin",
      "super_admin",
    ]) {
      expect(loginRoles.has(role)).toBe(true);
    }
    expect([...assignmentStatuses]).toEqual(
      expect.arrayContaining([
        "not_started",
        "in_progress",
        "submitted",
        "approved",
        "changes_requested",
      ]),
    );
    expect([...evidenceStatuses]).toEqual(
      expect.arrayContaining(["pending_review", "approved", "rejected", "changes_requested"]),
    );
    expect(environment.rows.automationOutbox.every((row) => row.status === "disabled")).toBe(true);
  });

  it("validates the packet and emits idempotent seed plus scoped cleanup SQL", () => {
    const environment = getTestProductionSeedEnvironment();
    const validation = validateTestProductionSeedEnvironment(environment);
    const seedSql = buildTestProductionSeedSql(environment);
    const cleanupSql = buildTestProductionCleanupSql(environment);

    expect(validation.ready).toBe(true);
    expect(seedSql).toContain("insert into auth.users");
    expect(seedSql).toContain("insert into auth.identities");
    expect(seedSql).toContain("on conflict (id) do update");
    expect(seedSql).toContain("test_production_v1");
    expect(cleanupSql).toContain("email like 'test.%@example.com'");
    expect(cleanupSql).toContain("name like 'Test %'");
    expect(cleanupSql).toContain("display_name like 'Test %'");
  });

  it("summarizes enough data to populate major app surfaces", () => {
    const summary = getTestProductionSeedSummary();

    expect(summary).toMatchObject({
      chapters: 7,
      staffUsers: 7,
    });
    expect(summary.users).toBeGreaterThan(60);
    expect(summary.committees).toBeGreaterThan(25);
    expect(summary.assignments).toBeGreaterThanOrEqual(35);
    expect(summary.evidenceItems).toBeGreaterThanOrEqual(21);
    expect(summary.events).toBeGreaterThanOrEqual(14);
    expect(summary.pointsEvents).toBeGreaterThanOrEqual(35);
    expect(summary.auditLogs).toBeGreaterThanOrEqual(14);
  });
});
