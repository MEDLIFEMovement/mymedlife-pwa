import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
  usePathname: () => "/admin/luma-live-pilot",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
  };
});

vi.mock("@/services/luma-live-pilot-persistence", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/services/luma-live-pilot-persistence")
  >();

  return {
    ...actual,
    getLumaPilotPersistenceReadiness: vi.fn(),
  };
});

describe("Luma live pilot admin page", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("shows DS Admin the event, RSVP, attendance, points, leaderboard, and outbox proof path", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");
    vi.stubEnv("LUMA_CALENDAR_ID", "cal-7WNftYCpBJclZyG");
    vi.stubEnv(
      "MYMEDLIFE_LUMA_SHARED_DEFAULT_CHAPTER_ID",
      "chapter-northview",
    );
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );
    vi.mocked(persistenceModule.getLumaPilotPersistenceReadiness).mockResolvedValue({
      ready: true,
      message: "Hosted reviewer session and Supabase-backed data are both ready for proof capture.",
      usesHostedReviewerSession: true,
      dataSource: "supabase",
    });

    const { default: LumaLivePilotPage } = await import("@/app/admin/luma-live-pilot/page");
    const html = renderToStaticMarkup(await LumaLivePilotPage({}));

    expect(html).toContain("Staging Luma pilot");
    expect(html).toContain("Event and points evidence");
    expect(html).toContain("RSVP, attendance, and leaderboard impact stay tied together.");
    expect(html).toContain("These counters are cumulative staging proof totals");
    expect(html).toContain("RSVPs");
    expect(html).toContain("Attendance");
    expect(html).toContain("Points");
    expect(html).toContain("Leaderboard");
    expect(html).toContain("Outbox sends");
    expect(html).toContain("Proof rows");
    expect(html).toContain("proof rows ready");
    expect(html).toContain("Chapter calendar coverage");
    expect(html).toContain("Keep chapter-to-Luma mapping simple before scaling.");
    expect(html).toContain("Save chapter mapping");
    expect(html).toContain("Store the chapter calendar in myMEDLIFE.");
    expect(html).toContain("Save chapter mapping");
    expect(html).toContain("Pilot chapter");
    expect(html).toContain("First five chapter plan");
    expect(html).toContain("Next rollout action");
    expect(html).toContain("Next chapters to map");
    expect(html).toContain("of 5 chapters have a usable calendar path today.");
    expect(html).toContain("Saved maps");
    expect(html).toContain("Temporary maps");
    expect(html).toContain("Map 2 more chapters for the first five");
    expect(html).toContain("25-chapter explicit map gap");
    expect(html).toContain("300-chapter explicit map gap");
    expect(html).toContain("UCLA MEDLIFE");
    expect(html).toContain("Lakeside MEDLIFE");
    expect(html).toContain("Calendar not assigned");
    expect(html).toContain("Needs saved map");
    expect(html).toContain("event_rsvp_recorded");
    expect(html).toContain("event_points_awarded");
    expect(html).toContain("Audit/outbox review remains visible before pilot expansion.");
    expect(html).toContain("Hosted reviewer proof");
    expect(html).toContain("Use this route as the staging evidence checklist.");
    expect(html).toContain("Open staging.mymedlife.org, pass Vercel SSO");
    expect(html).toContain("Luma event create/update");
    expect(html).toContain("Chapter");
    expect(html).toContain("UCLA chapter calendar");
    expect(html).toContain("RSVP writeback");
    expect(html).toContain("Attendance import");
    expect(html).toContain("Choose a mapped chapter event instead of typing ids by hand.");
    expect(html).toContain(
      "Start from a mapped chapter event so attendance, points, and leaderboard proof stay tied to one app-owned event record.",
    );
    expect(html).toContain("approved guest list");
    expect(html).toContain("Points and leaderboard readback");
    expect(html).toContain("Audit/outbox safety");
    expect(html).toContain("Cross-role readback");
    expect(html).toContain("Review the same event story in every workspace.");
    expect(html).toContain("needs proof");
    expect(html).toContain("Event + Luma posture");
    expect(html).toContain("RSVP state");
    expect(html).toContain("Points + leaderboard");
    expect(html).toContain("Audit trail");
    expect(html).toContain("Outbox safety");
    expect(html).toContain('href="/app"');
    expect(html).toContain('href="/app/events"');
    expect(html).toContain('href="/app/points"');
    expect(html).toContain('href="/leader?view=events"');
    expect(html).toContain('href="/leader?view=leaderboard"');
    expect(html).toContain('href="/staff?view=chapters"');
    expect(html).toContain('href="/admin/audit-log"');
    expect(html).toContain('href="/admin/integration-outbox"');
    expect(html).toContain('href="/admin/pilot-scope"');
    expect(html).toContain("the public API does not expose a public attendee check-in write");
    expect(html).toContain(
      "treat the lane as passed only after that guest appears in Luma",
    );
    expect(html).not.toContain("secret-example");
  });

  it("blocks non-DS users from staging Luma write and import controls", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const persistenceModule = await import("@/services/luma-live-pilot-persistence");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );
    vi.mocked(persistenceModule.getLumaPilotPersistenceReadiness).mockResolvedValue({
      ready: false,
      message: "Proof rows are blocked in this review state.",
      usesHostedReviewerSession: true,
      dataSource: "supabase",
    });

    const { default: LumaLivePilotPage } = await import("@/app/admin/luma-live-pilot/page");
    const html = renderToStaticMarkup(await LumaLivePilotPage({}));

    expect(html).toContain("Luma live pilot restricted");
    expect(html).toContain("Only DS Admin and Super Admin can run staging Luma write or import controls.");
    expect(html).not.toContain("Create/update Luma event");
  });
});
