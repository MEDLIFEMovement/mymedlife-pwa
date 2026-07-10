import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import type { StaffAdminProofRehearsalReviewNoteManifest } from "./staff-admin-proof-rehearsal-review-note-manifest.ts";

export type StaffAdminProofRehearsalArtifactRoundTripPaths = {
  reviewNotePath: string;
  manifestPath: string;
};

export type StaffAdminProofRehearsalArtifactRoundTripVerification = {
  ready: boolean;
  checks: Array<{
    key: string;
    passed: boolean;
    message: string;
  }>;
  summary: {
    reviewNoteChecksum: string;
    reviewNoteFixturePath: string;
    routeTargets: string[];
  };
};

export async function verifyStaffAdminProofRehearsalArtifactRoundTripFromDisk(
  paths: StaffAdminProofRehearsalArtifactRoundTripPaths,
): Promise<StaffAdminProofRehearsalArtifactRoundTripVerification> {
  const [reviewNoteMarkdown, manifestJson] = await Promise.all([
    readFile(paths.reviewNotePath, "utf8"),
    readFile(paths.manifestPath, "utf8"),
  ]);

  const manifest = JSON.parse(manifestJson) as StaffAdminProofRehearsalReviewNoteManifest;
  const normalizedReviewNoteMarkdown = trimSingleTrailingNewline(reviewNoteMarkdown);
  const reviewNoteChecksum = checksum(normalizedReviewNoteMarkdown);
  const checks = [
    {
      key: "manifest_kind",
      passed: manifest.kind === "staff-admin-test-rehearsal-review-note-manifest",
      message: "The manifest must stay scoped to the TEST rehearsal review note artifact.",
    },
    {
      key: "test_only_boundary",
      passed: manifest.isTestOnly === true && manifest.productionEvidenceBlocked === true,
      message: "The manifest must remain TEST-only and block production evidence.",
    },
    {
      key: "checksum_matches_note",
      passed: manifest.reviewNoteChecksum === reviewNoteChecksum,
      message: "The manifest checksum must match the on-disk reviewer note contents.",
    },
    {
      key: "fixture_path_is_present",
      passed: manifest.reviewNoteFixturePath.length > 0,
      message: "The manifest must keep the reviewer-note fixture path visible.",
    },
    {
      key: "route_targets_are_stable",
      passed:
        sameItems(manifest.routeTargets, [
          "/staff?view=chapters",
          "/admin",
          "/app",
        ]),
      message: "The manifest route targets must stay pinned to the TEST rehearsal boundary.",
    },
    {
      key: "note_is_test_only",
      passed:
        normalizedReviewNoteMarkdown.includes("TEST rehearsal reviewer note") &&
        normalizedReviewNoteMarkdown.includes("TEST-only rehearsal output") &&
        normalizedReviewNoteMarkdown.includes("Blocked from production proof"),
      message: "The on-disk reviewer note must keep the TEST-only boundary explicit.",
    },
  ];

  return {
    ready: checks.every((check) => check.passed),
    checks,
    summary: {
      reviewNoteChecksum,
      reviewNoteFixturePath: manifest.reviewNoteFixturePath,
      routeTargets: [...manifest.routeTargets],
    },
  };
}

function checksum(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

function sameItems(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function trimSingleTrailingNewline(content: string) {
  return content.replace(/\r?\n$/, "");
}
