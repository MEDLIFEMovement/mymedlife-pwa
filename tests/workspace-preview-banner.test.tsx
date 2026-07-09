import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { WorkspacePreviewBanner } from "@/components/workspace-preview-banner";

describe("workspace preview banner", () => {
  it("keeps TEST labeling visible in shared preview chrome", () => {
    const html = renderToStaticMarkup(
      <WorkspacePreviewBanner workspaceLabel="the General Student App" />,
    );

    expect(html).toContain("TEST Preview — read-only");
    expect(html).toContain("TEST content stays visible here");
    expect(html).toContain("the General Student App");
  });
});
