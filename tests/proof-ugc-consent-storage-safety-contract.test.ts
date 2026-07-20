import { describe, expect, it } from "vitest";

import {
  formatProofUgcConsentStorageSafetyContract,
  getProofUgcConsentStorageSafetyContract,
} from "@/services/proof-ugc-consent-storage-safety-contract";

describe("proof / evidence / UGC consent and storage safety contract", () => {
  it("keeps review routes non-publishing while allowing the gated private upload lane", () => {
    const contract = getProofUgcConsentStorageSafetyContract();

    expect(contract.currentPrivateWritePath).toMatchObject({
      exists: true,
      route: "/proof-library/upload",
      serverActions: [
        "preparePrivateProofUploadForSupabase",
        "recordPrivateProofUploadForSupabase",
        "discardPreparedPrivateProofUploadForSupabase",
        "removePrivateProofUploadForSupabase",
      ],
    });
    expect(contract.validation.ready).toBe(true);
    expect(contract.validation.checks.every((check) => check.passed)).toBe(true);
    expect(contract.lanes.find((lane) => lane.key === "evidence_submission_queue"))
      .toMatchObject({
        route: "/rush-month/evidence",
        status: "read_only_preview",
      });
    expect(
      contract.lanes.find((lane) => lane.key === "private_proof_upload"),
    ).toMatchObject({
      route: "/proof-library/upload",
      status: "implemented_private_write",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "proof_sharing_review"),
    ).toMatchObject({
      route: "/proof-library",
      status: "read_only_preview",
    });
  });

  it("pins blocked future lanes for UGC publishing, moderation, campaign exports, and production-proof drift", () => {
    const contract = getProofUgcConsentStorageSafetyContract();

    expect(
      contract.lanes.find((lane) => lane.key === "ugc_embed_and_social_links")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No arbitrary HTML embed.",
        "No fake social-post completion evidence.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "coach_notes_and_moderation")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No coach-note persistence.",
        "No moderation approval write.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "campaign_proof_handoff_and_exports")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No warehouse or Power BI export.",
        "No social/provider sync.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "production_proof")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No Test/Figma/sandbox/sample row counts as production pilot proof.",
        "No localhost upload or review screenshot counts as rollout evidence.",
      ]),
    );
  });

  it("formats the contract in plain English for operators", () => {
    const output = formatProofUgcConsentStorageSafetyContract();

    expect(output).toContain(
      "Proof / evidence / UGC consent and storage safety contract: PRIVATE upload boundary",
    );
    expect(output).toContain("/proof-library/upload");
    expect(output).toContain("preparePrivateProofUploadForSupabase");
    expect(output).toContain("UGC embed links and social references");
    expect(output).toContain("Coach notes, moderation, and consent decisions");
    expect(output).toContain("Campaign proof handoff, social reuse, and exports");
    expect(output).toContain(
      "Public publishing, social/provider sync, warehouse export, AI proof summaries, and external moderation remain disabled even when a private raw-proof upload succeeds.",
    );
    expect(output).toContain(
      "Test/Figma/sandbox/sample rows, localhost uploads, preview-cookie review, and staging artifacts do not count as production pilot proof, rollout packet evidence, or invite-gate truth.",
    );
  });
});
