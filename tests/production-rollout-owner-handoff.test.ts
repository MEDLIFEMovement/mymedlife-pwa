import { describe, expect, it } from "vitest";
import {
  getProductionRolloutOwnerHandoff,
} from "@/services/production-rollout-owner-handoff";

describe("production rollout owner handoff", () => {
  it("creates a complete local handoff kit for owner data collection", () => {
    const handoff = getProductionRolloutOwnerHandoff({
      outputDirectoryName: "production-rollout-owner-handoff",
      statusOptions: {
        minimumChapterCount: 2,
        minimumStudentMembershipCount: 3,
        minimumPilotChapterCount: 1,
      },
    });
    const filePaths = handoff.files.map((file) => file.path);
    const index = getFile(handoff.files, "README.md");
    const status = getFile(
      handoff.files,
      "production-rollout-owner-packet-status.md",
    );
    const nickRequest = getFile(
      handoff.files,
      "production-rollout-owner-requests/nick-hq-launch-owner.md",
    );
    const nickEmailDraft = getFile(
      handoff.files,
      "production-rollout-owner-email-drafts/nick-hq-launch-owner.md",
    );
    const sendTracker = getFile(
      handoff.files,
      "production-rollout-owner-send-tracker/owner-send-tracker.csv",
    );

    expect(handoff.ready).toBe(false);
    expect(handoff.status.readyOwnerCount).toBe(0);
    expect(filePaths).toContain("rollout-owner-packets/README.md");
    expect(filePaths).toContain("rollout-owner-packets/ds-launch-owner/users.csv");
    expect(filePaths).toContain(
      "production-rollout-owner-requests/ds-launch-owner.md",
    );
    expect(filePaths).toContain(
      "production-rollout-owner-email-drafts/ds-launch-owner.md",
    );
    expect(filePaths).toContain(
      "production-rollout-owner-send-tracker/owner-send-tracker.csv",
    );
    expect(filePaths).toContain(
      "production-rollout-owner-send-tracker/owner-recipient-assignments.csv",
    );
    expect(index).toContain("myMEDLIFE 30-Chapter Owner Handoff Kit: NOT READY");
    expect(index).toContain("owner progress: 0/7 owners ready");
    expect(index).toContain(
      "production-rollout-owner-email-drafts/: copy/paste email drafts",
    );
    expect(index).toContain(
      "production-rollout-owner-send-tracker/: manual send/return tracker",
    );
    expect(index).toContain(
      "collect the Copy/Paste Answer Block in `owner-recipient-answers.txt`",
    );
    expect(index).toContain(
      "pnpm rollout:owner-recipient-answers",
    );
    expect(index).toContain(
      "pnpm rollout:owner-handoff --out production-rollout-owner-handoff",
    );
    expect(index).toContain("pnpm rollout:owner-email-drafts");
    expect(index).toContain("pnpm rollout:owner-send-tracker");
    expect(index).toContain("--recipient-assignments");
    expect(index).toContain("pnpm rollout:owner-recipients");
    expect(index).toContain("pnpm rollout:owner-followup");
    expect(index).toContain("It does not create users, write Supabase rows");
    expect(status).toContain("myMEDLIFE owner packet status: NOT READY");
    expect(status).toContain("Owner progress: 0/7 owners ready");
    expect(nickRequest).toContain("| chapters.csv | 0 | 2 | ready | NOT READY |");
    expect(nickEmailDraft).toContain(
      "Subject: myMEDLIFE rollout data request - Nick / HQ launch owner",
    );
    expect(sendTracker).toContain(
      "nick-hq-launch-owner,Nick / HQ launch owner,no,2",
    );
    expect(getFile(handoff.files, "rollout-owner-packets/luma-ds-owner/luma-calendars.csv")).toBe(
      "chapterId,calendarId,calendarName,status\n",
    );
    expect(handoff.files.map((file) => file.content).join("\n")).not.toContain(
      "student@example.com",
    );
    expect(handoff.files.map((file) => file.content).join("\n")).not.toContain(
      "password,",
    );
  });
});

function getFile(
  files: ReturnType<typeof getProductionRolloutOwnerHandoff>["files"],
  path: string,
) {
  const file = files.find((candidate) => candidate.path === path);

  if (!file) {
    throw new Error(`Missing generated handoff file ${path}.`);
  }

  return file.content;
}
