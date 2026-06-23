import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/campaigns",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
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

describe("campaigns page", () => {
  it("lets the member campaigns route open as a clean Rush Month surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing campaigns page."),
    );

    const { default: CampaignsPage } = await import("@/app/campaigns/page");
    const html = renderToStaticMarkup(await CampaignsPage({}));

    expect(html).toContain("Rush Month");
    expect(html).toContain("Current Phase");
    expect(html).toContain("Campaign KPIs");
    expect(html).toContain("Assigned Actions by Role");
    expect(html).toContain("Why this campaign matters");
    expect(html).toContain("View my actions");
    expect(html).toContain("/rush-month/actions?source=campaigns");
    expect(html).toContain("Submit evidence");
    expect(html).toContain(
      "/rush-month/actions/share-rush-flyer?step=submit&amp;source=campaigns#submit-evidence",
    );
    expect(html).not.toContain("Mock-seeded review data");
    expect(html.indexOf("Current Phase")).toBeLessThan(html.indexOf("Campaign KPIs"));
    expect(html.indexOf("Campaign KPIs")).toBeLessThan(html.indexOf("Assigned Actions by Role"));
    expect(html.indexOf("Assigned Actions by Role")).toBeLessThan(
      html.indexOf("Why this campaign matters"),
    );
    expect(html.indexOf("Why this campaign matters")).toBeLessThan(
      html.indexOf("Campaign actions"),
    );
    expect(html).not.toContain("What Good Looks Like");
    expect(html).not.toContain("Open event");
    expect(html).not.toContain("23 RSVPs so far");
    expect(html).not.toContain("/rush-month/events/event-rush-med-talk-001?source=campaigns");
    expect(html).not.toContain("Campaign operating system");
    expect(html).not.toContain("Campaigns turn SOPs into student action.");
    expect(html).not.toContain("Local preview tools");
    expect(html).not.toContain("Review only");
  });

  it("keeps role focus on the same campaigns route when a role query is selected", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing campaigns role focus."),
    );

    const { default: CampaignsPage } = await import("@/app/campaigns/page");
    const html = renderToStaticMarkup(
      await CampaignsPage({
        searchParams: Promise.resolve({ role: "general-members" }),
      }),
    );

    expect(html).toContain("Role focus");
    expect(html).toContain("General Members");
    expect(html).toContain("General members move Rush Month through visible invites");
    expect(html).toContain("/campaigns?role=general-members#role-focus");
  });

  it("keeps the profile handoff visible across the member campaigns route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing campaigns profile handoff."),
    );

    const { default: CampaignsPage } = await import("@/app/campaigns/page");
    const html = renderToStaticMarkup(
      await CampaignsPage({
        searchParams: Promise.resolve({ source: "profile" }),
      }),
    );

    expect(html).toContain("From profile");
    expect(html).toContain(
      "Profile handed you into the real campaign loop. Review Rush Month here, then hop back when you are done.",
    );
    expect(html).toContain("Back to profile");
    expect(html).toContain('href="/profile"');
    expect(html).toContain("/campaigns?role=general-members&amp;source=profile#role-focus");
    expect(html.indexOf("Rush Month")).toBeLessThan(html.indexOf("From profile"));
  });

  it("keeps the home handoff visible across the member campaigns route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing campaigns home handoff."),
    );

    const { default: CampaignsPage } = await import("@/app/campaigns/page");
    const html = renderToStaticMarkup(
      await CampaignsPage({
        searchParams: Promise.resolve({ source: "home" }),
      }),
    );

    expect(html).toContain("From home");
    expect(html).toContain(
      "Home surfaced this as the next campaign to understand. Keep that same weekly thread while you review it here.",
    );
    expect(html).toContain("Back to home");
    expect(html).toContain('href="/"');
    expect(html).toContain("/campaigns?role=general-members&amp;source=home#role-focus");
    expect(html.indexOf("Rush Month")).toBeLessThan(html.indexOf("From home"));
  });

  it("routes coaches into the coach-owned campaigns surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing campaigns redirect."),
    );

    const { default: CampaignsPage } = await import("@/app/campaigns/page");

    await expect(CampaignsPage({})).rejects.toThrow("NEXT_REDIRECT:/coach?view=campaigns");
  });

  it("gives chapter leaders a product-facing campaign library instead of review-shell copy", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leader campaign library."),
    );

    const { default: CampaignsPage } = await import("@/app/campaigns/page");
    const html = renderToStaticMarkup(await CampaignsPage({}));

    expect(html).toContain("Campaign library");
    expect(html).toContain("Campaigns turn chapter goals into student action.");
    expect(html).toContain(
      "This library holds the chapter playbooks behind Rush Month and the next campaign lanes.",
    );
    expect(html).toContain("Ready for the current chapter rhythm");
    expect(html).toContain("Next campaign lanes to shape");
    expect(html).toContain("Reusable chapter playbooks");
    expect(html).toContain("Events in motion");
    expect(html).toContain("Connected to campaign plans");
    expect(html).toContain("Proof for review");
    expect(html).toContain("Ready for sharing review");
    expect(html).toContain("Held handoffs");
    expect(html).toContain("Broader ecosystem stays paused");
    expect(html).not.toContain("Campaign operating system");
    expect(html).not.toContain("Campaigns turn SOPs into student action.");
    expect(html).not.toContain("Ready for the current mock loop");
    expect(html).not.toContain("Next operating shells to build");
    expect(html).not.toContain("Reusable campaign models");
    expect(html).not.toContain("Mock-linked events");
    expect(html).not.toContain("Represented locally only");
    expect(html).not.toContain("HQ proof items");
    expect(html).not.toContain("Need sharing review");
    expect(html).not.toContain("Disabled integrations");
    expect(html).not.toContain("No live sends");
  });

  it("routes staff reviewers into the staff-owned campaigns surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing campaigns redirect."),
    );

    const { default: CampaignsPage } = await import("@/app/campaigns/page");

    await expect(CampaignsPage({})).rejects.toThrow("NEXT_REDIRECT:/staff?view=campaigns");
  });
});
