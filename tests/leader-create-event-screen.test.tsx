import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CreateEventForm } from "@/components/figma-leader-create-event-screen";

describe("leader create-event preview honesty", () => {
  it("keeps the create-event shell preview-safe and TEST-labeled", () => {
    const html = renderToStaticMarkup(<CreateEventForm onBack={() => undefined} />);
    const source = readFileSync("src/components/figma-leader-create-event-screen.tsx", "utf8");

    expect(html).toContain("Create Event Preview");
    expect(html).toContain("This route stages TEST event previews only.");
    expect(html).toContain("Stage Event Preview");
    expect(html).toContain("Ready to stage?");
    expect(html).toContain("Previewing on");
    expect(html).toContain("Prepare a TEST post or story preview template");
    expect(html).toContain("Preview RSVP Button");
    expect(html).not.toContain("Publish Event");
    expect(source).toContain("TEST Boston College MEDLIFE");
    expect(source).toContain("TEST preview only - no message sent");
    expect(source).toContain("Caption Copy Blocked");
    expect(source).toContain("TEST Event Preview Ready");
  });
});
