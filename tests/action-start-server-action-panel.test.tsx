import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ActionStartServerActionPanel } from "@/components/action-start-server-action-panel";
import type { ActionStartWriteReadiness } from "@/services/action-start-write";
import type { Assignment } from "@/shared/types/domain";

vi.mock("@/app/rush-month/actions/[assignmentId]/actions", () => ({
  startAssignmentAction: vi.fn(),
}));

describe("action start server action panel", () => {
  it.each([
    ["local", "Local start action"],
    ["staging", "Staging start action"],
    ["production", "Production start action"],
  ] as const)("labels the %s environment honestly", (environment, label) => {
    const html = renderToStaticMarkup(
      ActionStartServerActionPanel({
        assignment: makeAssignment(),
        readiness: makeReadiness(environment),
      }),
    );

    expect(html).toContain(label);
    expect(html).toContain("Start action is still safely gated.");
    expect(html).toContain("Start action locked");
  });

  it("renders an enabled production action-start control", () => {
    const html = renderToStaticMarkup(
      ActionStartServerActionPanel({
        assignment: makeAssignment(),
        readiness: {
          ...makeReadiness("production"),
          canSubmit: true,
          resultCodeIfSubmitted: "started",
          reason: "Production action start is approved.",
          checks: [
            {
              key: "action_start_write_approved",
              label: "Action-start write switch is on",
              passed: true,
            },
          ],
        },
      }),
    );

    expect(html).toContain("You can start this action.");
    expect(html).toContain(">Start this action</button>");
    expect(html).not.toContain("Start action locked");
  });
});

function makeReadiness(
  environment: ActionStartWriteReadiness["environment"],
): ActionStartWriteReadiness {
  return {
    operation: "action_started",
    environment,
    canSubmit: false,
    resultCodeIfSubmitted: "write_disabled",
    reason: "Action start remains gated.",
    checks: [],
  };
}

function makeAssignment(): Assignment {
  return {
    id: "00000000-0000-4000-8000-000000000101",
    title: "Start TEST assignment",
    ownerRole: "General Member",
    lane: "Member",
    dueLabel: "Today",
    status: "not_started",
    evidenceRequired: "TEST proof",
    instructions: "Complete the TEST assignment.",
    points: 10,
    kpi: "action_started",
  };
}
