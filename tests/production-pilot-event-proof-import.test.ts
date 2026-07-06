import { describe, expect, it } from "vitest";
import { buildProductionPilotEventProofImport } from "@/services/production-pilot-event-proof-import";
import { buildProductionRolloutPacketFromCsvTables } from "@/services/production-rollout-packet-builder";

describe("production pilot event proof import", () => {
  it("turns one reviewer evidence sheet into packet-ready pilot proof CSV", () => {
    const result = buildProductionPilotEventProofImport(
      [
        "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditRecorded,zeroExternalSends,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail,notes",
        "chapter-ucla,Rush Month Kickoff,evt-ucla-rush,18,15,15,yes,yes,/app/events/evt-ucla-rush,/leader?view=events&event=evt-ucla-rush,/leader?view=leaderboard&chapter=chapter-ucla,/admin/audit-log,/admin/integration-outbox,2026-07-05T15:00:00Z,Reviewer@medlifemovement.org,\"RSVP, attendance, points, audit, and zero-send proof verified\"",
      ].join("\n"),
    );

    expect(result.counts).toEqual({
      proofRows: 1,
      readyRows: 1,
      chapters: 1,
    });
    expect(result.pilotEventProofCsv).toBe(
      [
        "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditEvidence,outboxStatus,status,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail,notes",
        "chapter-ucla,Rush Month Kickoff,evt-ucla-rush,18,15,15,recorded,zero_sends,ready,/app/events/evt-ucla-rush,/leader?view=events&event=evt-ucla-rush,/leader?view=leaderboard&chapter=chapter-ucla,/admin/audit-log,/admin/integration-outbox,2026-07-05T15:00:00Z,reviewer@medlifemovement.org,\"RSVP, attendance, points, audit, and zero-send proof verified\"",
        "",
      ].join("\n"),
    );

    expect(() =>
      buildProductionRolloutPacketFromCsvTables({
        chapters: "id,name,campus,region,status\nchapter-ucla,UCLA MEDLIFE,UCLA,West,active\n",
        users:
          "email,displayName\nreviewer@medlifemovement.org,Launch Reviewer\n",
        memberships: "email,chapterId,roleKey,status\n",
        staffRoles: "email,roleKey,status\n",
        coachAssignments: "coachEmail,chapterId,coachType,status\n",
        campaigns: "chapterId,name,slug,status\n",
        lumaCalendars:
          "chapterId,calendarId,calendarName,status\nchapter-ucla,cal-ucla,UCLA Calendar,linked\n",
        pilotEventProof: result.pilotEventProofCsv,
        launchOwners: "email,ownerType,displayName,status\n",
        signedInRouteProof:
          "email,workspace,expectedPath,observedPath,status,checkedAt,notes\n",
      }),
    ).not.toThrow();
  });

  it("rejects ready proof that does not reconcile attendance points audit and sends", () => {
    expect(() =>
      buildProductionPilotEventProofImport(
        [
          "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditRecorded,zeroExternalSends,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail",
          "chapter-ucla,Rush Month Kickoff,evt-ucla-rush,10,9,8,no,no,/app/events/evt-ucla-rush,/leader?view=events,/leader?view=leaderboard,/admin/audit-log,/admin/integration-outbox,2026-07-05T15:00:00Z,reviewer@medlifemovement.org",
        ].join("\n"),
      ),
    ).toThrow(/pointsAwardedCount must match attendanceCount/);

    expect(() =>
      buildProductionPilotEventProofImport(
        [
          "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditRecorded,zeroExternalSends,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail",
          "chapter-ucla,Rush Month Kickoff,evt-ucla-rush,10,9,9,no,yes,/app/events/evt-ucla-rush,/leader?view=events,/leader?view=leaderboard,/admin/audit-log,/admin/integration-outbox,2026-07-05T15:00:00Z,reviewer@medlifemovement.org",
        ].join("\n"),
      ),
    ).toThrow(/auditRecorded is not yes/);

    expect(() =>
      buildProductionPilotEventProofImport(
        [
          "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditRecorded,zeroExternalSends,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail",
          "chapter-ucla,Rush Month Kickoff,evt-ucla-rush,10,9,9,yes,no,/app/events/evt-ucla-rush,/leader?view=events,/leader?view=leaderboard,/admin/audit-log,/admin/integration-outbox,2026-07-05T15:00:00Z,reviewer@medlifemovement.org",
        ].join("\n"),
      ),
    ).toThrow(/zeroExternalSends is not yes/);
  });

  it("rejects fake reviewer emails external routes and credential-looking evidence", () => {
    expect(() =>
      buildProductionPilotEventProofImport(
        [
          "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditRecorded,zeroExternalSends,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail",
          "chapter-ucla,Rush Month Kickoff,evt-ucla-rush,10,9,9,yes,yes,https://luma.com/evt-ucla,/leader?view=events,/leader?view=leaderboard,/admin/audit-log,/admin/integration-outbox,2026-07-05T15:00:00Z,reviewer@medlifemovement.org",
        ].join("\n"),
      ),
    ).toThrow(/must be an app route/);

    expect(() =>
      buildProductionPilotEventProofImport(
        [
          "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditRecorded,zeroExternalSends,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail",
          "chapter-ucla,Rush Month Kickoff,evt-ucla-rush,10,9,9,yes,yes,/app/events/evt-ucla-rush,/leader?view=events,/leader?view=leaderboard,/admin/audit-log,/admin/integration-outbox,2026-07-05T15:00:00Z,fake@example.com",
        ].join("\n"),
      ),
    ).toThrow(/test or placeholder email data/);

    expect(() =>
      buildProductionPilotEventProofImport(
        [
          "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditRecorded,zeroExternalSends,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail",
          "chapter-ucla,Rush Month Kickoff,sk_live_secret,10,9,9,yes,yes,/app/events/evt-ucla-rush,/leader?view=events,/leader?view=leaderboard,/admin/audit-log,/admin/integration-outbox,2026-07-05T15:00:00Z,reviewer@medlifemovement.org",
        ].join("\n"),
      ),
    ).toThrow(/credential/);
  });

  it("rejects preview local sandbox staging figma and setup-only pilot proof notes", () => {
    for (const note of [
      "Verified with preview-cookie role switch",
      "Local sandbox RSVP and attendance rehearsal only",
      "Copied from sandbox role exercise checklist",
      "Used localhost browser session",
      "Checked in staging.mymedlife.org",
      "Figma seed rehearsal row",
      "figma-sandbox-role-exercise output",
      "SOP sample evidence",
      "auth_profile_missing state confirmed",
    ]) {
      expect(() =>
        buildProductionPilotEventProofImport(
          [
            "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditRecorded,zeroExternalSends,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail,notes",
            `chapter-ucla,Rush Month Kickoff,evt-ucla-rush,10,9,9,yes,yes,/app/events/evt-ucla-rush,/leader?view=events,/leader?view=leaderboard,/admin/audit-log,/admin/integration-outbox,2026-07-05T15:00:00Z,reviewer@medlifemovement.org,${note}`,
          ].join("\n"),
        ),
      ).toThrow(/cannot count as approved production pilot proof/);
    }
  });
});
