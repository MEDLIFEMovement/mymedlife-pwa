import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";

describe("admin backend lane nav", () => {
  it("keeps the product message event-first while leaving backend review routes connected", () => {
    const html = renderToStaticMarkup(
      <AdminBackendLaneNav current="luma_live_pilot" showIntegrations />,
    );

    expect(html).toContain("Keep the admin lane centered on the live event loop");
    expect(html).toContain("Outbox");
    expect(html).toContain("Luma Pilot");
    expect(html).toContain("Launch Gate");
    expect(html).toContain("Audit Log");
    expect(html).toContain("Pilot Scope");
    expect(html).toContain("Integrations");
    expect(html).toContain("Feature Flags");
    expect(html).toContain("Database Security");
    expect(html).toContain("Theme");
    expect(html).toContain("Committees");
    expect(html).toContain("Workflows");
    expect(html).toContain("SOP Library");
    expect(html).toContain("Master Data");
  });

  it("marks the current backend route in the connected admin lane", () => {
    const html = renderToStaticMarkup(
      <AdminBackendLaneNav current="theme" showIntegrations />,
    );

    expect(html).toContain("Theme");
    expect(html).toContain('aria-current="page"');
  });
});
