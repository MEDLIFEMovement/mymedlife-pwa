import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MedlifeStoriesScreen } from "@/components/figma-leader-stories-screen";

describe("leader stories preview honesty", () => {
  it("keeps the stories shell visible while blocking save, playback, and source-open behavior", () => {
    const html = renderToStaticMarkup(<MedlifeStoriesScreen />);
    const source = readFileSync("src/components/figma-leader-stories-screen.tsx", "utf8");

    expect(html).toContain("MEDLIFE Stories");
    expect(html).toContain("TEST stories preview.");
    expect(html).toContain("Preview Story Review");
    expect(html).toContain("TEST MEDLIFE Stories preview — curated by staff");
    expect(html).toContain("TEST stories in preview library");
    expect(source).toContain("Video playback is blocked in this preview until story-source approval is complete.");
    expect(source).toContain("Playback blocked");
    expect(source).toContain("Save Preview Blocked");
    expect(source).toContain("Source Preview Blocked on");
    expect(source).toContain("Reactions and media playback are preview-only in this leadership shell.");
  });
});
