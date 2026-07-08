import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AdminAccessManagementPanel } from "@/components/admin-access-management-panel";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("admin access management panel", () => {
  it("keeps visible mock users and chapters clearly marked as TEST", () => {
    const actor = getMockLocalActorContext(
      "ds.admin@mymedlife.test",
      "Using DS Admin test actor.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );

    const html = renderToStaticMarkup(
      <AdminAccessManagementPanel actor={actor} />,
    );

    expect(html).toContain("Mock users and chapters stay visibly labeled in this review surface.");
    expect(html).toContain("Managed Chapter Scope");
    expect(html).toContain("UCLA MEDLIFE");
    expect(html).toContain("Sofia Alvarez");
    expect(html.match(/>TEST</g)?.length ?? 0).toBeGreaterThanOrEqual(6);
  });
});
