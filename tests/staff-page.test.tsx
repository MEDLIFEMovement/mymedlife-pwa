import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { ChapterDetailDrawer } from "@/components/figma-staff-command-center";

let mockPathname = "/staff";
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    replace: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
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
    mockPathname = "/staff";
    mockSearchParams = new URLSearchParams();
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
      "NEXT_REDIRECT:/login?redirectTo=%2Fstaff",
    );

    await expect(
      StaffPage({
        searchParams: Promise.resolve({
          view: "events",
          chapter: "Test UCLA",
        }),
      }),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/login?redirectTo=%2Fstaff%3Fview%3Devents%26chapter%3DTest%2BUCLA",
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
    expect(html).toContain("Operational workspace");
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
    expect(html).toContain('whitespace-nowrap">TEST Maria Santos</td>');
    expect(html).not.toContain('whitespace-nowrap">TEST</td>');
    expect(html).toContain("Search chapter or school");
    expect(html).toContain(">Type<");
    expect(html).toContain("High School");
    expect(html).toContain("College / University Chapter");
    expect(html).toContain("Needs Review");
    expect(html).toContain("Export blocked");
    expect(html).toContain("pr-[4.5rem]");
    expect(html).toContain("sm:pr-[16rem]");
    expect(html).toContain("lg:pr-[19rem]");
    expect(html).toContain("xl:pr-[21rem]");
    expect(html).toContain("flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden");
    expect(html).toContain("flex min-w-0 shrink items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all lg:px-3");
    expect(html).toContain("<span class=\"truncate\">Campaign SOPs</span>");
    expect(html).toContain("pointer-events-none");
    expect(html).toContain(
      "pointer-events-none ml-auto min-w-0 flex-none items-center justify-end hidden md:flex max-w-[7rem] lg:max-w-[8.5rem] xl:max-w-[10rem] 2xl:max-w-[11.5rem]",
    );
    expect(html).toContain("truncate text-xs font-semibold text-red-300");
    expect(html).not.toContain("w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-sidebar");
    expect(html).not.toContain(">TEST Chapters<");
    expect(html).not.toContain(">TEST Campaigns<");
    expect(html).not.toContain(">TEST Proof / UGC<");
  });

  it.each([
    ["events", "Live event-loop readback", "RSVP, attendance, and points by chapter"],
    ["leaderboard", "Live organization leaderboard", "Chapter ranking by attendance-backed points"],
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

  it("renders a visible selected-event state for the staff Open event route", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "events",
          campaign: "rush-month",
          event: "chapter-event-ucla-kickoff",
        }),
      }),
    );

    expect(html).toContain("Selected event");
    expect(html).toContain("Rush Month kickoff social");
    expect(html).toContain("Back to all events");
    expect(html).toContain('aria-current="true"');
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
    expect(source).toContain("const selectedCardId = searchParams.get(\"ugcCard\") ?? initialSelectedCardId;");
    expect(source).toContain("resolveProofQueueStatusFilter(searchParams.get(\"proofStatus\"), initialStatusFilter)");
    expect(source).toContain("resolveProofQueuePlatformFilter(searchParams.get(\"proofPlatform\"), initialPlatformFilter)");
    expect(source).toContain("handleFilterChange(");
    expect(source).toContain('params.set("proofStatus", nextStatusFilter);');
    expect(source).toContain('params.set("proofPlatform", nextPlatformFilter);');
    expect(source).toContain('params.delete("ugcCard");');
    expect(source).toContain("matchesProofQueueFilters(selectedCard, nextStatusFilter, nextPlatformFilter)");
    expect(source).toContain("buildStaffAdminProofHref(");
    expect(source).toContain("selectedCard.chapter");
    expect(source).toContain("const currentSearch = searchParams.toString() || initialRouteSearch;");
    expect(source).toContain("buildStaffProofHref(pathname, currentSearch, selectedCard.id)");
    expect(source).toContain("const genericProofAdminHref = buildStaffAdminProofHref(pathname, currentSearch);");
    expect(source).toContain("const genericProofQueueHref = buildStaffProofHref(pathname, currentSearch);");
    expect(source).toContain("const proofQueueReturnLoopLabel = getStaffAdminReturnLoopLabel(");
    expect(source).toContain("const adminProofQueueContext =");
    expect(source).toContain('getEmbeddedProofQueueContext(getRouteParam("proofStatus"), getRouteParam("proofPlatform"))');
    expect(source).toContain("Open Admin preview");
    expect(source).toContain("Return to Proof / UGC");
    expect(source).toContain("Embedded Admin review keeps DS directory, audit logs, and blocked controls in the same command-center walkthrough.");
    expect(source).toContain("Admin review approves the next step");
    expect(source).toContain("Click any card to review consent and blocked actions, or open the Admin preview for DS audit readback without leaving the Staff Command Center.");
    expect(source).toContain("Caption and coach-note drafting stays local-only in this preview");
    expect(source).toContain("const selectedCardReturnLoopLabel = selectedCard");
    expect(source).toContain("Open chapter drawer");
    expect(source).toContain("buildStaffChapterHref(");
    expect(source).toContain("selectedCardChapter.id");
    expect(source).toContain("selectedCard.id");
    expect(source).toContain("Keep the same chapter loop intact: after Admin readback, reopen this chapter drawer if the story needs coach or chapter follow-through.");
    expect(source).toContain("If a chapter needs follow-up after that Admin readback, reopen the chapter drawer from this same Command Center flow instead of leaving the staff shell.");
    expect(source).toContain("Reopen the chapter drawer from this queue when a story needs chapter-specific follow-through after the Admin review pass.");
    expect(source).toContain("getEmbeddedProofQueueContext(");
    expect(source).toContain("Next review step");
  });

  it("keeps Proof / UGC queue context route-backed for admin return loops", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "proof_ugc",
          proofStatus: "pending",
          proofPlatform: "instagram",
        }),
      }),
    );

    expect(html).toContain("1 stories");
    expect(html).toContain("TEST Rush Month tabling");
    expect(html).not.toContain("TEST Bridge Video: Why I joined MEDLIFE");
    expect(html).toContain("Return to Proof / UGC (Pending · Instagram) after the Admin readback to continue the same Command Center review loop.");
    expect(html).toContain("Return to chapters");
    expect(html).toContain(
      "Return to chapters after the Admin readback to confirm the chapter follow-through in the same Command Center loop.",
    );
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
    expect(html).toContain("When DS Admin access is available, return to chapters in the same Command Center review loop after the Admin readback closes.");
    expect(html).toContain("Return to chapters");
    expect(html).toContain('href="/staff?view=chapters"');
    expect(html).not.toContain("Open Admin preview");
  });

  it("keeps chapter review context visible when admin access is blocked from a chapter-linked handoff", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "admin",
          adminView: "chapters",
          returnView: "chapters",
          chapter: "chapter-test",
          chapterContext: "TEST Boston College",
          chapterSchool: "TEST Boston College",
          chapterRegionName: "New England",
          chapterCoachName: "TEST Maria Santos",
          chapterMembers: "32",
          chapterEvents: "2",
          chapterRsvps: "30",
          chapterAttendance: "24",
          chapterPoints: "7800",
          chapterPointsWeek: "620",
        }),
      }),
    );

    expect(html).toContain("Chapter review context: TEST Boston College");
    expect(html).toContain(">Chapters</h1>");
    expect(html).toContain(
      "Chapter oversight for TEST Boston College stays read-only here: event readiness, RSVP totals, attendance readback, and points posture should be reviewed in Admin before any correction request.",
    );
    expect(html).toContain("When DS Admin access is available, return to TEST Boston College in Chapters in the same Command Center review loop after the Admin readback closes.");
    expect(html).toContain("Return to TEST Boston College in Chapters");
    expect(html).toContain("TEST Boston College");
    expect(html).toContain("New England");
    expect(html).toContain("TEST Maria Santos");
    expect(html).toContain(">32</div>");
    expect(html).toContain("Risk posture");
    expect(html).toContain("Carry TEST Boston College&#x27;s risk context through this blocked Admin handoff before requesting any blocked-control follow-through or correction path.");
    expect(html).toContain(">Handoff source</div><div class=\"mt-1 text-[12px] font-mono font-semibold text-slate-200\">Staff chapter drawer</div>");
    expect(html).toContain(">Return target</div><div class=\"mt-1 text-[12px] font-mono font-semibold text-slate-200\">TEST Boston College in Chapters</div>");
    expect(html).toContain("2 events this month");
    expect(html).toContain("Review-only TEST Boston College readback");
    expect(html).toContain("30 RSVPs");
    expect(html).toContain("Carry TEST Boston College back out to Chapters");
    expect(html).toContain("24 attended");
    expect(html).toContain("No attendance correction path runs here for TEST Boston College");
  expect(html).toContain("+620 this week");
  expect(html).toContain("TEST Boston College points posture stays oversight-only");
  expect(html).toContain("7,800");
  expect(html).toContain("Keep TEST Boston College in the same review loop before any correction request");
  expect(html).toContain('href="/staff?view=chapters&amp;chapter=chapter-test&amp;chapterContext=TEST+Boston+College&amp;chapterSchool=TEST+Boston+College&amp;chapterRegionName=New+England&amp;chapterCoachName=TEST+Maria+Santos&amp;chapterMembers=32&amp;chapterEvents=2&amp;chapterRsvps=30&amp;chapterAttendance=24&amp;chapterPoints=7800&amp;chapterPointsWeek=620"');
  });

  it("fills blocked admin route chapter oversight readback from sparse chapter context", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "admin",
          adminView: "chapters",
          returnView: "chapters",
          chapter: "ch13",
          chapterContext: "Stanford University",
        }),
      }),
    );
    const source = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");

    expect(html).toContain("Chapter review context: TEST Stanford University");
    expect(html).toContain("TEST Stanford University");
    expect(html).toContain(
      "Chapter oversight for TEST Stanford University stays read-only here: event readiness, RSVP totals, attendance readback, and points posture should be reviewed in Admin before any correction request.",
    );
    expect(html).toContain("West");
    expect(html).toContain("TEST James Okafor");
    expect(html).toContain(">52</div>");
    expect(html).toContain("5 events this month");
    expect(html).toContain("Review-only TEST Stanford University readback");
    expect(html).toContain("80 RSVPs");
    expect(html).toContain("Carry TEST Stanford University back out to Chapters");
    expect(html).toContain("68 attended");
    expect(html).toContain("No attendance correction path runs here for TEST Stanford University");
    expect(html).toContain("+1890 this week");
    expect(html).toContain("TEST Stanford University points posture stays oversight-only");
    expect(html).toContain("22,100");
    expect(html).toContain("Keep TEST Stanford University in the same review loop before any correction request");
    expect(html).toContain("When DS Admin access is available, return to TEST Stanford University in Chapters in the same Command Center review loop after the Admin readback closes.");
    expect(html).toContain(
      ">Return target</div><div class=\"mt-1 text-[12px] font-mono font-semibold text-slate-200\">TEST Stanford University in Chapters</div>",
    );
    expect(source).toContain("enrichStaffAdminChapterReadback(");
    expect(source).toContain("const adminDisplayChapterContext = adminChapterReadback?.chapterContext ?? adminChapterContext;");
  });

  it("keeps chapter oversight readback visible in the admin role gate before opening the embedded admin shell", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("super.admin@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "admin",
          adminView: "chapters",
          returnView: "chapters",
          chapter: "ch13",
          chapterContext: "TEST Stanford University",
          chapterSchool: "TEST Stanford University",
          chapterRegionName: "West",
          chapterCoachName: "TEST James Okafor",
          chapterMembers: "52",
          chapterEvents: "5",
          chapterRsvps: "80",
          chapterAttendance: "68",
          chapterPoints: "22100",
          chapterPointsWeek: "1890",
        }),
      }),
    );

    expect(html).toContain("Restricted Preview Access");
    expect(html).toContain("Chapter review context: TEST Stanford University");
    expect(html).toContain(
      "Open Admin preview to read back event readiness, RSVP totals, attendance context, and points posture for TEST Stanford University before requesting any correction path.",
    );
    expect(html).toContain(
      "After the Admin readback, return to TEST Stanford University in Chapters in the same Command Center review loop.",
    );
    expect(html).toContain("Return to TEST Stanford University in Chapters");
    expect(html).toContain("TEST Stanford University");
    expect(html).toContain("West");
    expect(html).toContain("TEST James Okafor");
    expect(html).toContain(">52</div>");
    expect(html).toContain("Risk posture");
    expect(html).toContain("Carry TEST Stanford University&#x27;s risk context through this Admin gate before requesting any blocked-control follow-through or correction path.");
    expect(html).toContain(">Handoff source</div><div class=\"mt-1 text-[12px] font-mono font-semibold text-slate-200\">Staff chapter drawer</div>");
    expect(html).toContain(">Return target</div><div class=\"mt-1 text-[12px] font-mono font-semibold text-slate-200\">TEST Stanford University in Chapters</div>");
    expect(html).toContain("5 events this month");
    expect(html).toContain("80 RSVPs");
    expect(html).toContain("68 attended");
    expect(html).toContain("+1890 this week");
    expect(html).toContain("22,100");
  });

  it("keeps a route-backed chapter return visible inside the embedded admin review surface", async () => {
    mockPathname = "/staff";
    mockSearchParams = new URLSearchParams({
      view: "admin",
      adminView: "chapters",
      returnView: "chapters",
      chapter: "ch13",
      chapterContext: "TEST Stanford University",
      chapterRegion: "West",
      chapterSort: "points",
    });

    const { FigmaAdminPanel } = await import("@/components/figma-admin-panel");
    const html = renderToStaticMarkup(
      <FigmaAdminPanel
        initialActive="chapters"
        onBack={vi.fn()}
        embeddedBackLabel="this chapter"
        embeddedBackHref="/staff?view=chapters&chapter=ch13&chapterRegion=West&chapterSort=points"
        embeddedChapterHref="/staff?view=chapters&chapter=ch13&chapterRegion=West&chapterSort=points"
      />,
    );
    const staffSource = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");
    const adminSource = readFileSync("src/components/figma-admin-panel.tsx", "utf8");

    expect(html).toContain("Command Center");
    expect(html).toContain('role="button"');
    expect(html).toContain("Return to Chapters");
    expect(html).toContain("Return: TEST Stanford University in Chapters");
    expect(html).toContain("Chapter: TEST Stanford University");
    expect(html).toContain(
      "Return with Command Center to TEST Stanford University in Chapters after this chapter review pass, or use the top-right menu to switch workspaces or log out.",
    );
    expect(html).toContain("Embedded Chapter Review");
    expect(html).toContain(
      "Use this Admin readback to confirm event readiness, RSVP totals, attendance context, and points posture for TEST Stanford University before requesting any blocked-control follow-through or correction path.",
    );
    expect(html).toContain(">School</div><div class=\"mt-1 text-[13px] font-mono font-semibold text-slate-100\">TEST Stanford University</div>");
    expect(html).toContain(">Region</div><div class=\"mt-1 text-[13px] font-mono font-semibold text-slate-100\">West</div>");
    expect(html).toContain(">Coach</div><div class=\"mt-1 text-[13px] font-mono font-semibold text-slate-100\">TEST James Okafor</div>");
    expect(html).toContain(">Active Members</div><div class=\"mt-1 text-[13px] font-mono font-semibold text-slate-100\">52</div>");
    expect(html).toContain(
      "After this Admin readback, return to Chapters with TEST Stanford University still selected in the same Command Center review loop to keep the chapter oversight context intact.",
    );
    expect(html).toContain('href="/staff?view=chapters&amp;chapter=ch13&amp;chapterRegion=West&amp;chapterSort=points"');
    expect(staffSource).toContain("const adminReturnHref =");
    expect(staffSource).toContain('adminReturnScreen === "chapters"');
    expect(staffSource).toContain("buildStaffChapterHref(");
    expect(staffSource).toContain("adminReturnChapterId");
    expect(staffSource).toContain("currentRouteSearch");
    expect(staffSource).toContain('embeddedBackHref={adminReturnHref ?? undefined}');
    expect(adminSource).toContain("embeddedBackHref");
    expect(adminSource).toContain("embeddedChapterHref");
    expect(adminSource).toContain("href={backHref ?? \"#\"}");
    expect(adminSource).toContain('role="button"');
  });

  it("keeps a route-backed proof queue return visible inside the embedded admin review surface", async () => {
    mockPathname = "/staff";
    mockSearchParams = new URLSearchParams({
      view: "admin",
      adminView: "audit",
      returnView: "proof_ugc",
      ugcCard: "ugc4",
      chapterContext: "TEST Stanford University",
      proofStatus: "pending",
      proofPlatform: "instagram",
    });

    const { FigmaAdminPanel } = await import("@/components/figma-admin-panel");
    const html = renderToStaticMarkup(
      <FigmaAdminPanel
        initialActive="audit"
        onBack={vi.fn()}
        embeddedBackLabel="Proof / UGC"
        embeddedBackHref="/staff?view=proof_ugc&ugcCard=ugc4&chapterContext=TEST+Stanford+University&proofStatus=pending&proofPlatform=instagram"
      />,
    );
    const staffSource = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");

    expect(html).toContain("Command Center");
    expect(html).toContain("Return to TEST Stanford University in Proof / UGC (Pending · Instagram)");
    expect(html).toContain("Embedded Proof Review");
    expect(html).toContain("Return: TEST Stanford University in Proof / UGC (Pending · Instagram)");
    expect(html).toContain("Context: TEST Stanford University");
    expect(html).toContain("Queue: Pending · Instagram");
    expect(html).toContain("Queue context: Pending · Instagram");
    expect(html).toContain(
      "Use this Admin readback to verify chapter oversight context for TEST Stanford University while preserving the same Pending · Instagram moderation queue.",
    );
    expect(html).toContain(
      "Return with Command Center to TEST Stanford University in Proof / UGC (Pending · Instagram) after this review pass, or use the top-right menu to switch workspaces or log out.",
    );
    expect(html).toContain('href="/staff?view=proof_ugc&amp;ugcCard=ugc4&amp;chapterContext=TEST+Stanford+University&amp;proofStatus=pending&amp;proofPlatform=instagram"');
    expect(staffSource).toContain('adminReturnScreen === "ugc"');
    expect(staffSource).toContain('buildStaffProofHref(pathname, currentRouteSearch, getRouteParam("ugcCard"))');
  });

  it("keeps an explicit chapter return visible inside embedded admin chapter review even when the sidebar returns to Proof / UGC", async () => {
    mockPathname = "/staff";
    mockSearchParams = new URLSearchParams({
      view: "admin",
      adminView: "chapters",
      returnView: "proof_ugc",
      chapter: "ch13",
      chapterContext: "TEST Stanford University",
      chapterEvents: "5",
      chapterRsvps: "80",
      chapterAttendance: "68",
      chapterPoints: "22100",
      chapterPointsWeek: "1890",
      ugcCard: "ugc4",
      proofStatus: "pending",
      proofPlatform: "instagram",
    });

    const { FigmaAdminPanel } = await import("@/components/figma-admin-panel");
    const html = renderToStaticMarkup(
      <FigmaAdminPanel
        initialActive="chapters"
        onBack={vi.fn()}
        embeddedBackLabel="Proof / UGC"
        embeddedBackHref="/staff?view=proof_ugc&ugcCard=ugc4&chapterContext=TEST+Stanford+University&proofStatus=pending&proofPlatform=instagram"
        embeddedChapterHref="/staff?view=chapters&chapter=ch13&ugcCard=ugc4&proofStatus=pending&proofPlatform=instagram"
      />,
    );
    const staffSource = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");
    const adminSource = readFileSync("src/components/figma-admin-panel.tsx", "utf8");

    expect(html).toContain("Command Center");
    expect(html).toContain('href="/staff?view=proof_ugc&amp;ugcCard=ugc4&amp;chapterContext=TEST+Stanford+University&amp;proofStatus=pending&amp;proofPlatform=instagram"');
    expect(html).toContain("Return to Chapters");
    expect(html).toContain(
      'href="/staff?view=chapters&amp;chapter=ch13&amp;ugcCard=ugc4&amp;proofStatus=pending&amp;proofPlatform=instagram&amp;chapterContext=TEST+Stanford+University&amp;chapterSchool=TEST+Stanford+University&amp;chapterRegionName=West&amp;chapterCoachName=TEST+James+Okafor&amp;chapterMembers=52&amp;chapterRisk=healthy&amp;chapterEvents=5&amp;chapterRsvps=80&amp;chapterAttendance=68&amp;chapterPoints=22100&amp;chapterPointsWeek=1890"',
    );
    expect(staffSource).toContain("const adminChapterReturnHref =");
    expect(staffSource).toContain('adminProofQueueContext ? getRouteParam("ugcCard") : null');
    expect(staffSource).toContain('embeddedChapterHref={adminChapterReturnHref ?? undefined}');
    expect(adminSource).toContain("const resolvedEmbeddedChapterHref = embeddedChapterHref ?? embeddedBackHref;");
  });

  it("keeps the proof review admin handoff wired to a Proof / UGC return target in source", () => {
    const source = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");

    expect(source).toContain("buildStaffAdminProofHref");
    expect(source).toContain('params.set("returnView", "proof_ugc");');
    expect(source).toContain('params.set("ugcCard", cardId);');
    expect(source).toContain('params.set("chapterContext", chapterContext);');
    expect(source).toContain('params.delete("ugcCard");');
    expect(source).toContain("resolveStaffAdminReturnScreen");
    expect(source).toContain('if (screen === "ugc") return "Proof / UGC";');
    expect(source).toContain('return chapterId ? "this chapter" : "chapters";');
    expect(source).toContain("buildStaffChapterHref");
    expect(source).toContain("return `${chapterContext} in Proof / UGC (${proofQueueContext})`;");
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
    expect(html).toContain("Use the Admin preview for DS directory readback, event readiness, RSVP totals, attendance context, points posture, and audit review.");
    expect(html).toContain("Survey sending stays blocked in this preview");
    expect(html).toContain("Survey sending is blocked in this preview");
    expect(html).toContain("Coach notes stay preview-only in this chapter drawer");
    expect(html).toContain("Event, RSVP, attendance, and points figures stay read-only in this chapter drawer.");
    expect(html).toContain("Use the embedded Admin preview to verify event readiness, RSVP totals, attendance context, and points posture before requesting any attendance correction, point adjustment, or event-status write.");
    expect(html).toContain("Event readiness");
    expect(html).toContain("2 events this month");
    expect(html).toContain("Read-only Boston College readback");
    expect(html).toContain("30 RSVPs");
    expect(html).toContain("Carry Boston College into embedded Admin");
    expect(html).toContain("24 attended");
    expect(html).toContain("Review Boston College before any correction request");
    expect(html).toContain("+620 this week");
    expect(html).toContain("Boston College points posture stays preview-only");
    expect(html).toContain("Risk posture");
    expect(html).toContain("Carry Boston College&#x27;s risk context into the embedded Admin readback.");
    expect(html).toContain("Staff chapter drawer");
    expect(html).toContain("Boston College in Chapters");
    expect(html).toContain("Keep Boston College visible in embedded Admin.");
    expect(html).toContain("Return to Boston College in Chapters after the Admin readback closes.");
    expect(html).toContain("Next step: open the Admin preview for DS directory readback, event readiness, RSVP totals, attendance context, points posture, and blocked-control follow-through before requesting any write path.");
    expect(html).toContain("Return to this chapter in the same Command Center loop after the Admin readback closes.");
    expect(html).toContain('href="/staff?view=admin&amp;adminView=chapters&amp;returnView=chapters&amp;chapter=chapter-test&amp;chapterContext=Boston+College&amp;chapterSchool=Boston+College&amp;chapterRegionName=New+England&amp;chapterCoachName=Maria+Santos&amp;chapterMembers=32&amp;chapterRisk=healthy&amp;chapterEvents=2&amp;chapterRsvps=30&amp;chapterAttendance=24&amp;chapterPoints=7800&amp;chapterPointsWeek=620"');
    expect(html).toContain("Open Admin preview");
    expect(html).toContain("Return to Boston College in Chapters");
    expect(html).toContain("Return to Chapters with Boston College still selected in the same chapters review loop after this preview readback");
    expect(html).toContain('href="/staff?view=chapters"');
    expect(html).toContain("No note save, intervention status write, or follow-up task write runs for Boston College from this surface.");
    expect(html).toContain("disabled:cursor-not-allowed");
    expect(html).not.toContain(">Send NPS Survey<");
  });

  it("keeps the chapter drawer return cue route-backed with chapter filter context", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "chapters",
          chapter: "ch13",
          chapterRegion: "West",
          chapterSort: "points",
        }),
      }),
    );
    const source = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");

    expect(html).toContain("Return to TEST Stanford University in Chapters");
    expect(html).toContain(
      'href="/staff?view=chapters&amp;chapterRegion=West&amp;chapterSort=points"',
    );
    expect(source).toContain("const resolvedChapterReturnHref =");
    expect(source).toContain('chapterReturnHref ?? buildStaffShellHref("chapters", pathname, searchParams.toString())');
    expect(source).toContain('const chapterReturnLabel = `Return to ${chapter.name} in Chapters`;');
    expect(source).toContain('chapterReturnHref={buildStaffShellHref("chapters", pathname, currentRouteSearch)}');
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
    expect(html).toContain("After the Admin readback, return to chapters in the same Command Center review loop.");
    expect(html).toContain("DS Admin");
    expect(html).toContain("Super Admin");
    expect(html).toContain('href="/staff?view=chapters"');
    const source = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");
    expect(source).toContain("Retry blocked");
    expect(source).toContain("Previewing as");
    expect(source).toContain("backHref={adminReturnHref ?? undefined}");
  });

  it("keeps proof review context visible in the admin role gate before opening the embedded admin shell", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("super.admin@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "admin",
          adminView: "audit",
          returnView: "proof_ugc",
          ugcCard: "ugc4",
          chapterContext: "TEST Stanford University",
          proofStatus: "pending",
          proofPlatform: "instagram",
        }),
      }),
    );

    expect(html).toContain("Proof review context: TEST Stanford University (Pending · Instagram)");
    expect(html).toContain(">Audit Logs</h1>");
    expect(html).toContain("Restricted to DS Admin and Super Admin only · Proof / UGC review for TEST Stanford University (Pending · Instagram)");
    expect(html).toContain("After the Admin readback, return to TEST Stanford University in Proof / UGC (Pending · Instagram) in the same Command Center review loop.");
    expect(html).toContain("Return to TEST Stanford University in Proof / UGC (Pending · Instagram)");
  });

  it("keeps proof queue context visible when admin access is blocked from a proof-linked handoff", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "admin",
          adminView: "audit",
          returnView: "proof_ugc",
          ugcCard: "ugc4",
          chapterContext: "TEST Stanford University",
          proofStatus: "pending",
          proofPlatform: "instagram",
        }),
      }),
    );

    expect(html).toContain("Admin access blocked");
    expect(html).toContain("Proof review context: TEST Stanford University (Pending · Instagram)");
    expect(html).toContain(">Audit Logs</h1>");
    expect(html).toContain("Return to TEST Stanford University in Proof / UGC (Pending · Instagram)");
    expect(html).toContain("Restricted to DS Admin and Super Admin only · Proof / UGC review for TEST Stanford University (Pending · Instagram)");
    expect(html).toContain("When DS Admin access is available, return to TEST Stanford University in Proof / UGC (Pending · Instagram) in the same Command Center review loop after the Admin readback closes.");
  });

  it("keeps proof queue filter context on the proof-to-admin handoff from first render", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "proof_ugc",
          ugcCard: "ugc4",
          proofStatus: "pending",
          proofPlatform: "instagram",
        }),
      }),
    );
    const source = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");

    expect(html).toContain("TEST Stanford University");
    expect(html).toContain("Return to TEST Stanford University in Proof / UGC (Pending · Instagram)");
    expect(html).toContain("Return to TEST Stanford University in Proof / UGC (Pending · Instagram) after the Admin readback to continue the same Command Center review loop.");
    expect(html).toContain("Return to TEST Stanford University in Proof / UGC (Pending · Instagram) after Admin readback to continue the same review loop in the staff shell.");
    expect(html).toContain('href="/staff?view=admin&amp;ugcCard=ugc4&amp;proofStatus=pending&amp;proofPlatform=instagram&amp;adminView=audit&amp;returnView=proof_ugc&amp;chapterContext=TEST+Stanford+University"');
    expect(source).toContain("const currentSearch = searchParams.toString() || initialRouteSearch;");
    expect(source).toContain('initialSelectedCardId={getRouteParam("ugcCard")}');
    expect(source).toContain("const selectedCardId = searchParams.get(\"ugcCard\") ?? initialSelectedCardId;");
    expect(source).toContain("const adminHeaderSubtitle =");
    expect(source).toContain("const adminPreviewTitle =");
    expect(source).toContain("getStaffAdminPreviewTitle(getRouteParam(\"adminView\"))");
    expect(source).toContain('const isEmbeddedAdminOpen = activeScreen === "admin" && Boolean(adminRole) && canAccessAdminPanel;');
    expect(source).toContain("{!isEmbeddedAdminOpen && (");
    expect(source).toContain(
      "const adminDisplayChapterContext = adminChapterReadback?.chapterContext ?? adminChapterContext;",
    );
    expect(source).toContain("getStaffAdminHeaderSubtitle(");
    expect(source).toContain("getStaffAdminReturnLoopLabel(");
  });

  it("keeps proof review chapter follow-through route-backed from the selected story panel", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "proof_ugc",
          ugcCard: "ugc4",
          proofStatus: "pending",
          proofPlatform: "instagram",
        }),
      }),
    );
    const source = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");

    expect(html).toContain("Open chapter drawer");
    expect(html).toContain(
      'href="/staff?view=chapters&amp;ugcCard=ugc4&amp;proofStatus=pending&amp;proofPlatform=instagram&amp;chapter=ch13"',
    );
    expect(html).toContain('href="/staff?view=chapters"');
    expect(html).toContain("Return to chapters after Admin readback to confirm the chapter follow-through in the same staff shell.");
    expect(html).toContain("Keep the same chapter loop intact: after Admin readback, reopen this chapter drawer if the story needs coach or chapter follow-through.");
    expect(html).toContain("If a chapter needs follow-up after that Admin readback, reopen the chapter drawer from this same Command Center flow instead of leaving the staff shell.");
    expect(html).toContain("Reopen the chapter drawer from this queue when a story needs chapter-specific follow-through after the Admin review pass.");

    const chapterHtml = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "chapters",
          chapter: "ch13",
          ugcCard: "ugc4",
          proofStatus: "pending",
          proofPlatform: "instagram",
        }),
      }),
    );

    expect(chapterHtml).toContain('href="/staff?view=admin');
    expect(chapterHtml).toContain("adminView=chapters");
    expect(chapterHtml).toContain("returnView=proof_ugc");
    expect(chapterHtml).toContain("chapter=ch13");
    expect(chapterHtml).toContain("ugcCard=ugc4");
    expect(chapterHtml).toContain("proofStatus=pending");
    expect(chapterHtml).toContain("proofPlatform=instagram");
    expect(chapterHtml).toContain("chapterContext=TEST+Stanford+University");
    expect(chapterHtml).toContain("chapterSchool=TEST+Stanford+University");
    expect(chapterHtml).toContain("chapterRegionName=West");
    expect(chapterHtml).toContain("chapterCoachName=TEST+James+Okafor");
    expect(chapterHtml).toContain("chapterMembers=52");
    expect(chapterHtml).toContain("chapterEvents=5");
    expect(chapterHtml).toContain("chapterRsvps=80");
    expect(chapterHtml).toContain("chapterAttendance=68");
    expect(chapterHtml).toContain("chapterPoints=22100");
    expect(chapterHtml).toContain("chapterPointsWeek=1890");
    expect(chapterHtml).toContain("Return to Proof / UGC (Pending · Instagram)");
    expect(chapterHtml).toContain(
      'href="/staff?view=proof_ugc&amp;ugcCard=ugc4&amp;proofStatus=pending&amp;proofPlatform=instagram"',
    );
    expect(chapterHtml).toContain(
      "Return to Proof / UGC (Pending · Instagram) after this chapter review pass.",
    );
    expect(source).toContain('buildStaffProofHref(pathname, currentRouteSearch, getRouteParam("ugcCard"))');
  });

  it("keeps chapter portfolio filter context route-backed for the chapter review loop", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "chapters",
          chapterRegion: "West",
          chapterSort: "points",
        }),
      }),
    );
    const source = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");

    expect(html).toContain("2 chapters");
    expect(html).toContain("filtered");
    expect(html).toContain("TEST Stanford University");
    expect(html).toContain("TEST UC Berkeley");
    expect(html).not.toContain("TEST Yale University");
    expect(source).toContain("searchParams.get(\"chapterSearch\") ?? initialSearch");
    expect(source).toContain("searchParams.get(\"chapterRegion\") ?? initialRegionFilter");
    expect(source).toContain("searchParams.get(\"chapterCoach\") ?? initialCoachFilter");
    expect(source).toContain("resolveStaffChapterTypeFilter(searchParams.get(\"chapterType\"), initialChapterTypeFilter)");
    expect(source).toContain("resolveStaffChapterSort(searchParams.get(\"chapterSort\"), initialSortBy)");
    expect(source).toContain("handleChapterFilterChange");
    expect(source).toContain('params.set(key, value);');
    expect(source).not.toContain('ch.coach.split(" ")[0]');
  });

  it("keeps chapter portfolio filter context on the chapter-to-admin handoff", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "chapters",
          chapter: "ch13",
          chapterRegion: "West",
          chapterSort: "points",
        }),
      }),
    );
    const source = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");

    expect(html).toContain('href="/staff?view=admin&amp;chapter=ch13&amp;chapterRegion=West&amp;chapterSort=points&amp;adminView=chapters&amp;returnView=chapters&amp;chapterContext=TEST+Stanford+University&amp;chapterSchool=TEST+Stanford+University&amp;chapterRegionName=West&amp;chapterCoachName=TEST+James+Okafor&amp;chapterMembers=52&amp;chapterRisk=healthy&amp;chapterEvents=5&amp;chapterRsvps=80&amp;chapterAttendance=68&amp;chapterPoints=22100&amp;chapterPointsWeek=1890"');
    expect(source).toContain("buildStaffChapterAdminHref(");
    expect(source).toContain('params.set("chapterContext", chapter.name);');
    expect(source).toContain('params.set("chapterSchool", chapter.school);');
    expect(source).toContain('params.set("chapterRegionName", chapter.medlifeRegion);');
    expect(source).toContain('params.set("chapterCoachName", chapter.coach);');
    expect(source).toContain('params.set("chapterMembers", String(chapter.activeMembers));');
    expect(source).toContain('params.set("chapterRisk", chapter.risk);');
    expect(source).toContain('params.set("adminView", "chapters");');
    expect(source).toContain('params.set("chapterEvents", String(chapter.eventsThisMonth));');
    expect(source).toContain('params.set("chapterRsvps", String(chapter.rsvps));');
    expect(source).toContain('params.set("chapterAttendance", String(chapter.attendance));');
    expect(source).toContain('params.set("chapterPoints", String(chapter.totalPointsYear));');
    expect(source).toContain('params.set("chapterPointsWeek", String(chapter.pointsWeek));');
  });

  it("clears stale chapter and proof context when jumping from chapters into unrelated staff surfaces", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "campaigns",
          chapterContext: "TEST Stanford University",
          chapterSchool: "TEST Stanford University",
          chapterRegionName: "West",
          chapterCoachName: "TEST James Okafor",
          chapterMembers: "52",
          chapterRisk: "healthy",
          chapterEvents: "5",
          chapterRsvps: "80",
          chapterAttendance: "68",
          chapterPoints: "22100",
          chapterPointsWeek: "1890",
          proofStatus: "pending",
          proofPlatform: "instagram",
        }),
      }),
    );
    const source = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");

    expect(html).toContain("Campaign Operations");
    expect(html).toContain('href="/staff?view=chapters"');
    expect(html).not.toContain("chapterContext=TEST+Stanford+University");
    expect(html).not.toContain("chapterSchool=TEST+Stanford+University");
    expect(html).not.toContain("chapterRegionName=West");
    expect(html).not.toContain("chapterCoachName=TEST+James+Okafor");
    expect(html).not.toContain("chapterMembers=52");
    expect(html).not.toContain("chapterRisk=healthy");
    expect(html).not.toContain("chapterEvents=5");
    expect(html).not.toContain("chapterRsvps=80");
    expect(html).not.toContain("chapterAttendance=68");
    expect(html).not.toContain("chapterPoints=22100");
    expect(html).not.toContain("chapterPointsWeek=1890");
    expect(html).not.toContain("proofStatus=pending");
    expect(html).not.toContain("proofPlatform=instagram");
    expect(source).toContain('params.delete("chapterContext");');
    expect(source).toContain('params.delete("chapterSchool");');
    expect(source).toContain('params.delete("chapterRegionName");');
    expect(source).toContain('params.delete("chapterCoachName");');
    expect(source).toContain('params.delete("chapterMembers");');
    expect(source).toContain('params.delete("chapterRisk");');
    expect(source).toContain('params.delete("chapterEvents");');
    expect(source).toContain('params.delete("chapterRsvps");');
    expect(source).toContain('params.delete("chapterAttendance");');
    expect(source).toContain('params.delete("chapterPoints");');
    expect(source).toContain('params.delete("chapterPointsWeek");');
    expect(source).toContain('params.delete("proofStatus");');
    expect(source).toContain('params.delete("proofPlatform");');
  });

  it("reopens the same chapter drawer after an embedded admin return while preserving chapter filter context", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "chapters",
          chapter: "ch13",
          chapterRegion: "West",
          chapterSort: "points",
          chapterContext: "TEST Stanford University",
          chapterSchool: "TEST Stanford University",
          chapterRegionName: "West",
          chapterCoachName: "TEST James Okafor",
          chapterMembers: "52",
          chapterEvents: "5",
          chapterRsvps: "80",
          chapterAttendance: "68",
          chapterPoints: "22100",
          chapterPointsWeek: "1890",
        }),
      }),
    );

    expect(html).toContain("2 chapters");
    expect(html).toContain("filtered");
    expect(html).toContain("TEST Stanford University");
    expect(html).toContain("TEST UC Berkeley");
    expect(html).toContain("Chapter Detail");
    expect(html).toContain("5 events this month");
    expect(html).toContain("80 RSVPs");
    expect(html).toContain("68 attended");
    expect(html).toContain("+1,890 this week");
    expect(html).toContain("Return to TEST Stanford University in Chapters");
    expect(html).toContain('href="/staff?view=chapters');
    expect(html).toContain("chapterRegion=West");
    expect(html).toContain("chapterSort=points");
    expect(html).toContain("chapterContext=TEST+Stanford+University");
    expect(html).toContain("chapterPoints=22100");
    expect(html).toContain('href="/staff?view=admin');
    expect(html).toContain("adminView=chapters");
    expect(html).toContain("returnView=chapters");
    expect(html).toContain("chapter=ch13");
  });

  it("reopens the same chapter drawer from chapter context when the return path uses a sparse chapter id", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "chapters",
          chapter: "chapter-test",
          chapterContext: "Stanford University",
          chapterSchool: "TEST Stanford University",
          chapterRegionName: "West",
          chapterCoachName: "TEST James Okafor",
          chapterMembers: "52",
          chapterEvents: "5",
          chapterRsvps: "80",
          chapterAttendance: "68",
          chapterPoints: "22100",
          chapterPointsWeek: "1890",
        }),
      }),
    );
    const source = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");

    expect(html).toContain("Chapter Detail");
    expect(html).toContain("TEST Stanford University");
    expect(html).toContain("TEST James Okafor");
    expect(html).toContain("5 events this month");
    expect(html).toContain("80 RSVPs");
    expect(html).toContain("68 attended");
    expect(html).toContain("+1,890 this week");
    expect(html).toContain("Return to TEST Stanford University in Chapters");
    expect(html).toContain('href="/staff?view=chapters"');
    expect(source).toContain("resolveStaffSelectedChapter(");
    expect(source).toContain("function normalizeStaffChapterContext");
    expect(source).toContain("function resolveStaffSelectedChapter(");
  });

  it("keeps proof queue return context when the chapter drawer opens an admin chapter review handoff", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "chapters",
          chapter: "ch13",
          proofStatus: "pending",
          proofPlatform: "instagram",
        }),
      }),
    );
    const source = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");

    expect(html).toContain('href="/staff?view=admin&amp;chapter=ch13&amp;proofStatus=pending&amp;proofPlatform=instagram&amp;adminView=chapters&amp;returnView=proof_ugc&amp;chapterContext=TEST+Stanford+University&amp;chapterSchool=TEST+Stanford+University&amp;chapterRegionName=West&amp;chapterCoachName=TEST+James+Okafor&amp;chapterMembers=52&amp;chapterRisk=healthy&amp;chapterEvents=5&amp;chapterRsvps=80&amp;chapterAttendance=68&amp;chapterPoints=22100&amp;chapterPointsWeek=1890"');
    expect(source).toContain('params.set("returnView", proofQueueContext ? "proof_ugc" : "chapters");');
    expect(source).toContain("const proofQueueContext = getEmbeddedProofQueueContext(");
    expect(source).toContain("if (!proofQueueContext) {");
  });

  it("keeps chapter oversight readback visible inside the embedded admin chapters surface", async () => {
    mockPathname = "/staff";
    mockSearchParams = new URLSearchParams({
      view: "admin",
      adminView: "chapters",
      returnView: "chapters",
      chapter: "ch13",
      chapterContext: "TEST Stanford University",
      chapterSchool: "TEST Stanford University",
      chapterRegionName: "West",
      chapterCoachName: "TEST James Okafor",
      chapterMembers: "52",
      chapterRisk: "healthy",
      chapterEvents: "5",
      chapterRsvps: "80",
      chapterAttendance: "68",
      chapterPoints: "22100",
      chapterPointsWeek: "1890",
    });

    const { FigmaAdminPanel } = await import("@/components/figma-admin-panel");
    const html = renderToStaticMarkup(
      <FigmaAdminPanel
        initialActive="chapters"
        onBack={vi.fn()}
        embeddedBackLabel="this chapter"
        embeddedBackHref="/staff?view=chapters&chapter=ch13"
        embeddedChapterHref="/staff?view=chapters&chapter=ch13"
      />,
    );
    const adminSource = readFileSync("src/components/figma-admin-panel.tsx", "utf8");

    expect(html).toContain("Embedded chapter oversight readback");
    expect(html).toContain(
      "Use this Admin readback to verify event readiness, RSVP totals, attendance context, and points posture for TEST Stanford University before requesting any blocked-control follow-through or correction path.",
    );
    expect(html).toContain(">5</div>");
    expect(html).toContain(">80</div>");
    expect(html).toContain(">68</div>");
    expect(html).toContain(">22100</div>");
    expect(html).toContain(
      "Points posture for TEST Stanford University stays read-only here: 1890 weekly points remain review context only until an approved correction workflow exists, and blocked-control follow-through stays in this Admin readback lane.",
    );
    expect(html).toContain(">School</div><div class=\"mt-1 text-[13px] font-mono font-semibold text-slate-100\">TEST Stanford University</div>");
    expect(html).toContain(">Region</div><div class=\"mt-1 text-[13px] font-mono font-semibold text-slate-100\">West</div>");
    expect(html).toContain(">Coach</div><div class=\"mt-1 text-[13px] font-mono font-semibold text-slate-100\">TEST James Okafor</div>");
    expect(html).toContain(">Active Members</div><div class=\"mt-1 text-[13px] font-mono font-semibold text-slate-100\">52</div>");
    expect(html).toContain("Risk posture");
    expect(html).toContain("Carry TEST Stanford University");
    expect(html).toContain("risk context through this Admin readback before requesting any blocked-control follow-through or correction path.");
    expect(html).toContain(">HEALTHY</span>");
    expect(html).toContain(">Handoff source</div><div class=\"mt-1 text-[13px] font-mono font-semibold text-slate-100\">Staff chapter drawer</div>");
    expect(html).toContain(">Return target</div><div class=\"mt-1 text-[13px] font-mono font-semibold text-slate-100\">TEST Stanford University in Chapters</div>");
    expect(html).toContain("Chapter Detail");
    expect(html).toContain("TEST Stanford University · West");
    expect(html).toContain("TEST James Okafor");
    expect(html).toContain(">Active Members</div><div class=\"text-[14px] text-slate-200 font-mono font-semibold\">52</div>");
    expect(html).toContain(">Events This Month</div><div class=\"text-[14px] text-slate-200 font-mono font-semibold\">5</div>");
    expect(html).toContain(">RSVPs</div><div class=\"text-[14px] text-slate-200 font-mono font-semibold\">80</div>");
    expect(html).toContain(">Attendance</div><div class=\"text-[14px] text-slate-200 font-mono font-semibold\">68</div>");
    expect(html).toContain(">Points This Year</div><div class=\"text-[14px] text-slate-200 font-mono font-semibold\">22,100</div>");
    expect(html).toContain(">Events / Month</div><div class=\"mt-1 text-[14px] font-mono font-semibold text-slate-100\">5</div>");
    expect(html).toContain(">RSVP Totals</div><div class=\"mt-1 text-[14px] font-mono font-semibold text-slate-100\">80</div>");
    expect(html).toContain(">Points / Year</div><div class=\"mt-1 text-[14px] font-mono font-semibold text-slate-100\">22100</div>");
    expect(html).toContain("Review-only TEST Stanford University readback");
    expect(html).toContain("Carry TEST Stanford University back out to Chapters");
    expect(html).toContain("No attendance correction path runs here for TEST Stanford University");
    expect(html).toContain("TEST Stanford University points posture stays oversight-only");
    expect(html).toContain("Event readiness readback");
    expect(html).toContain("Module controls blocked");
    expect(html).toContain("Audit trail readback");
    expect(html).toContain("5 events this month");
    expect(html).toContain("80 RSVPs");
    expect(html).toContain("68 attended");
    expect(html).toContain("+1890 this week");
    expect(html).toContain(
      "RSVP totals, attendance context, event readiness, and points posture for TEST Stanford University remain review-only in this embedded Admin drawer. Use this readback before requesting any blocked-control follow-through or chapter correction path.",
    );
    expect(html).toContain("Return to Chapters");
    expect(html).toContain(
      "After this Admin readback, return to Chapters with TEST Stanford University still selected in the same Command Center review loop to keep the chapter oversight context intact.",
    );
    expect(html).toContain(
      'href="/staff?view=chapters&amp;chapter=ch13&amp;chapterContext=TEST+Stanford+University&amp;chapterSchool=TEST+Stanford+University&amp;chapterRegionName=West&amp;chapterCoachName=TEST+James+Okafor&amp;chapterMembers=52&amp;chapterRisk=healthy&amp;chapterEvents=5&amp;chapterRsvps=80&amp;chapterAttendance=68&amp;chapterPoints=22100&amp;chapterPointsWeek=1890"',
    );
    expect(adminSource).toContain('events: searchParams.get("chapterEvents"),');
    expect(adminSource).toContain('school: searchParams.get("chapterSchool"),');
    expect(adminSource).toContain('region: searchParams.get("chapterRegionName"),');
    expect(adminSource).toContain('coach: searchParams.get("chapterCoachName"),');
    expect(adminSource).toContain('members: searchParams.get("chapterMembers"),');
    expect(adminSource).toContain('risk: searchParams.get("chapterRisk"),');
    expect(adminSource).toContain('rsvps: searchParams.get("chapterRsvps"),');
    expect(adminSource).toContain('attendance: searchParams.get("chapterAttendance"),');
    expect(adminSource).toContain('points: searchParams.get("chapterPoints"),');
    expect(adminSource).toContain('pointsWeek: searchParams.get("chapterPointsWeek"),');
    expect(adminSource).toContain("function enrichEmbeddedChapterReadback");
    expect(adminSource).toContain("embeddedReadback ? buildEmbeddedReadbackChapter(embeddedReadback) : null");
    expect(adminSource).toContain("const activeEmbeddedReadback =");
    expect(adminSource).toContain("buildActiveEmbeddedChapterReadback(selected, embeddedReadback)");
    expect(adminSource).toContain("function buildEmbeddedReadbackChapter");
    expect(adminSource).toContain("function buildActiveEmbeddedChapterReadback(");
    expect(adminSource).toContain("function buildEmbeddedChapterReturnHref(");
    expect(adminSource).toContain('params.set("chapterPointsWeek", String(chapter.pointsWeek));');
    expect(adminSource).toContain('risk: embeddedReadback.risk ?? "medium",');
    expect(adminSource).toContain("embeddedBackHref={embeddedBackHref}");
  });

  it("fills embedded admin chapter readback from TEST fallback data when the staff handoff is sparse", async () => {
    mockPathname = "/staff";
    mockSearchParams = new URLSearchParams({
      view: "admin",
      adminView: "chapters",
      returnView: "chapters",
      chapter: "ch2",
      chapterContext: "TEST Boston College",
    });

    const { FigmaAdminPanel } = await import("@/components/figma-admin-panel");
    const html = renderToStaticMarkup(
      <FigmaAdminPanel
        initialActive="chapters"
        onBack={vi.fn()}
        embeddedBackLabel="this chapter"
        embeddedBackHref="/staff?view=chapters&chapter=ch2"
        embeddedChapterHref="/staff?view=chapters&chapter=ch2"
      />,
    );

    expect(html).toContain("Embedded chapter oversight readback");
    expect(html).toContain(
      "Use this Admin readback to verify event readiness, RSVP totals, attendance context, and points posture for TEST Boston College before requesting any blocked-control follow-through or correction path.",
    );
    expect(html).toContain(">School</div><div class=\"mt-1 text-[13px] font-mono font-semibold text-slate-100\">TEST Boston College</div>");
    expect(html).toContain(">Region</div><div class=\"mt-1 text-[13px] font-mono font-semibold text-slate-100\">New England</div>");
    expect(html).toContain(">Coach</div><div class=\"mt-1 text-[13px] font-mono font-semibold text-slate-100\">TEST Maria Santos</div>");
    expect(html).toContain(">Active Members</div><div class=\"mt-1 text-[13px] font-mono font-semibold text-slate-100\">32</div>");
    expect(html).toContain(">Handoff source</div><div class=\"mt-1 text-[13px] font-mono font-semibold text-slate-100\">Staff chapter drawer</div>");
    expect(html).toContain(">Events / Month</div><div class=\"mt-1 text-[14px] font-mono font-semibold text-slate-100\">2</div>");
    expect(html).toContain(">RSVP Totals</div><div class=\"mt-1 text-[14px] font-mono font-semibold text-slate-100\">30</div>");
    expect(html).toContain(">Points / Year</div><div class=\"mt-1 text-[14px] font-mono font-semibold text-slate-100\">7800</div>");
    expect(html).toContain("+620 this week");
    expect(html).toContain(
      "After this Admin readback, return to Chapters with TEST Boston College still selected in the same Command Center review loop to keep the chapter oversight context intact.",
    );
    expect(html).toContain(
      'href="/staff?view=chapters&amp;chapter=ch2&amp;chapterContext=TEST+Boston+College&amp;chapterSchool=TEST+Boston+College&amp;chapterRegionName=New+England&amp;chapterCoachName=TEST+Maria+Santos&amp;chapterMembers=32&amp;chapterRisk=healthy&amp;chapterEvents=2&amp;chapterRsvps=30&amp;chapterAttendance=24&amp;chapterPoints=7800&amp;chapterPointsWeek=620"',
    );
  });

  it("fills embedded admin chapter readback from fallback data when the sparse handoff omits the TEST prefix", async () => {
    mockPathname = "/staff";
    mockSearchParams = new URLSearchParams({
      view: "admin",
      adminView: "chapters",
      returnView: "chapters",
      chapter: "chapter-test",
      chapterContext: "Boston College",
    });

    const { FigmaAdminPanel } = await import("@/components/figma-admin-panel");
    const html = renderToStaticMarkup(
      <FigmaAdminPanel
        initialActive="chapters"
        onBack={vi.fn()}
        embeddedBackLabel="this chapter"
        embeddedBackHref="/staff?view=chapters&chapter=chapter-test"
        embeddedChapterHref="/staff?view=chapters&chapter=chapter-test"
      />,
    );
    const adminSource = readFileSync("src/components/figma-admin-panel.tsx", "utf8");

    expect(html).toContain("Embedded chapter oversight readback");
    expect(html).toContain(
      "Use this Admin readback to verify event readiness, RSVP totals, attendance context, and points posture for TEST Boston College before requesting any blocked-control follow-through or correction path.",
    );
    expect(html).toContain("Return: TEST Boston College in Chapters");
    expect(html).toContain("Chapter: TEST Boston College");
    expect(html).toContain(
      "Return with Command Center to TEST Boston College in Chapters after this chapter review pass, or use the top-right menu to switch workspaces or log out.",
    );
    expect(html).toContain(">School</div><div class=\"mt-1 text-[13px] font-mono font-semibold text-slate-100\">TEST Boston College</div>");
    expect(html).toContain(">Region</div><div class=\"mt-1 text-[13px] font-mono font-semibold text-slate-100\">New England</div>");
    expect(html).toContain(">Coach</div><div class=\"mt-1 text-[13px] font-mono font-semibold text-slate-100\">TEST Maria Santos</div>");
    expect(html).toContain(">Active Members</div><div class=\"mt-1 text-[13px] font-mono font-semibold text-slate-100\">32</div>");
    expect(html).toContain(">Attendance</div><div class=\"text-[14px] text-slate-200 font-mono font-semibold\">24</div>");
    expect(html).toContain("+620 this week");
    expect(html).toContain(
      "After this Admin readback, return to Chapters with TEST Boston College still selected in the same Command Center review loop to keep the chapter oversight context intact.",
    );
    expect(html).toContain(
      "The open chapter drawer below stays seeded from the TEST Boston College staff handoff until you intentionally select a different chapter in this preview-only directory.",
    );
    expect(html).toContain(
      'href="/staff?view=chapters&amp;chapter=chapter-test&amp;chapterContext=TEST+Boston+College&amp;chapterSchool=TEST+Boston+College&amp;chapterRegionName=New+England&amp;chapterCoachName=TEST+Maria+Santos&amp;chapterMembers=32&amp;chapterRisk=healthy&amp;chapterEvents=2&amp;chapterRsvps=30&amp;chapterAttendance=24&amp;chapterPoints=7800&amp;chapterPointsWeek=620"',
    );
    expect(adminSource).toContain("function normalizeEmbeddedChapterContext");
  });

  it("keeps embedded chapter provenance honest when the selected admin chapter no longer matches the original staff handoff", async () => {
    const { getEmbeddedChapterContinuityNote, getEmbeddedChapterHandoffSource } = await import(
      "@/components/figma-admin-panel"
    );

    expect(
      getEmbeddedChapterHandoffSource("TEST Stanford University", "TEST Boston College"),
    ).toBe("Embedded chapter directory");
    expect(
      getEmbeddedChapterContinuityNote("TEST Stanford University", "TEST Boston College"),
    ).toBe(
      "The open chapter drawer below now mirrors TEST Stanford University after you switched chapters inside embedded Admin, so the same selected chapter can return to Chapters with its oversight context intact.",
    );
    expect(
      getEmbeddedChapterHandoffSource("TEST Boston College", "TEST Boston College"),
    ).toBe("Staff chapter drawer");
    expect(
      getEmbeddedChapterContinuityNote("TEST Boston College", "TEST Boston College"),
    ).toBe(
      "The open chapter drawer below stays seeded from the TEST Boston College staff handoff until you intentionally select a different chapter in this preview-only directory.",
    );
  });

  it("keeps sparse unmatched embedded chapter handoffs tied to the selected TEST chapter instead of generic admin placeholders", async () => {
    mockPathname = "/staff";
    mockSearchParams = new URLSearchParams({
      view: "admin",
      adminView: "chapters",
      returnView: "chapters",
      chapter: "chapter-unknown",
      chapterContext: "TEST Brown University",
    });

    const { FigmaAdminPanel } = await import("@/components/figma-admin-panel");
    const html = renderToStaticMarkup(
      <FigmaAdminPanel
        initialActive="chapters"
        onBack={vi.fn()}
        embeddedBackLabel="this chapter"
        embeddedBackHref="/staff?view=chapters&chapter=chapter-unknown"
        embeddedChapterHref="/staff?view=chapters&chapter=chapter-unknown"
      />,
    );

    expect(html).toContain("Embedded chapter oversight readback");
    expect(html).toContain("TEST Brown University");
    expect(html).toContain(">School</div><div class=\"mt-1 text-[13px] font-mono font-semibold text-slate-100\">TEST Brown University</div>");
    expect(html).toContain(">Region</div><div class=\"mt-1 text-[13px] font-mono font-semibold text-slate-100\">TEST Region readback pending</div>");
    expect(html).toContain(">Coach</div><div class=\"mt-1 text-[13px] font-mono font-semibold text-slate-100\">TEST Coach readback pending</div>");
    expect(html).not.toContain("TEST Embedded staff oversight context");
    expect(html).not.toContain("TEST Read-only staff context");
    expect(html).not.toContain("Read-only staff context");
  });

  it("keeps the embedded admin chapter detail drawer tied to the same TEST chapter after a sparse handoff", async () => {
    mockPathname = "/staff";
    mockSearchParams = new URLSearchParams({
      view: "admin",
      adminView: "chapters",
      returnView: "chapters",
      chapter: "chapter-test",
      chapterContext: "Boston College",
    });

    const { FigmaAdminPanel } = await import("@/components/figma-admin-panel");
    const html = renderToStaticMarkup(
      <FigmaAdminPanel
        initialActive="chapters"
        onBack={vi.fn()}
        embeddedBackLabel="this chapter"
        embeddedBackHref="/staff?view=chapters&chapter=chapter-test"
        embeddedChapterHref="/staff?view=chapters&chapter=chapter-test"
      />,
    );

    expect(html).toContain("Chapter Detail");
    expect(html).toContain("TEST Boston College");
    expect(html).toContain("TEST Maria Santos");
    expect(html).toContain(
      "This selected TEST Boston College readback stays read-only inside embedded Admin so staff can confirm event readiness, RSVP totals, attendance context, and points posture before returning to Chapters.",
    );
    expect(html).toContain(">Handoff source</div><div class=\"text-[14px] text-slate-200 font-mono font-semibold\">Staff chapter drawer</div>");
    expect(html).toContain(">Return target</div><div class=\"text-[14px] text-slate-200 font-mono font-semibold\">TEST Boston College in Chapters</div>");
    expect(html).toContain("32");
    expect(html).toContain("2");
    expect(html).toContain("30");
    expect(html).toContain("24");
    expect(html).toContain("7,800");
    expect(html).toContain(">Points This Week</div><div class=\"text-[14px] text-slate-200 font-mono font-semibold\">+620</div>");
    expect(html).toContain("Risk Status");
    expect(html).toContain("Event readiness readback");
    expect(html).toContain("Module controls blocked");
    expect(html).toContain("Audit trail readback");
    expect(html).toContain("Chapter event readiness for TEST Boston College stays read-only here; use the staff events view for the route-backed drill-in.");
    expect(html).toContain("Module edits for TEST Boston College remain blocked until the secure module-management workflow is approved.");
    expect(html).toContain("Audit history for TEST Boston College remains a readback surface; use the audit log route for the full review trail.");
    expect(html).toContain("Return to Chapters");
    expect(html).toContain(
      "RSVP totals, attendance context, event readiness, and points posture for TEST Boston College remain review-only in this embedded Admin drawer. Use this readback before requesting any blocked-control follow-through or chapter correction path.",
    );
    expect(html).toContain(
      "After this Admin readback, return to Chapters with TEST Boston College still selected in the same Command Center review loop to keep the chapter oversight context intact.",
    );
    expect(html).toContain(
      "The open chapter drawer below stays seeded from the TEST Boston College staff handoff until you intentionally select a different chapter in this preview-only directory.",
    );
    expect(html).toContain(
      'href="/staff?view=chapters&amp;chapter=chapter-test&amp;chapterContext=TEST+Boston+College&amp;chapterSchool=TEST+Boston+College&amp;chapterRegionName=New+England&amp;chapterCoachName=TEST+Maria+Santos&amp;chapterMembers=32&amp;chapterRisk=healthy&amp;chapterEvents=2&amp;chapterRsvps=30&amp;chapterAttendance=24&amp;chapterPoints=7800&amp;chapterPointsWeek=620"',
    );
  });

  it("keeps the same TEST Boston College oversight context aligned across drawer, blocked handoff, gate, and embedded admin", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const { FigmaAdminPanel } = await import("@/components/figma-admin-panel");
    const { default: StaffPage } = await import("@/app/staff/page");

    const drawerHtml = renderToStaticMarkup(
      <ChapterDetailDrawer
        chapter={{
          id: "chapter-test",
          name: "Boston College",
          school: "Boston College",
          country: "USA",
          region: "North America",
          activeMembers: 32,
          coach: "Maria Santos",
          leaders: ["Ivy Ramos"],
          chapterType: "established",
          medlifeRegion: "New England",
          campaign: "Rush Month",
          campaignStatus: "on-track",
          followUps: 18,
          assignments: 12,
          evidencePending: 2,
          evidenceApproved: 9,
          hubspotLifecycle: "MQL",
          hubspotTasks: 3,
          lumaEvents: 2,
          lastActivity: "2h ago",
          risk: "healthy",
          decision: "Advance",
          healthScore: 84,
          newMembers: 6,
          feedViews: 180,
          eventsThisYear: 9,
          eventsThisMonth: 2,
          leads: 48,
          rsvps: 30,
          attendance: 24,
          leadAttendancePct: 50,
          avgNpsScore: 62,
          totalPointsYear: 7800,
          pointsWeek: 620,
        }}
        onClose={() => {}}
        adminPreviewHref="/staff?view=admin&adminView=chapters&returnView=chapters&chapter=chapter-test&chapterContext=Boston+College&chapterSchool=Boston+College&chapterRegionName=New+England&chapterCoachName=Maria+Santos&chapterMembers=32&chapterRisk=healthy&chapterEvents=2&chapterRsvps=30&chapterAttendance=24&chapterPoints=7800&chapterPointsWeek=620"
        chapterReturnHref="/staff?view=chapters"
      />,
    );

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );
    const blockedHtml = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "admin",
          adminView: "chapters",
          returnView: "chapters",
          chapter: "chapter-test",
          chapterContext: "TEST Boston College",
          chapterSchool: "TEST Boston College",
          chapterRegionName: "New England",
          chapterCoachName: "TEST Maria Santos",
          chapterMembers: "32",
          chapterEvents: "2",
          chapterRsvps: "30",
          chapterAttendance: "24",
          chapterPoints: "7800",
          chapterPointsWeek: "620",
        }),
      }),
    );

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("super.admin@mymedlife.test"),
    );
    const gateHtml = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "admin",
          adminView: "chapters",
          returnView: "chapters",
          chapter: "chapter-test",
          chapterContext: "TEST Boston College",
          chapterSchool: "TEST Boston College",
          chapterRegionName: "New England",
          chapterCoachName: "TEST Maria Santos",
          chapterMembers: "32",
          chapterEvents: "2",
          chapterRsvps: "30",
          chapterAttendance: "24",
          chapterPoints: "7800",
          chapterPointsWeek: "620",
        }),
      }),
    );

    mockPathname = "/staff";
    mockSearchParams = new URLSearchParams({
      view: "admin",
      adminView: "chapters",
      returnView: "chapters",
      chapter: "chapter-test",
      chapterContext: "Boston College",
    });
    const embeddedHtml = renderToStaticMarkup(
      <FigmaAdminPanel
        initialActive="chapters"
        onBack={vi.fn()}
        embeddedBackLabel="this chapter"
        embeddedBackHref="/staff?view=chapters&chapter=chapter-test"
        embeddedChapterHref="/staff?view=chapters&chapter=chapter-test"
      />,
    );

    for (const html of [drawerHtml, blockedHtml, gateHtml, embeddedHtml]) {
      expect(html).toContain("Boston College");
      expect(html).toContain("30 RSVPs");
      expect(html).toContain("24 attended");
      expect(html).toContain("+620 this week");
    }

    expect(drawerHtml).toContain("Keep Boston College visible in embedded Admin.");
    expect(drawerHtml).toContain("Return to Boston College in Chapters after the Admin readback closes.");

    expect(blockedHtml).toContain("Review-only TEST Boston College readback");
    expect(blockedHtml).toContain("Carry TEST Boston College back out to Chapters");
    expect(blockedHtml).toContain(
      "When DS Admin access is available, return to TEST Boston College in Chapters in the same Command Center review loop after the Admin readback closes.",
    );

    expect(gateHtml).toContain("Restricted Preview Access");
    expect(gateHtml).toContain(
      "Open Admin preview to read back event readiness, RSVP totals, attendance context, and points posture for TEST Boston College before requesting any correction path.",
    );
    expect(gateHtml).toContain(
      "After the Admin readback, return to TEST Boston College in Chapters in the same Command Center review loop.",
    );

    expect(embeddedHtml).toContain("Embedded chapter oversight readback");
    expect(embeddedHtml).toContain("Review-only TEST Boston College readback");
    expect(embeddedHtml).toContain("Carry TEST Boston College back out to Chapters");
    expect(embeddedHtml).toContain(
      "Use this Admin readback to confirm event readiness, RSVP totals, attendance context, and points posture for TEST Boston College before requesting any blocked-control follow-through or correction path.",
    );
    expect(embeddedHtml).toContain(
      "After this Admin readback, return to Chapters with TEST Boston College still selected in the same Command Center review loop to keep the chapter oversight context intact.",
    );
  });

  it("keeps a proof queue return path visible when a chapter drawer opens from Proof / UGC context", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: StaffPage } = await import("@/app/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          view: "chapters",
          chapter: "ch13",
          proofStatus: "pending",
          proofPlatform: "instagram",
        }),
      }),
    );
    const source = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");

    expect(html).toContain("Oversight loop: return to Proof / UGC (Pending · Instagram) after this chapter review to keep the same moderation queue in focus.");
    expect(html).toContain('href="/staff?view=proof_ugc&amp;proofStatus=pending&amp;proofPlatform=instagram"');
    expect(html).toContain("Return to Proof / UGC (Pending · Instagram)");
    expect(source).toContain("const resolvedProofQueueContext =");
    expect(source).toContain("const resolvedProofQueueReturnHref = proofQueueReturnHref ??");
    expect(source).toContain("const currentRouteSearch = searchParams.toString() || initialRouteSearch;");
    expect(source).toContain("proofQueueContext={chapterDrawerProofQueueContext}");
  });

  it("shares account-menu clearance with the staff header and truncates the alert pill before the profile chip", () => {
    const staffSource = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");
    const accountMenuSource = readFileSync("src/components/workspace-account-menu.tsx", "utf8");

    expect(accountMenuSource).toContain("export const WORKSPACE_ACCOUNT_MENU_SHELL_CLEARANCE");
    expect(staffSource).toContain("const STAFF_PAGE_HEADER_ACCOUNT_CLEARANCE = WORKSPACE_ACCOUNT_MENU_SHELL_CLEARANCE;");
    expect(staffSource).toContain("const STAFF_TOP_BAR_ACCOUNT_CLEARANCE = WORKSPACE_ACCOUNT_MENU_SHELL_CLEARANCE;");
    expect(staffSource).toContain('flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden');
    expect(staffSource).toContain('flex min-w-0 shrink items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all lg:px-3');
    expect(staffSource).toContain('<span className="truncate">{item.label}</span>');
    expect(staffSource).toContain(
      'hidden md:flex max-w-[7rem] lg:max-w-[8.5rem] xl:max-w-[10rem] 2xl:max-w-[11.5rem]',
    );
  });

  it("keeps the local staff shell close to the 2,095-line Figma export while allowing route wiring", () => {
    const source = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");
    const lineCount = source.split("\n").length;

    expect(lineCount).toBeGreaterThanOrEqual(2170);
    expect(lineCount).toBeLessThanOrEqual(3600);
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
