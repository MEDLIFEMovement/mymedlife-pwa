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
    expect(html).toContain("TEST UC Berkeley");
    expect(html).toContain("TEST Maria Santos");
    expect(html).toContain("Search chapter or school");
    expect(html).toContain(">Type<");
    expect(html).toContain("High School");
    expect(html).toContain("College / University Chapter");
    expect(html).toContain("Needs Review");
    expect(html).toContain("Export blocked");
    expect(html).toContain("pr-[11rem]");
    expect(html).toContain("sm:pr-[16rem]");
    expect(html).toContain("lg:pr-[18rem]");
    expect(html).toContain("xl:pr-[19rem]");
    expect(html).toContain("pointer-events-none");
    expect(html).toContain(
      "pointer-events-none ml-auto min-w-0 flex-none items-center justify-end hidden md:flex max-w-[8.5rem] lg:max-w-[10rem] xl:max-w-[11.5rem]",
    );
    expect(html).toContain("truncate text-xs font-semibold text-red-300");
    expect(html).not.toContain("w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-sidebar");
    expect(html).not.toContain(">TEST Chapters<");
    expect(html).not.toContain(">TEST Campaigns<");
    expect(html).not.toContain(">TEST Proof / UGC<");
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

  it("keeps staff campaign handoffs route-backed while launch and sync actions stay blocked", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({ view: "campaigns" }),
      }),
    );
    const source = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");

    expect(html).toContain('href="/campaigns/rush-month"');
    expect(html).toContain('href="/rush-month/events"');
    expect(html).toContain("Launch blocked");
    expect(html).toContain("writes, syncs, and rollout proof remain preview-only");
    expect(source).toContain('"/campaigns/slt-promotion"');
    expect(source).toContain('"/campaigns/moving-mountains"');
    expect(source).toContain('"/campaigns/leadership-transition"');
    expect(source).toContain('"/campaigns/planning-goal-setting"');
    expect(source).toContain('"/staff?view=events"');
    expect(source).toContain('"/staff?view=proof_ugc"');
  });

  it("opens the requested staff campaign tab when a route-backed campaign query is provided", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({ view: "campaigns", campaign: "social-media" }),
      }),
    );
    const source = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");

    expect(html).toContain("Instagram TY");
    expect(html).toContain("TikTok YoY");
    expect(html).toContain("Open proof / UGC lane");
    expect(html).not.toContain("Events TY");
    expect(source).toContain('params.set("campaign", getStaffCampaignParam(campaign));');
    expect(source).toContain('case "social-media":');
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
    expect(html).toContain("Proof / UGC review stays visible, but moderation writes stay blocked");
    expect(html).toContain("Use this queue to review TEST story context, consent posture, share targets, and the next Admin audit handoff before any publishing, note save, provider ingest, or moderation write is approved.");
    expect(html).toContain("Read-only preview");
    expect(html).toContain("Blocked moderation writes");
    expect(html).toContain("Source-backed Admin handoff");
    expect(html).toContain("Approved (2)");
    expect(html).toContain("Submit blocked");
    expect(html).toContain("TEST Rush Month tabling");
    expect(html).toContain("TEST Priya Nair");
    expect(source).toContain("TEST Best Practice: QR Lead Capture");
    expect(source).toContain("External source links are blocked in this preview");
    expect(source).toContain("Proof sharing is blocked until feed publishing approval is complete");
    expect(source).toContain("Next step: finish consent and coach context here, then open Admin preview for embedded DS audit readback and blocked-control posture before any publishing request.");
    expect(source).toContain("DS Admin audit handoff");
    expect(source).toContain("Review consent and blocked actions here, then open the Admin preview for DS audit readback before any publishing or coach-note approval request.");
    expect(source).toContain('href="/staff?view=admin&adminView=audit&returnView=proof_ugc"');
    expect(source).toContain('href="/staff?view=proof_ugc"');
    expect(source).toContain("Open Admin preview");
    expect(source).toContain("Return to Proof / UGC");
    expect(source).toContain("Embedded Admin review keeps DS directory, audit logs, and blocked controls in the same command-center walkthrough.");
    expect(source).toContain("Admin review approves the next step");
    expect(source).toContain("Click any card to review consent and blocked actions, or open the Admin preview for DS audit readback without leaving the Staff Command Center.");
    expect(source).toContain("Caption and coach-note drafting stays local-only in this preview");
    expect(source).toContain("Return to Proof / UGC after Admin readback to continue the same review loop in the staff shell.");
    expect(source).toContain("Return to Proof / UGC after the Admin readback to continue the same Command Center review loop.");
    expect(source).toContain("Open chapter drawer");
    expect(source).toContain("Keep the same chapter loop intact: after Admin readback, reopen this chapter drawer if the story needs coach or chapter follow-through.");
    expect(source).toContain("If a chapter needs follow-up after that Admin readback, reopen the chapter drawer from this same Command Center flow instead of leaving the staff shell.");
    expect(source).toContain("Reopen the chapter drawer from this queue when a story needs chapter-specific follow-through after the Admin review pass.");
    expect(source).toContain("buildStaffChapterHref(selectedCardChapter.id, pathname, searchParams.toString())");
    expect(source).toContain("Next review step");
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

  it("keeps best-practice sharing controls visibly blocked inside the staff library surface", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({ view: "best_practices" }),
      }),
    );

    expect(html).toContain("Best-practice sharing stays visible for review");
    expect(html).toContain("feed publishing, coach outreach, and bookmarking remain blocked in this preview");
    expect(html).toContain("TEST QR Code Lead Capture at Multi-Event Weekend");
    expect(html).toContain("TEST Stanford University");
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
    expect(html).toContain("admin preview route");
    expect(html).toContain("Current posture");
    expect(html).toContain("embedded admin preview from the staff workspace");
    expect(html).toContain("Return to chapters");
    expect(html).not.toContain("Open Admin preview");
  });

  it("keeps the proof review admin handoff wired to a Proof / UGC return target in source", () => {
    const source = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");

    expect(source).toContain('href="/staff?view=admin&adminView=audit&returnView=proof_ugc"');
    expect(source).toContain("resolveStaffAdminReturnScreen");
    expect(source).toContain('if (screen === "ugc") return "Proof / UGC";');
    expect(source).toContain('return chapterId ? "this chapter" : "chapters";');
    expect(source).toContain("buildStaffChapterHref");
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
    expect(html).toContain("Send blocked");
    expect(html).toContain("Preview readback only - no chapter writes, owner changes, or outreach sends run from this drawer.");
    expect(html).toContain("Use the Admin preview for DS directory and audit review.");
    expect(html).toContain("Survey sending stays blocked in this preview");
    expect(html).toContain("Survey sending is blocked in this preview");
    expect(html).toContain("Coach notes stay preview-only in this chapter drawer");
    expect(html).toContain("Next step: open the Admin preview for DS directory readback, audit, and blocked-control follow-through before requesting any write path.");
    expect(html).toContain("Return to this chapter in the same Command Center loop after the Admin readback closes.");
    expect(html).toContain('href="/staff?view=admin&amp;adminView=chapters&amp;returnView=chapters&amp;chapter=chapter-test"');
    expect(html).toContain("Open Admin preview");
    expect(html).toContain("Return to chapters");
    expect(html).toContain("Return to the chapters overview after this preview readback");
    expect(html).toContain("No note save, intervention status write, or follow-up task write runs for Boston College from this surface.");
    expect(html).toContain("disabled:cursor-not-allowed");
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

    expect(html).toContain("Restricted Preview Access");
    expect(html).toContain("Preview as");
    expect(html).toContain("Open Admin preview");
    expect(html).toContain("DS Admin");
    expect(html).toContain("Super Admin");
    const source = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");
    expect(source).toContain("Retry blocked");
    expect(source).toContain("Previewing as");
  });

  it("keeps the local staff shell close to the 2,095-line Figma export while allowing route wiring", () => {
    const source = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");
    const lineCount = source.split("\n").length;

    expect(lineCount).toBeGreaterThanOrEqual(2170);
    expect(lineCount).toBeLessThanOrEqual(2525);
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
