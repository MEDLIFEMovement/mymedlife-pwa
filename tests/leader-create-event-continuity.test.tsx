import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CreateEventForm } from "@/components/figma-leader-create-event-screen";

describe("leader create-event continuity", () => {
  it("keeps the create-event preview connected to chapter-home and event-ops follow-through", () => {
    const html = renderToStaticMarkup(<CreateEventForm onBack={() => undefined} />);

    expect(html).toContain("Create Event Preview");
    expect(html).toContain("Back to Event Performance");
    expect(html).toContain("TEST Event Operations Loop");
    expect(html).toContain(
      "Keep event staging connected to chapter-home, committee ownership, and attendance review.",
    );
    expect(html).toContain("Back to Chapter Home");
    expect(html).toContain("Open Event Committees");
    expect(html).toContain("Open Event Performance");
    expect(html).toContain("stages TEST event previews only");
  });

  it("wires the create-event continuity controls through the leader shell routes", () => {
    const source = readFileSync("src/components/figma-leader-command-center.tsx", "utf8");

    expect(source).toContain('navigateToScreen("create-event")');
    expect(source).toContain('onCreateEvent={() => onNavigate("create-event")}');
    expect(source).toContain('onClick={() => onNavigate("create-event")}');
    expect(source).not.toContain("setShowCreate(true)");
    expect(source).not.toContain("showCreateEvent");
    expect(source).toContain('onOpenHome={() => navigateToScreen("home")}');
    expect(source).toContain('onOpenCommittees={() => navigateToScreen("committees")}');
    expect(source).toContain('onOpenEvents={() => navigateToScreen("events")}');
    expect(source).toContain('onNavigate={navigateToScreen}');
  });
});
