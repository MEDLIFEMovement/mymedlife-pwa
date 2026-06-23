import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/staff",
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

describe("staff page", () => {
  it("returns chapter leaders to their owned chapter surface when the staff route is blocked", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing blocked staff page."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(await StaffPage({}));

    expect(html).toContain("This staff command center is not visible to this role.");
    expect(html).toContain('href="/chapter?view=overview"');
    expect(html).toContain(">Open chapter home<");
  });

  it("keeps DS Admin on admin safety lanes when the staff route is blocked", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing DS-blocked staff page."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(await StaffPage({}));

    expect(html).toContain('href="/admin"');
    expect(html).toContain(">Open admin safety review<");
  });

  it("lets the default staff route open with the portfolio table surface as the first readable command center state", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing staff portfolio page."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(await StaffPage({}));

    expect(html).toContain("Staff Command Center");
    expect(html).toContain("myMEDLIFE");
    expect(html).toContain("Portfolio Overview");
    expect(html).toContain("Chapters Active");
    expect(html).toContain("M.S.");
    expect(html).toContain("J.O.");
    expect(html).not.toContain("Sofia Growth Lead");
    expect(html).not.toContain("Naomi Outreach Lead");
    expect(html).not.toContain("Command center nav");
    expect(html).not.toContain("Live rows");
    expect(html).toMatch(
      /<a[^>]*href="\/staff\?view=chapters"[^>]*>Chapters<\/a>/,
    );
    expect(html).toMatch(
      /<a[^>]*href="\/staff\?view=campaigns"[^>]*>Campaigns<\/a>/,
    );
    expect(html).toMatch(
      /<a[^>]*href="\/staff\?view=feed_analytics"[^>]*>Feed Analytics<\/a>/,
    );
    expect(html).not.toMatch(
      /<a[^>]*href="\/staff\?view=chapters&amp;campaign=rush-month"[^>]*>Chapters<\/a>/,
    );
    expect(html).not.toMatch(
      /<a[^>]*href="\/staff\?view=campaigns&amp;campaign=rush-month"[^>]*>Campaigns<\/a>/,
    );
    expect(html).not.toContain("Quick tools");
    expect(html).toContain("Search chapter, school, student...");
    expect(html).toContain('aria-label="Risk filter"');
    expect(html).toContain('aria-label="Country filter"');
    expect(html).toContain('aria-label="Campaign filter"');
    expect(html).toContain('aria-label="Coach filter"');
    expect(html).toContain("Healthy");
    expect(html).toContain("At-Risk");
    expect(html).toContain("Intervene");
    expect(html).toContain("Chapter Engagement");
    expect(html).toContain("Grow the Movement");
    expect(html).toContain("Leadership Transition");
    expect(html).toContain("Start a Chapter");
    expect(html).toContain("Aisha Kamara");
    expect(html).toContain("Carlos Quispe");
    expect(html).toContain("Fernanda Lima");
    expect(html).toContain("James Okafor");
    expect(html).toContain("Lucia Herrera");
    expect(html).toContain("Maria Santos");
    expect(html).toContain("Samuel Mutua");
    expect(html).toContain(">Review At-Risk<");
    expect(html).toContain('/staff?view=chapters&amp;campaign=rush-month&amp;risk=medium');
    expect(html).toContain(">Export<");
    expect(html).not.toContain('type="submit"');
    expect(html).toContain("Chapters Active");
    expect(html).toContain("2 chapters need intervention");
    expect(html).toContain(">HQ<");
    expect(html.indexOf("Chapters Active")).toBeLessThan(
      html.indexOf("Search chapter, school, student..."),
    );
    expect(html).not.toContain("Mock-seeded review data");
    expect(html).not.toContain("Local preview tools");
    expect(html).not.toContain("Review only");
  });

  it("lets the proof-review route open with the moderation queue and selected review state as the primary surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing staff proof-review page."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "proof_ugc",
          proofQueue: "selected",
          proofType: "bridge_video",
          proof: "proof-unam-bridge-video",
        }),
      }),
    );

    expect(html).toContain("Proof / UGC Review Queue");
    expect(html).toContain("UNAM Mexico City");
    expect(html).toContain("Selected review state");
    expect(html).toContain("Approve for");
    expect(html).toContain("Recommended use");
    expect(html).not.toContain("Visible chapters");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("lets the feed-studio route open with the curation workspace as the primary surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing staff feed-studio page."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "feed_studio",
        }),
      }),
    );

    expect(html).toContain("Feed Curation Studio");
    expect(html).toContain("Audience targeting");
    expect(html).toContain("Feed preview");
    expect(html).toContain("Schedule");
    expect(html).not.toContain("Visible chapters");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("preserves the selected best-practice state when the staff library route is reopened from a share flow", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing selected best-practice page."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "best_practices",
          bestPractice: "practice-why-i-travel",
          practiceCampaign: "moving_mountains",
          practiceCountry: "mexico",
        }),
      }),
    );

    expect(html).toContain("Selected practice");
    expect(html).toContain("Selected for sharing");
    expect(html).toContain("Why I Travel");
    expect(html).toContain("UNAM Mexico City is the currently selected practice");
  });

  it("preserves the best-practice source context when staff opens Feed Studio from the library", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing feed studio best-practice handoff."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "feed_studio",
          bestPractice: "practice-why-i-travel",
          practiceCampaign: "moving_mountains",
          practiceCountry: "mexico",
        }),
      }),
    );

    expect(html).toContain("Best practice source");
    expect(html).toContain("Opened from the best-practice library");
    expect(html).toContain("Return to best practices");
    expect(html).toContain("Why I Travel");
  });

  it("keeps the default proof-review panel phrased like a product review surface, not an internal checklist", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing staff proof-review empty panel."),
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
    expect(html).toContain(
      "Select a content card to review whether it is ready to reuse, where it should be shared, and what context still needs a human decision.",
    );
    expect(html).not.toContain("approval tiers");
    expect(html).not.toContain("coaching note context");
  });

  it("lets the HubSpot route open with chapter intelligence as the primary surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing staff hubspot page."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "hubspot",
        }),
      }),
    );

    expect(html).toContain("HubSpot + Chapter Intelligence");
    expect(html).toContain("HubSpot CRM Profile");
    expect(html).toContain("Conversion Funnel");
    expect(html).not.toContain("Visible chapters");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("lets the campaigns route open with campaign operations as the primary surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing staff campaigns page."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "campaigns",
        }),
      }),
    );

    expect(html).toContain("Campaign Operations");
    expect(html).toContain("No event created");
    expect(html).not.toContain("Visible execution rows");
    expect(html).not.toContain("Visible chapters");
    expect(html).not.toContain("Quick tools");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("keeps the selected campaign risk lane visible and narrows the execution table on the same route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing staff campaign risk-lane selection."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "campaigns",
          campaignRisk: "evidence_stuck",
        }),
      }),
    );

    expect(html).toContain("Evidence Stuck");
    expect(html).toContain("Viewing lane");
    expect(html).toContain("Filtered by Evidence Stuck");
    expect(html).toContain("Execution table is narrowed to this risk lane.");
    expect(html).toContain("Yale University");
    expect(html).toContain("UNMSM Lima");
    expect(html).toContain('href="/staff?view=campaigns&amp;campaign=rush-month"');
    expect(html).toContain("Clear filter");
  });

  it("lets the feed-analytics route open with the content-performance surface as the primary view", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing staff feed analytics page."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "feed_analytics",
        }),
      }),
    );

    expect(html).toContain("Feed Analytics");
    expect(html).toContain("Post Performance");
    expect(html).toContain("How Stanford captured 91 leads in one weekend");
    expect(html).toContain("Total Views");
    expect(html).not.toContain("Visible chapters");
    expect(html).not.toContain("Feed Studio source");
    expect(html).not.toContain("Opened from a curation draft");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("lets the feed-analytics route open a selected-post impact panel when the clickthrough includes a post context", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing staff feed analytics impact panel."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "feed_analytics",
          feedDraft: "proof-florida-event-recap-feed",
          feedRole: "leader",
          feedAudience: "selected_chapters",
          feedPost: "feed-post-faith-story",
        }),
      }),
    );

    expect(html).toContain("Feed Analytics");
    expect(html).toContain("Impact Analysis");
    expect(html).toContain("Did content drive action?");
    expect(html).not.toContain("Selected post");
    expect(html).not.toContain("Visible chapters");
    expect(html).toContain("Faith&#x27;s story");
    expect(html).toContain("Return to Feed Studio");
    expect(html).toContain("Open member review");
    expect(html).toContain("University of Nairobi");
    expect(html).toContain("University of Ghana");
    expect(html.indexOf("Impact Analysis")).toBeLessThan(
      html.indexOf("Total Views"),
    );
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("lets the best-practices route open with the library surface as the primary view", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing staff best practices page."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "best_practices",
        }),
      }),
    );

    expect(html).toContain("Best Practices Library");
    expect(html).toContain("Share to Feed");
    expect(html).toContain("Send to Coaches");
    expect(html).toContain("All Campaigns");
    expect(html).toContain("All Countries");
    expect(html).not.toContain("Visible chapters");
    expect(html).not.toContain("Quick tools");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("opens the chapter drawer as a staff-owned route state with decision posture and drawer quick links", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing staff chapter drawer page."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "chapters",
          chapter: "chapter-yale",
          decision: "intervene",
          risk: "medium",
          country: "usa",
          coach: "james",
          portfolioCampaign: "rush_month",
          q: "Yale",
        }),
      }),
    );

    expect(html).toContain("Yale University");
    expect(html).toContain("Campaign KPIs");
    expect(html).toContain("Quick links");
    expect(html).toContain("HubSpot CRM");
    expect(html).not.toContain("Luma Events");
    expect(html).not.toContain("Decision workspace");
    expect(html).not.toContain("Focus now");
    expect(html).not.toContain("Recent signals");
    expect(html).not.toContain("Intervention posture selected");
    expect(html).not.toContain("Follow-up debt is growing");
    expect(html).not.toContain("Proof review is backing up");
    expect(html).toMatch(
      /href="\/staff\?view=campaigns[^"]*chapter=chapter-yale[^"]*decision=intervene"/,
    );
    expect(html).toMatch(
      /href="\/staff\?view=best_practices[^"]*chapter=chapter-yale[^"]*decision=intervene"/,
    );
    expect(html).not.toContain("Future n8n reminder workflow");
    expect(html).not.toContain("Future CRM handoff payload");
    expect(html).toContain("Assign Intervention");
    expect(html).toContain("Open Proof Queue");
    expect(html).not.toContain("Mock-seeded review data");
  });

  it("shows the member-home handoff when the HQ lens is opened from the home role jump", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing staff role-jump handoff."),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "admin",
          source: "member_home",
        }),
      }),
    );

    expect(html).toContain("Member app handoff");
    expect(html).toContain("Platform Admin");
    expect(html).toContain("Admin Console");
    expect(html).toContain("Opened from UCLA MEDLIFE into Admin Console");
    expect(html).toContain("Switch View buttons");
    expect(html).toContain("View integration events");
    expect(html).toContain("Open workflow registry");
    expect(html).toContain("Student view");
    expect(html.indexOf("Student view")).toBeLessThan(html.indexOf("Admin Console"));
    expect(html).toContain("System health: 5 of 6 integrations active");
    expect(html.indexOf("Admin Console")).toBeLessThan(html.indexOf("Staff Command Center"));
    expect(html.indexOf("Opened from UCLA MEDLIFE into Admin Console")).toBeLessThan(
      html.indexOf("Integration Status"),
    );
    expect(html).toContain("/staff?view=admin&amp;source=member_home#integration-status");
    expect(html).toContain('id="integration-status"');
    expect(html).not.toContain("Portfolio chapters");
    expect(html).not.toContain("Portfolio Overview");
    expect(html).toContain(
      'href="/local-preview?selectedEmail=member.a%40mymedlife.test&amp;returnTo=%2F"',
    );
  });
});
