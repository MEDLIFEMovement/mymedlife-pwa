import { createHash } from "node:crypto";

import type { StaffAdminProofRehearsalReviewNote } from "./staff-admin-proof-rehearsal-review-note.ts";

export type StaffAdminProofRehearsalReviewNoteManifest = {
  kind: "staff-admin-test-rehearsal-review-note-manifest";
  isTestOnly: true;
  productionEvidenceBlocked: true;
  reviewNoteTitle: string;
  reviewNoteChecksum: string;
  reviewNoteFixturePath: string;
  routeTargets: string[];
  snapshotSummary: {
    ready: boolean;
    staffRows: number;
    adminRows: number;
    passedRows: number;
    failedRows: number;
  };
};

export function buildStaffAdminProofRehearsalReviewNoteManifest(
  note: StaffAdminProofRehearsalReviewNote,
  reviewNoteFixturePath = "tests/fixtures/staff-admin-proof-rehearsal-review-note.test.md",
): StaffAdminProofRehearsalReviewNoteManifest {
  return {
    kind: "staff-admin-test-rehearsal-review-note-manifest",
    isTestOnly: true,
    productionEvidenceBlocked: true,
    reviewNoteTitle: note.title,
    reviewNoteChecksum: checksum(note.markdown),
    reviewNoteFixturePath,
    routeTargets: [...note.routeTargets],
    snapshotSummary: {
      ready: note.browserSnapshot.summary.ready,
      staffRows: note.browserSnapshot.summary.staffRows,
      adminRows: note.browserSnapshot.summary.adminRows,
      passedRows: note.browserSnapshot.summary.passedRows,
      failedRows: note.browserSnapshot.summary.failedRows,
    },
  };
}

export function validateStaffAdminProofRehearsalReviewNoteManifest(
  manifest: StaffAdminProofRehearsalReviewNoteManifest,
  note: StaffAdminProofRehearsalReviewNote,
) {
  const expected = buildStaffAdminProofRehearsalReviewNoteManifest(note);
  const checks = [
    {
      key: "kind",
      passed: manifest.kind === expected.kind,
      message: "The manifest must stay scoped to the TEST rehearsal note.",
    },
    {
      key: "test_only_boundary",
      passed: manifest.isTestOnly === true && manifest.productionEvidenceBlocked === true,
      message: "The manifest must remain TEST-only and block production evidence.",
    },
    {
      key: "title",
      passed: manifest.reviewNoteTitle === expected.reviewNoteTitle,
      message: "The manifest title must match the reviewer note title.",
    },
    {
      key: "fixture_path",
      passed: manifest.reviewNoteFixturePath === expected.reviewNoteFixturePath,
      message: "The manifest must point at the reviewer-note fixture path.",
    },
    {
      key: "checksum",
      passed: manifest.reviewNoteChecksum === expected.reviewNoteChecksum,
      message: "The manifest checksum must match the reviewer note markdown.",
    },
    {
      key: "route_targets",
      passed: sameItems(manifest.routeTargets, expected.routeTargets),
      message: "The manifest route targets must match the reviewer note route targets.",
    },
    {
      key: "snapshot_summary",
      passed:
        manifest.snapshotSummary.ready === expected.snapshotSummary.ready &&
        manifest.snapshotSummary.staffRows === expected.snapshotSummary.staffRows &&
        manifest.snapshotSummary.adminRows === expected.snapshotSummary.adminRows &&
        manifest.snapshotSummary.passedRows === expected.snapshotSummary.passedRows &&
        manifest.snapshotSummary.failedRows === expected.snapshotSummary.failedRows,
      message: "The manifest snapshot summary must match the reviewer note snapshot summary.",
    },
  ];

  return {
    ready: checks.every((check) => check.passed),
    checks,
  };
}

export function formatStaffAdminProofRehearsalReviewNoteManifestSummary(
  manifest: StaffAdminProofRehearsalReviewNoteManifest,
): string {
  return [
    `kind=${manifest.kind}`,
    `isTestOnly=${manifest.isTestOnly}`,
    `productionEvidenceBlocked=${manifest.productionEvidenceBlocked}`,
    `reviewNoteTitle=${manifest.reviewNoteTitle}`,
    `reviewNoteFixturePath=${manifest.reviewNoteFixturePath}`,
    `reviewNoteChecksum=${manifest.reviewNoteChecksum}`,
    `routeTargets=${manifest.routeTargets.join(",")}`,
    `ready=${manifest.snapshotSummary.ready}`,
    `staffRows=${manifest.snapshotSummary.staffRows}`,
    `adminRows=${manifest.snapshotSummary.adminRows}`,
    `passedRows=${manifest.snapshotSummary.passedRows}`,
    `failedRows=${manifest.snapshotSummary.failedRows}`,
  ].join("\n");
}

export function formatStaffAdminProofRehearsalReviewNoteManifest(
  manifest: StaffAdminProofRehearsalReviewNoteManifest,
): string {
  return JSON.stringify(manifest, null, 2);
}

function checksum(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

function sameItems(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
