import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { ChapterDetailDrawer } from "@/components/figma-staff-command-center";

vi.mock("next/navigation", () => ({
  usePathname: () => "/staff",
  useRouter: () => ({
    replace: vi.fn(),
  }),
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

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    await expect(StaffPage({})).rejects.toThrow("NEXT_REDIRECT:/app");
  });

  it("returns chapter leaders to their owned leader surface when the staff route is blocked", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("leader.a@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    await expect(StaffPage({})).rejects.toThrow("NEXT_REDIRECT:/leader?view=overview");
  });

  it("keeps DS Admin in the admin backend when the staff route is blocked", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("ds.admin@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    await expect(StaffPage({})).rejects.toThrow("NEXT_REDIRECT:/admin");
  });

  it("sends signed-out reviewers to login before opening the staff command center", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");

    await expect(StaffPage({})).rejects.toThrow(
      "NEXT_REDIRECT:/login?redirectTo=%2Fstaff%3Fview%3Dchapters",
    );
  });

  it("renders the copied Figma Staff Command Center shell for staff users", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(await StaffPage({}));

    expect(html).toContain("myMEDLIFE");
    expect(html).toContain("Staff Command Center");
    expect(html).toContain("Portfolio Overview");
    expect(html).toContain("20 chapters");
    expect(html).toContain("Jun 17, 2026");
    expect(html).toContain("2 chapters need intervention");

    expect(html).toContain(">Chapters<");
    expect(html).toContain(">Campaigns<");
    expect(html).toContain(">Proof / UGC<");
    expect(html).toContain(">Best Practices<");
    expect(html).toContain(">Campaign SOPs<");
    expect(html).toContain(">Admin<");
    expect(html).not.toContain(">Events<");
    expect(html).not.toContain(">Leaderboard<");

    expect(html).toContain("Avg Events / Month");
    expect(html).toContain("RSVPs");
    expect(html).toContain("Attended");
    expect(html).toContain("Lead→Event %");
    expect(html).toContain("Points/Yr");
    expect(html).toContain("Search chapter or school");
    expect(html).toContain(">Type<");
    expect(html).toContain("High School");
    expect(html).toContain("College / University Chapter");
    expect(html).toContain("Needs Review");
    expect(html).toContain("Export");
  });

  it.each([
    ["events", "Luma event operations", "RSVP, attendance, and point readiness by chapter"],
    ["leaderboard", "Organization leaderboard", "Chapter ranking by attendance-backed points"],
  ])("renders the %s staff launch view from the route query", async (view, expectedEyebrow, expectedTitle) => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({ view }),
      }),
    );

    expect(html).toContain(expectedEyebrow);
    expect(html).toContain(expectedTitle);
    expect(html).not.toContain("Figma page missing - implementation blocked");
  });

  it.each([
    ["feed_studio", "/staff?view=proof_ugc"],
    ["feed_analytics", "/staff?view=proof_ugc"],
    ["hubspot", "/staff?view=chapters"],
    ["support_notes", "/staff?view=chapters"],
  ])("parks the %s staff view inside the launch lane", async (view, expectedHref) => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");

    await expect(
      StaffPage({
        searchParams: Promise.resolve({ view }),
      }),
    ).rejects.toThrow(`NEXT_REDIRECT:${expectedHref}`);
  });

  it.each([
    ["campaigns", "Campaign Operations"],
    ["proof_ugc", "Proof / UGC Review Queue"],
    ["best_practices", "Best Practices Library"],
    ["sops", "Campaign SOP Builder"],
  ])("keeps the %s staff tab route-backed instead of parking it away", async (view, heading) => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({ view }),
      }),
    );

    expect(html).toContain(heading);
  });

  it("keeps proof review submission and sharing controls visibly blocked inside the UGC surface", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({ view: "proof_ugc" }),
      }),
    );
    const source = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");

    expect(html).toContain("Story link ingestion is blocked until proof-review writes are approved");
    expect(html).toContain("provider fetch and queue writes are blocked in this preview");
    expect(source).toContain("External source links are blocked in this preview");
    expect(source).toContain("Proof sharing is blocked until feed publishing approval is complete");
    expect(source).toContain("publishing and distribution actions remain blocked in this launch pass");
  });

  it("keeps campaign SOP creation and publish controls visibly blocked inside the SOP surface", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({ view: "sops" }),
      }),
    );

    expect(html).toContain("New SOP creation is blocked until draft-live safety approval is complete");
    expect(html).toContain("SOP duplication is blocked until template-write approval is complete");
    expect(html).toContain("SOP archiving is blocked until draft-live safety approval is complete");
    expect(html).toContain("Open Builder");
  });

  it("keeps the admin handoff visible but blocked for non-admin staff", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({ view: "admin" }),
      }),
    );

    expect(html).toContain("Admin access blocked");
    expect(html).toContain("This Staff Command Center keeps the Admin handoff visible");
    expect(html).toContain("Current posture");
    expect(html).not.toContain("Enter Admin Panel");
  });

  it("keeps chapter-detail NPS controls preview-only instead of implying a live send", () => {
    const html = renderToStaticMarkup(
      <ChapterDetailDrawer
        chapter={{
          id: "chapter-test",
          name: "Boston College",
          school: "Boston College",
          country: "USA",
          region: "North America",
          medlifeRegion: "New England",
          coach: "Maria Santos",
          leaders: ["Ivy Ramos"],
          activeMembers: 32,
          campaign: "Rush Month",
          campaignStatus: "on-track",
          leads: 48,
          rsvps: 30,
          attendance: 24,
          followUps: 18,
          assignments: 12,
          evidencePending: 2,
          evidenceApproved: 9,
          pointsWeek: 620,
          hubspotLifecycle: "MQL",
          hubspotTasks: 3,
          lumaEvents: 2,
          lastActivity: "2h ago",
          risk: "healthy",
          decision: "Advance",
          healthScore: 84,
          newMembers: 6,
          feedViews: 180,
          chapterType: "established",
          eventsThisYear: 9,
          eventsThisMonth: 2,
          leadAttendancePct: 50,
          avgNpsScore: 62,
          totalPointsYear: 7800,
        }}
        onClose={() => {}}
      />,
    );

    expect(html).toContain("Preview Survey");
    expect(html).toContain("Preview NPS Survey");
    expect(html).toContain("Survey sending stays blocked in this preview");
    expect(html).toContain("Survey sending is blocked in this preview");
    expect(html).not.toContain(">Send NPS Survey<");
  });

  it("allows super admin to open the embedded staff admin path without parking it away", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("super.admin@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({ view: "admin" }),
      }),
    );

    expect(html).toContain("Restricted Access");
    expect(html).toContain("Enter Admin Panel");
    expect(html).toContain("DS Admin");
    expect(html).toContain("Super Admin");
  });

  it("keeps the local staff shell close to the 2,095-line Figma export while allowing route wiring", () => {
    const source = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");
    const lineCount = source.split("\n").length;

    expect(lineCount).toBeGreaterThanOrEqual(2170);
    expect(lineCount).toBeLessThanOrEqual(2245);
    expect(source).toContain("type Screen = \"chapters\" | \"campaigns\" | \"events\" | \"ugc\" | \"reports\" | \"admin\" | \"best-practices\" | \"sops\";");
    expect(source).toContain("const NAV_ITEMS");
    expect(source).toContain("function PortfolioOverview");
    expect(source).toContain("function CampaignOps");
    expect(source).toContain("function ProofUGCQueue");
    expect(source).toContain("function BestPracticesLibrary");
    expect(source).toContain("function AdminRoleGate");
    expect(source).toContain("StaffLaunchEventsOperations");
    expect(source).toContain("StaffLaunchOrganizationLeaderboard");
  });
});
