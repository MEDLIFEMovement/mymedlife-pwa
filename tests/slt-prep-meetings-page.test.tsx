import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/slt-prep/meetings",
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

describe("slt prep meetings page", () => {
  it("lets the meetings route lead with the traveler meeting surface only", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing slt meetings page."),
    );

    const { default: SltPrepMeetingsPage } = await import("@/app/slt-prep/meetings/page");
    const html = renderToStaticMarkup(await SltPrepMeetingsPage({}));

    expect(html).toContain("Pre-Trip Meetings");
    expect(html).toContain("Meeting status");
    expect(html).toContain("Attended and upcoming sessions");
    expect(html).toContain("Current blocker");
    expect(html).toContain("Family Q&amp;A");
    expect(html).toContain("June 22, 2026");
    expect(html).toContain("Keep the traveler informed");
    expect(html).toContain("/slt-prep/checklist/orientation-rsvp?source=meetings");
    expect(html).not.toContain("Meeting watchout</p>");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("keeps selected traveler context attached on the meetings route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing selected traveler meetings page."),
    );

    const { default: SltPrepMeetingsPage } = await import("@/app/slt-prep/meetings/page");
    const html = renderToStaticMarkup(
      await SltPrepMeetingsPage({
        searchParams: Promise.resolve({ traveler: "daniel-kim" }),
      }),
    );

    expect(html).toContain("Pre-Trip Meetings");
    expect(html).toContain("/slt-prep/profile?traveler=daniel-kim");
    expect(html).toContain("/slt-prep/checklist/orientation-rsvp?source=meetings&amp;traveler=daniel-kim");
  });

  it("keeps profile handoff context visible without taking over the meetings route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing meetings profile handoff."),
    );

    const { default: SltPrepMeetingsPage } = await import("@/app/slt-prep/meetings/page");
    const html = renderToStaticMarkup(
      await SltPrepMeetingsPage({
        searchParams: Promise.resolve({
          source: "profile",
          traveler: "daniel-kim",
        }),
      }),
    );

    expect(html).toContain("Profile opened this prep route for Daniel Kim.");
    expect(html).toContain("Back to profile");
    expect(html).toContain('href="/slt-prep/profile?traveler=daniel-kim"');
    expect(html.indexOf("Meeting status")).toBeLessThan(
      html.indexOf("Profile opened this prep route for Daniel Kim."),
    );
  });

  it("preserves staff source on nearby traveler routes while meetings is open", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing meetings staff handoff preservation."),
    );

    const { default: SltPrepMeetingsPage } = await import("@/app/slt-prep/meetings/page");
    const html = renderToStaticMarkup(
      await SltPrepMeetingsPage({
        searchParams: Promise.resolve({
          source: "staff",
          traveler: "daniel-kim",
        }),
      }),
    );

    expect(html).toContain("Staff traveler review opened this prep route for Daniel Kim.");
    expect(html).toContain('href="/slt-prep/staff?traveler=daniel-kim"');
    expect(html).toContain('href="/slt-prep/profile?source=staff&amp;traveler=daniel-kim"');
  });
});
