import { describe, expect, it } from "vitest";
import {
  formatProductionRolloutOwnerReturnIntake,
  getProductionRolloutOwnerReturnIntake,
  type ProductionRolloutOwnerReturnedFile,
} from "@/services/production-rollout-owner-return-intake";

describe("production rollout owner return intake", () => {
  it("marks valid returned owner CSVs ready to apply without exposing row values", () => {
    const intake = getProductionRolloutOwnerReturnIntake({
      returnedFiles: [
        file(
          "nick-hq-launch-owner",
          "chapters.csv",
          "id,name,campus,region,status\nchapter-ucla,UCLA MEDLIFE,UCLA,West,active\n",
        ),
      ],
      sourceDirectoryName: "returned-owner-packets",
      ownerDirectoryName: "rollout-owner-packets",
    });
    const report = formatProductionRolloutOwnerReturnIntake(intake);

    expect(intake.readyToApply).toBe(true);
    expect(intake.files).toEqual([
      {
        ownerSlug: "nick-hq-launch-owner",
        owner: "Nick / HQ launch owner",
        filename: "chapters.csv",
        targetPath: "rollout-owner-packets/nick-hq-launch-owner/chapters.csv",
        dataRowCount: 1,
      },
    ]);
    expect(report).toContain("myMEDLIFE returned owner CSV intake: READY TO APPLY");
    expect(report).toContain("1 data row(s)");
    expect(report).not.toContain("chapter-ucla");
    expect(report).toContain("It does not create users, write Supabase rows, call Luma");
  });

  it("shows applied mode after a safe apply run", () => {
    const intake = getProductionRolloutOwnerReturnIntake({
      returnedFiles: [
        file(
          "campaign-launch-owner",
          "campaigns.csv",
          "chapterId,name,slug,status\nchapter-ucla,Rush Month,rush-month-ucla,active\n",
        ),
      ],
      applied: true,
    });
    const report = formatProductionRolloutOwnerReturnIntake(intake);

    expect(intake.readyToApply).toBe(true);
    expect(intake.applied).toBe(true);
    expect(report).toContain("myMEDLIFE returned owner CSV intake: APPLIED");
    expect(report).toContain("Mode: APPLIED");
  });

  it("carries tracker paths into the next status commands", () => {
    const intake = getProductionRolloutOwnerReturnIntake({
      returnedFiles: [
        file(
          "campaign-launch-owner",
          "campaigns.csv",
          "chapterId,name,slug,status\nchapter-ucla,Rush Month,rush-month-ucla,active\n",
        ),
      ],
      ownerDirectoryName: "production-rollout-owner-handoff/rollout-owner-packets",
      recipientAssignmentsPath:
        "production-rollout-owner-handoff/production-rollout-owner-send-tracker/owner-recipient-assignments.csv",
      ownerSendTrackerPath:
        "production-rollout-owner-handoff/production-rollout-owner-send-tracker/owner-send-tracker.csv",
    });
    const report = formatProductionRolloutOwnerReturnIntake(intake);

    expect(report).toContain(
      "Owner recipient assignments: production-rollout-owner-handoff/production-rollout-owner-send-tracker/owner-recipient-assignments.csv",
    );
    expect(report).toContain(
      "Owner send tracker: production-rollout-owner-handoff/production-rollout-owner-send-tracker/owner-send-tracker.csv",
    );
    expect(intake.nextCommands).toContain(
      [
        "pnpm rollout:current-status --owner-dir production-rollout-owner-handoff/rollout-owner-packets",
        "--recipient-assignments production-rollout-owner-handoff/production-rollout-owner-send-tracker/owner-recipient-assignments.csv",
        "--owner-send-tracker production-rollout-owner-handoff/production-rollout-owner-send-tracker/owner-send-tracker.csv",
        "--out production-rollout-current-status.md",
      ].join(" "),
    );
    expect(report).not.toContain(
      "pnpm rollout:current-status --owner-dir production-rollout-owner-handoff/rollout-owner-packets --out production-rollout-current-status.md",
    );
  });

  it("blocks files returned under the wrong owner", () => {
    const intake = getProductionRolloutOwnerReturnIntake({
      returnedFiles: [
        file(
          "chapter-launch-owners",
          "users.csv",
          "email,displayName\nstudent@example.org,Student Example\n",
        ),
      ],
    });
    const report = formatProductionRolloutOwnerReturnIntake(intake);

    expect(intake.readyToApply).toBe(false);
    expect(report).toContain("users.csv belongs in ds-launch-owner, not chapter-launch-owners.");
  });

  it("blocks header-only returns and wrong headers", () => {
    const intake = getProductionRolloutOwnerReturnIntake({
      returnedFiles: [
        file("luma-ds-owner", "luma-calendars.csv", "chapterId,calendarId,calendarName,status\n"),
        file(
          "sales-coaching-lead",
          "coach-assignments.csv",
          "coachEmail,chapterId,status\ncoach@example.org,chapter-ucla,active\n",
        ),
      ],
    });
    const report = formatProductionRolloutOwnerReturnIntake(intake);

    expect(intake.readyToApply).toBe(false);
    expect(report).toContain("luma-ds-owner/luma-calendars.csv has no data rows.");
    expect(report).toContain(
      'sales-coaching-lead/coach-assignments.csv has header "coachEmail,chapterId,status"',
    );
  });

  it("blocks secret-like values in returned CSV files", () => {
    const intake = getProductionRolloutOwnerReturnIntake({
      returnedFiles: [
        file(
          "ds-launch-owner",
          "users.csv",
          "email,displayName\nstudent@example.org,Bearer abc123\n",
        ),
      ],
    });

    expect(intake.readyToApply).toBe(false);
    expect(intake.issues[0]?.message).toContain("appears to contain a bearer token");
  });

  it("blocks duplicate returned owner files", () => {
    const returnedFile = file(
      "launch-owner-ds",
      "pilot-event-proof.csv",
      "chapterId,eventName,lumaEventId,rsvpCount,attendanceCount,pointsAwardedCount,auditEvidence,outboxStatus,status,eventRoute,attendanceRoute,pointsRoute,auditRoute,outboxRoute,checkedAt,reviewedByEmail,notes\nchapter-ucla,Kickoff,evt-1,10,9,9,recorded,zero_sends,ready,/app/events/evt-1,/leader?view=events,/app/points,/admin/audit-log,/admin/integration-outbox,2026-07-06T09:00:00Z,coach@example.org,\n",
    );
    const intake = getProductionRolloutOwnerReturnIntake({
      returnedFiles: [returnedFile, returnedFile],
    });

    expect(intake.readyToApply).toBe(false);
    expect(intake.issues).toContainEqual({
      ownerSlug: "launch-owner-ds",
      filename: "pilot-event-proof.csv",
      message: "launch-owner-ds/pilot-event-proof.csv appears more than once in the returned packet.",
    });
  });
});

function file(
  ownerSlug: string,
  filename: string,
  content: string,
): ProductionRolloutOwnerReturnedFile {
  return {
    ownerSlug,
    filename,
    content,
  };
}
