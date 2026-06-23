import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/slt-prep/profile",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
  };
});

vi.mock("@/services/read-only-app-data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/read-only-app-data")>();

  return {
    ...actual,
    getReadOnlyAppData: vi.fn(),
  };
});

describe("slt prep profile page", () => {
  it("lets the profile route lead with the traveler profile and notification surface only", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing slt profile page."),
    );

    const { default: SltPrepProfilePage } = await import("@/app/slt-prep/profile/page");
    const html = renderToStaticMarkup(await SltPrepProfilePage({}));

    expect(html).toContain("Profile for Sofia Alvarez");
    expect(html).toContain("Traveler snapshot");
    expect(html).toContain("Open notifications");
    expect(html).toContain("sarah.johnson@email.com");
    expect(html).toContain("(555) 123-4567");
    expect(html).toContain("Communication Preferences");
    expect(html).toContain("Recent Notifications");
    expect(html).toContain("Flight information due in 2 days");
    expect(html).toContain("Submit flight info");
    expect(html).toContain("Pay balance");
    expect(html).toContain("Choose extension");
    expect(html).toContain("/slt-prep/checklist/second-installment?source=profile");
    expect(html).toContain("/slt-prep/flights?source=profile");
    expect(html).toContain("/slt-prep/payments?source=profile");
    expect(html).toContain("/slt-prep/extensions?source=profile");
    expect(html).not.toContain("Mock-seeded review data");
    expect(html).not.toContain("Local preview tools");
    expect(html).not.toContain("Review only");
    expect(html).not.toContain("Notification posture");
    expect(html).not.toContain("Travel watchout");
    expect(html).not.toContain(">Alerts<");
    expect(html.indexOf("Recent Notifications")).toBeLessThan(
      html.indexOf("Communication Preferences"),
    );
  });

  it("can render a selected traveler route with traveler-safe links", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing selected traveler profile page."),
    );

    const { default: SltPrepProfilePage } = await import("@/app/slt-prep/profile/page");
    const html = renderToStaticMarkup(
      await SltPrepProfilePage({
        searchParams: Promise.resolve({ traveler: "daniel-kim" }),
      }),
    );

    expect(html).toContain("Profile for Daniel Kim");
    expect(html).toContain("/slt-prep/notifications?traveler=daniel-kim");
    expect(html).toContain("/slt-prep/meetings?source=profile&amp;traveler=daniel-kim");
    expect(html).toContain("Join meeting");
    expect(html).toContain("daniel.kim@email.com");
  });

  it("shows the staff-review handoff when profile opens for a selected traveler from staff", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing selected traveler profile staff handoff."),
    );

    const { default: SltPrepProfilePage } = await import("@/app/slt-prep/profile/page");
    const html = renderToStaticMarkup(
      await SltPrepProfilePage({
        searchParams: Promise.resolve({
          source: "staff",
          traveler: "daniel-kim",
        }),
      }),
    );

    expect(html).toContain("This prep route was opened from staff traveler review.");
    expect(html).toContain("Back to staff");
    expect(html).toContain('href="/slt-prep/staff?traveler=daniel-kim"');
    expect(html).toContain('/slt-prep/notifications?source=staff&amp;traveler=daniel-kim');
    expect(html.indexOf("Recent Notifications")).toBeLessThan(
      html.indexOf("This prep route was opened from staff traveler review."),
    );
  });
});
