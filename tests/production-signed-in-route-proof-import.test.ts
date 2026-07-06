import { describe, expect, it } from "vitest";
import { buildProductionRolloutPacketFromCsvTables } from "@/services/production-rollout-packet-builder";
import { buildProductionSignedInRouteProofImport } from "@/services/production-signed-in-route-proof-import";

describe("production signed-in route proof import", () => {
  it("turns one reviewer route sheet into packet-ready signed-in proof CSV", () => {
    const result = buildProductionSignedInRouteProofImport(
      [
        "email,workspace,observedPath,status,checkedAt,notes",
        "Member@medlifemovement.org,member,/app,passed,2026-07-05T15:00:00Z,Member reached student app",
        "Leader@medlifemovement.org,leader,/leader?view=overview,passed,2026-07-05T15:01:00Z,Leader reached command center",
        "Coach@medlifemovement.org,staff,/staff?view=chapters,passed,2026-07-05T15:02:00Z,Coach reached staff command center",
        "DS@medlifemovement.org,admin,/admin,passed,2026-07-05T15:03:00Z,DS reached admin backend",
      ].join("\n"),
    );

    expect(result.counts).toEqual({
      proofRows: 4,
      passedRows: 4,
      workspaces: 4,
    });
    expect(result.signedInRouteProofCsv).toBe(
      [
        "email,workspace,expectedPath,observedPath,status,checkedAt,notes",
        "member@medlifemovement.org,student_app,/app,/app,passed,2026-07-05T15:00:00Z,Member reached student app",
        "leader@medlifemovement.org,leader_command_center,/leader?view=overview,/leader?view=overview,passed,2026-07-05T15:01:00Z,Leader reached command center",
        "coach@medlifemovement.org,staff_command_center,/staff?view=chapters,/staff?view=chapters,passed,2026-07-05T15:02:00Z,Coach reached staff command center",
        "ds@medlifemovement.org,admin_backend,/admin,/admin,passed,2026-07-05T15:03:00Z,DS reached admin backend",
        "",
      ].join("\n"),
    );

    expect(() =>
      buildProductionRolloutPacketFromCsvTables({
        chapters: "id,name,campus,region,status\nchapter-ucla,UCLA MEDLIFE,UCLA,West,active\n",
        users: [
          "email,displayName",
          "member@medlifemovement.org,Launch Member",
          "leader@medlifemovement.org,Launch Leader",
          "coach@medlifemovement.org,Launch Coach",
          "ds@medlifemovement.org,DS Admin",
          "",
        ].join("\n"),
        memberships: [
          "email,chapterId,roleKey,status",
          "member@medlifemovement.org,chapter-ucla,general_member,approved",
          "leader@medlifemovement.org,chapter-ucla,president_vp,approved",
          "",
        ].join("\n"),
        staffRoles: [
          "email,roleKey,status",
          "coach@medlifemovement.org,coach,active",
          "ds@medlifemovement.org,ds_admin,active",
          "",
        ].join("\n"),
        coachAssignments: "coachEmail,chapterId,coachType,status\n",
        campaigns: "chapterId,name,slug,status\n",
        lumaCalendars: "chapterId,calendarId,calendarName,status\n",
        pilotEventProof:
          "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditEvidence,outboxStatus,status,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail,notes\n",
        launchOwners: "email,ownerType,displayName,status\n",
        signedInRouteProof: result.signedInRouteProofCsv,
      }),
    ).not.toThrow();
  });

  it("rejects passed proof when observed path does not match the workspace route", () => {
    expect(() =>
      buildProductionSignedInRouteProofImport(
        [
          "email,workspace,observedPath,status,checkedAt",
          "leader@medlifemovement.org,leader,/app,passed,2026-07-05T15:00:00Z",
        ].join("\n"),
      ),
    ).toThrow(/expected \/leader\?view=overview/);
  });

  it("allows failed proof to record the wrong observed route for diagnosis", () => {
    const result = buildProductionSignedInRouteProofImport(
      [
        "email,workspace,observedPath,status,checkedAt,notes",
        "leader@medlifemovement.org,leader,/app,failed,2026-07-05T15:00:00Z,Redirected to wrong workspace",
      ].join("\n"),
    );

    expect(result.signedInRouteProofCsv).toContain(
      "leader@medlifemovement.org,leader_command_center,/leader?view=overview,/app,failed",
    );
  });

  it("rejects fake emails external routes bad timestamps and credential-looking notes", () => {
    expect(() =>
      buildProductionSignedInRouteProofImport(
        [
          "email,workspace,observedPath,status,checkedAt",
          "fake@example.com,member,/app,passed,2026-07-05T15:00:00Z",
        ].join("\n"),
      ),
    ).toThrow(/test or placeholder email data/);

    expect(() =>
      buildProductionSignedInRouteProofImport(
        [
          "email,workspace,observedPath,status,checkedAt",
          "member@medlifemovement.org,member,https://www.mymedlife.org/app,passed,2026-07-05T15:00:00Z",
        ].join("\n"),
      ),
    ).toThrow(/must be an app route/);

    expect(() =>
      buildProductionSignedInRouteProofImport(
        [
          "email,workspace,observedPath,status,checkedAt",
          "member@medlifemovement.org,member,/app,passed,not-a-date",
        ].join("\n"),
      ),
    ).toThrow(/valid timestamp/);

    expect(() =>
      buildProductionSignedInRouteProofImport(
        [
          "email,workspace,observedPath,status,checkedAt,notes",
          "member@medlifemovement.org,member,/app,passed,2026-07-05T15:00:00Z,bearer token leaked",
        ].join("\n"),
      ),
    ).toThrow(/credential/);
  });

  it("rejects preview local sandbox staging figma and setup-only proof notes", () => {
    for (const note of [
      "Verified with preview-cookie role switch",
      "Local sandbox proof only",
      "Copied from sandbox role exercise checklist",
      "Used localhost browser session",
      "Checked in staging.mymedlife.org",
      "Figma seed rehearsal row",
      "figma-sandbox-role-exercise output",
      "SOP sample evidence",
      "auth_profile_missing state confirmed",
    ]) {
      expect(() =>
        buildProductionSignedInRouteProofImport(
          [
            "email,workspace,observedPath,status,checkedAt,notes",
            `member@medlifemovement.org,member,/app,passed,2026-07-05T15:00:00Z,${note}`,
          ].join("\n"),
        ),
      ).toThrow(/cannot count as approved production signed-in proof/);
    }
  });
});
