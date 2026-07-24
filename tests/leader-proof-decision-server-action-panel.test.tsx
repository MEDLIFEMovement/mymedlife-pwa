import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { LeaderProofDecisionServerActionPanel } from "@/components/leader-proof-decision-server-action-panel";
import type { LeaderProofDecisionWriteReadiness } from "@/services/leader-proof-decision-write";
import type { Assignment, EvidenceItem } from "@/shared/types/domain";

vi.mock("@/app/rush-month/review/actions", () => ({
  submitLeaderProofDecisionAction: vi.fn(),
}));

describe("leader proof decision server action panel", () => {
  it.each([
    ["local", "Local leader proof decision"],
    ["staging", "Staging leader proof decision"],
    ["production", "Production leader proof decision"],
  ] as const)("labels the %s environment honestly", (environment, label) => {
    const html = renderToStaticMarkup(
      LeaderProofDecisionServerActionPanel({
        assignment: makeAssignment(),
        evidenceItem: makeEvidence(),
        readiness: makeReadiness(environment),
        defaultInput: {
          decision: "approve",
          note: "This proof has enough context for a decision.",
        },
      }),
    );

    expect(html).toContain(label);
    expect(html).toContain("Leader proof decisions are still safely gated.");
    expect(html).toContain("Leader decision locked");
  });

  it("renders an enabled production decision control", () => {
    const html = renderToStaticMarkup(
      LeaderProofDecisionServerActionPanel({
        assignment: makeAssignment(),
        evidenceItem: makeEvidence(),
        readiness: {
          ...makeReadiness("production"),
          canSubmit: true,
          resultCodeIfSubmitted: "proof_approved",
          reason: "Production leader proof decision is approved.",
          checks: [
            {
              key: "leader_proof_decision_write_approved",
              label: "Leader proof decision write switch is on",
              passed: true,
            },
          ],
        },
        defaultInput: {
          decision: "approve",
          note: "This proof has enough context for a decision.",
        },
      }),
    );

    expect(html).toContain("Leader can record this proof decision.");
    expect(html).toContain(">Save leader decision</button>");
    expect(html).not.toContain("Leader decision locked");
  });
});

function makeReadiness(
  environment: LeaderProofDecisionWriteReadiness["environment"],
): LeaderProofDecisionWriteReadiness {
  return {
    operation: "leader_proof_decision",
    environment,
    canSubmit: false,
    resultCodeIfSubmitted: "write_disabled",
    reason: "Leader proof decision remains gated.",
    checks: [],
  };
}

function makeAssignment(): Assignment {
  return {
    id: "00000000-0000-4000-8000-000000000101",
    title: "Review TEST proof",
    ownerRole: "General Member",
    lane: "Member",
    dueLabel: "Today",
    status: "submitted",
    evidenceRequired: "TEST proof",
    instructions: "Review this TEST submission.",
    points: 10,
    kpi: "proof_reviewed",
  };
}

function makeEvidence(): EvidenceItem {
  return {
    id: "00000000-0000-4000-8000-000000000201",
    assignmentId: "00000000-0000-4000-8000-000000000101",
    submittedBy: "TEST Member",
    evidenceType: "testimonial_text",
    summary: "TEST proof submitted for leader review.",
    status: "pending_review",
  };
}
