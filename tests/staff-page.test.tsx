import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/staff",
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

function getSignedInActor(email: string) {
  return getMockLocalActorContext(
    email,
    "Using signed-in test actor.",
    "mock_fallback",
    "local_auth_session",
    "signed_in",
  );
}

describe("staff page", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns members to their owned student surface when the staff route is blocked", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member redirect from staff route."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    await expect(StaffPage({})).rejects.toThrow("NEXT_REDIRECT:/app");
  });

  it("returns chapter leaders to their owned leader surface when the staff route is blocked", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leader redirect from staff route."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    await expect(StaffPage({})).rejects.toThrow("NEXT_REDIRECT:/leader?view=overview");
  });

  it("keeps DS Admin in the admin backend when the staff route is blocked", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("ds.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing DS redirect from staff route."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    await expect(StaffPage({})).rejects.toThrow("NEXT_REDIRECT:/admin");
  });

  it("sends signed-out reviewers to login before opening the staff command center", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("general.staff@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing signed-out staff redirect."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");

    await expect(StaffPage({})).rejects.toThrow(
      "NEXT_REDIRECT:/login?redirectTo=%2Fstaff%3Fview%3Dchapters",
    );
  });

  it("renders the Figma-owned staff command center for staff users", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing staff command center page."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(await StaffPage({}));

    expect(html).toContain("myMEDLIFE");
    expect(html).toContain("Staff Command Center");
    expect(html).toContain('aria-label="Staff workspace menu"');
    expect(html).toContain("bg-sidebar");
    expect(html).toContain("text-sidebar-foreground/70");
    expect(html).toContain("Portfolio Overview");
    expect(html).toContain('href="/staff?view=chapters"');
    expect(html).toContain(">Chapters<");
    expect(html).toContain(">Campaigns<");
    expect(html).toContain(">Proof / UGC<");
    expect(html).toContain(">Best Practices<");
    expect(html).toContain(">Campaign SOPs<");
    expect(html).toContain(">Admin<");
    expect(html).toContain('href="/staff?view=campaigns"');
    expect(html).toContain('href="/staff?view=proof_ugc"');
    expect(html).toContain('href="/staff?view=best_practices"');
    expect(html).toContain('href="/staff?view=sops"');
    expect(html).toContain('href="/staff?view=admin"');
    expect(html).not.toContain('aria-disabled="true"');
    expect(html).not.toContain('href="/admin/sop-library"');
    expect(html).not.toContain("404");
    expect(html).toContain("RSVPs");
    expect(html).toContain("Attended");
    expect(html).toContain("Points/Yr");
    expect(html).toContain("Lead→Event %");
    expect(html).toContain("Avg Events / Month");
  });

  it("renders direct staff event route content without adding a non-Figma top-nav item", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing visible staff event menu state."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({ view: "events" }),
      }),
    );

    expect(html).toContain("Staff workspace menu");
    expect(html).not.toContain('href="/staff?view=events"');
    expect(html).not.toContain('href="/staff?view=leaderboard"');
    expect(html).toContain(">Events<");
    expect(html).toContain("Luma Event Operations");
    expect(html).toContain("Luma → RSVP → attendance → points");
  });

  it("opens the Figma chapter drawer when a route carries a selected chapter", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing staff selected chapter drawer."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "chapters",
          chapter: "chapter-northview",
        }),
      }),
    );

    expect(html).toContain("Chapter Detail");
    expect(html).toContain("UCLA MEDLIFE");
    expect(html).toContain("Lead → Event Funnel");
    expect(html).toContain("Post-Event NPS");
    expect(html).toContain("Coach Note");
    expect(html).toContain("Send NPS Survey");
  });

  it("renders the Figma organization leaderboard lane for staff users", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing staff leaderboard lane."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({ view: "leaderboard" }),
      }),
    );

    expect(html).toContain("Organization Leaderboard");
    expect(html).toContain("chapter standings · attendance points · lead scoring signal");
    expect(html).toContain("Lead Scoring Signal");
    expect(html).toContain("Chapter standings");
    expect(html).toContain("Organization-wide points");
    expect(html).toContain("UCLA MEDLIFE");
  });

  it("keeps coaches inside the same /staff workspace while showing the coach lens", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("coach@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing coach workspace on the staff route."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(await StaffPage({}));

    expect(html).toContain("myMEDLIFE");
    expect(html).toContain("Coach Command Center");
    expect(html).toContain("Portfolio Overview");
    expect(html).toContain('href="/staff?view=chapters');
    expect(html).not.toContain('href="/coach?view=chapters');
  });

  it("renders campaign operations as its own Figma-derived staff screen", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing staff campaigns view."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "campaigns",
          campaign: "rush-month",
        }),
      }),
    );

    expect(html).toContain("Campaign Operations");
    expect(html).toContain("Suggested Actions for At-Risk Chapters");
    expect(html).toContain("Rush Month chapters");
    expect(html).toContain("Luma, RSVP, attendance, points");
    expect(html).not.toContain("Portfolio Overview");
  });

  it("renders the proof and UGC review queue as its own Figma-derived staff screen", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing staff proof queue view."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "proof_ugc",
        }),
      }),
    );

    expect(html).toContain("Proof / UGC Review Queue");
    expect(html).toContain("Submit a story link");
    expect(html).toContain("Consent &amp; Visibility");
    expect(html).toContain("No external publish");
    expect(html).not.toContain("Organization Leaderboard");
  });

  it("renders best practices, SOPs, and admin as dedicated Figma-derived staff screens", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing dedicated staff views."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const bestPracticesHtml = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({ view: "best_practices" }),
      }),
    );
    const sopsHtml = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({ view: "sops" }),
      }),
    );
    const adminHtml = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({ view: "admin" }),
      }),
    );

    expect(bestPracticesHtml).toContain("Best Practices Library");
    expect(bestPracticesHtml).toContain("Why it worked");
    expect(bestPracticesHtml).toContain("Share to Feed");
    expect(bestPracticesHtml).not.toContain("Portfolio Overview");

    expect(sopsHtml).toContain("Campaign SOP Builder");
    expect(sopsHtml).toContain("Role Matrix");
    expect(sopsHtml).toContain("Points / KPI");
    expect(sopsHtml).toContain("publishing disabled");
    expect(sopsHtml).not.toContain("Portfolio Overview");

    expect(adminHtml).toContain("System Health");
    expect(adminHtml).toContain("Integration Status");
    expect(adminHtml).toContain("Automation Outbox");
    expect(adminHtml).toContain("Audit Log");
    expect(adminHtml).toContain("0 sends");
    expect(adminHtml).not.toContain("Portfolio Overview");
  });

  it("shows an explicit Figma-missing state instead of parking unsupported staff views", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing staff unsupported-view cleanup."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "hubspot",
          campaign: "rush-month",
          source: "member_home",
        }),
      }),
    );

    expect(html).toContain("HubSpot Intelligence");
    expect(html).toContain("Figma page missing - implementation blocked");
    expect(html).not.toContain("Portfolio Overview");
  });
});
