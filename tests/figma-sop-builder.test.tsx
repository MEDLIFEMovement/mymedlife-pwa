import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";

import { describe, expect, it } from "vitest";

import { BuilderScreen, LibraryScreen, type SOPCampaign } from "@/components/figma-sop-builder";

const draftCampaign: SOPCampaign = {
  id: 99,
  name: "Rush Month",
  status: "draft",
  version: "v3.2",
  lastEditedBy: "Kiomi Matsukawa",
  lastPublished: "May 12, 2026",
  stepCount: 9,
  description: "Route-backed draft workflow for launch review.",
};

describe("figma sop builder", () => {
  it("keeps library creation and mutation controls visibly blocked while leaving the builder route-backed", () => {
    const html = renderToStaticMarkup(
      <LibraryScreen onOpen={() => undefined} />,
    );

    expect(html).toContain("New SOP creation is blocked until draft-live safety approval is complete");
    expect(html).toContain("SOP duplication is blocked until template-write approval is complete");
    expect(html).toContain("SOP archiving is blocked until draft-live safety approval is complete");
    expect(html).toContain("Open Builder");
  });

  it("keeps builder publish and rollback controls visibly blocked while leaving preview route-backed", () => {
    const html = renderToStaticMarkup(
      <BuilderScreen campaign={draftCampaign} onBack={() => undefined} />,
    );
    const source = readFileSync("src/components/figma-sop-builder.tsx", "utf8");

    expect(html).toContain("Role Preview");
    expect(html).toContain("SOP publish is blocked until draft-live safety approval is complete");
    expect(source).toContain("Rollback is blocked until draft-live safety approval is complete");
    expect(source).toContain("Publishing is blocked until draft-live safety approval is complete");
    expect(source).toContain("live SOP mutations remain blocked until the draft-live safety lane is approved");
  });
});
