import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { ActionProofHandoffPanel } from "@/components/action-proof-handoff-panel";
import { assignments } from "@/data/mock-rush-month";
import { getActionProofHandoffWorkspace } from "@/services/action-proof-handoff";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("action proof handoff panel", () => {
  it("renders the member proof handoff with product-facing labels", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const assignment = assignments.find((item) => item.id === "share-rush-flyer");

    if (!assignment) {
      throw new Error("Missing mock assignment share-rush-flyer");
    }

    const workspace = getActionProofHandoffWorkspace(actor, assignment);
    const html = renderToStaticMarkup(<ActionProofHandoffPanel workspace={workspace} />);

    expect(html).toContain("What gets tracked later");
    expect(html).toContain("Held follow-ups");
    expect(html).toContain("What stays off here");
    expect(html).not.toContain("Future structured records");
    expect(html).not.toContain("Disabled outbox destinations");
    expect(html).not.toContain("Still preview-only");
  });
});
