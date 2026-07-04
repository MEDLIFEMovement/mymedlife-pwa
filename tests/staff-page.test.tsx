import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";

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

  it("keeps Figma navigation button-owned instead of route-link-owned", async () => {
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

    expect(html).toContain("Portfolio Overview");
    expect(html).not.toContain('href="/staff?view=campaigns"');
    expect(html).not.toContain('href="/staff?view=proof_ugc"');
    expect(html).not.toContain("Figma page missing - implementation blocked");
  });

  it("keeps the local staff shell close to the 2,095-line Figma export", () => {
    const source = readFileSync("src/components/figma-staff-command-center.tsx", "utf8");
    const lineCount = source.split("\n").length;

    expect(lineCount).toBeGreaterThanOrEqual(2090);
    expect(lineCount).toBeLessThanOrEqual(2110);
    expect(source).toContain("type Screen = \"chapters\" | \"campaigns\" | \"events\" | \"ugc\" | \"reports\" | \"admin\" | \"best-practices\" | \"sops\";");
    expect(source).toContain("const NAV_ITEMS");
    expect(source).toContain("function PortfolioOverview");
    expect(source).toContain("function CampaignOps");
    expect(source).toContain("function ProofUGCQueue");
    expect(source).toContain("function BestPracticesLibrary");
    expect(source).toContain("function AdminRoleGate");
  });
});
