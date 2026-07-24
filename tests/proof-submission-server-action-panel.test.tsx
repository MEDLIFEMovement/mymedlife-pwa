import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ProofSubmissionServerActionPanel } from "@/components/proof-submission-server-action-panel";
import type { ProofSubmissionWriteReadiness } from "@/services/proof-submission-write";
import type { Assignment } from "@/shared/types/domain";

vi.mock("@/app/rush-month/actions/[assignmentId]/actions", () => ({
  submitAssignmentProofAction: vi.fn(),
}));

describe("proof submission server action panel", () => {
  it.each([
    ["local", "Local proof/testimonial submission"],
    ["staging", "Staging proof/testimonial submission"],
    ["production", "Production proof/testimonial submission"],
  ] as const)("labels the %s environment honestly", (environment, label) => {
    const html = renderToStaticMarkup(
      ProofSubmissionServerActionPanel({
        assignment: makeAssignment(),
        readiness: makeReadiness(environment),
        defaultInput: {
          evidenceType: "testimonial_text",
          summary: "A sufficiently detailed TEST proof summary for private review.",
        },
      }),
    );

    expect(html).toContain(label);
    expect(html).toContain("Proof submission is still safely gated.");
    expect(html).toContain("Proof submission locked");
  });

  it("renders an enabled production submission control", () => {
    const html = renderToStaticMarkup(
      ProofSubmissionServerActionPanel({
        assignment: makeAssignment(),
        readiness: {
          ...makeReadiness("production"),
          canSubmit: true,
          resultCodeIfSubmitted: "proof_submitted",
          reason: "Production proof submission is approved.",
          checks: [
            {
              key: "proof_submission_write_approved",
              label: "Proof-submission write switch is on",
              passed: true,
            },
          ],
        },
        defaultInput: {
          evidenceType: "testimonial_text",
          summary: "A sufficiently detailed TEST proof summary for private review.",
        },
      }),
    );

    expect(html).toContain("You can submit this proof for private HQ review.");
    expect(html).toContain(">Submit proof</button>");
    expect(html).not.toContain("Proof submission locked");
  });
});

function makeReadiness(
  environment: ProofSubmissionWriteReadiness["environment"],
): ProofSubmissionWriteReadiness {
  return {
    operation: "evidence_submitted",
    environment,
    canSubmit: false,
    resultCodeIfSubmitted: "write_disabled",
    reason: "Proof submission remains gated.",
    checks: [],
  };
}

function makeAssignment(): Assignment {
  return {
    id: "00000000-0000-4000-8000-000000000101",
    title: "Submit TEST event story",
    ownerRole: "General Member",
    lane: "Member",
    dueLabel: "Today",
    status: "in_progress",
    evidenceRequired: "TEST testimonial",
    instructions: "Describe what happened.",
    points: 10,
    kpi: "story_submitted",
  };
}
