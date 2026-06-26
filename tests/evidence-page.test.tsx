import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/rush-month/evidence",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
  };
});

describe("evidence page", () => {
  it("lets the member evidence route lead with the proof workspace only", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: EvidencePage } = await import("@/app/rush-month/evidence/page");
    const html = renderToStaticMarkup(await EvidencePage({}));

    expect(html).toContain("Turn your action into one believable story.");
    expect(html).toContain("Your proof queue");
    expect(html).toContain(
      "/rush-month/actions/share-rush-flyer?step=submit&amp;source=evidence#submit-evidence",
    );
    expect(html).toContain("/rush-month/actions/share-rush-flyer?source=evidence");
    expect(html).toContain("href=\"/rush-month/actions?source=evidence\"");
    expect(html).toContain("Open submit evidence");
    expect(html).not.toContain("Mock-seeded review data");
    expect(html).toContain("A few reminders");
    expect(html).toContain("Keep it specific");
    expect(html).toContain("Keep it tied to the action");
    expect(html).not.toContain("Mock proof and testimonials");
    expect(html).not.toContain("Safety boundary");
    expect(html).not.toContain("public proof publishing");
  });

  it("treats committee members as part of the member-owned evidence shell", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("committee.member@mymedlife.test"),
    );

    const { default: EvidencePage } = await import("@/app/rush-month/evidence/page");
    const html = renderToStaticMarkup(await EvidencePage({}));

    expect(html).toContain("Turn your action into one believable story.");
    expect(html).toContain("Your proof queue");
    expect(html).not.toContain("Mock proof and testimonials");
  });

  it("preserves home-origin context when the proof queue opens from the member mobile loop", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: EvidencePage } = await import("@/app/rush-month/evidence/page");
    const html = renderToStaticMarkup(
      await EvidencePage({
        searchParams: Promise.resolve({ source: "home" }),
      }),
    );

    expect(html).toContain("From home");
    expect(html).toContain("This proof queue opened from your member home flow.");
    expect(html).toContain("Back to home");
    expect(html).toContain('href="/app"');
    expect(html.indexOf("Turn your action into one believable story.")).toBeLessThan(
      html.indexOf("From home"),
    );
  });

  it("preserves campaign-origin context when the proof queue opens from the campaign loop", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: EvidencePage } = await import("@/app/rush-month/evidence/page");
    const html = renderToStaticMarkup(
      await EvidencePage({
        searchParams: Promise.resolve({ source: "campaigns" }),
      }),
    );

    expect(html).toContain("From campaigns");
    expect(html).toContain("This proof queue opened from the Rush Month campaign route.");
    expect(html).toContain("Back to campaigns");
    expect(html).toContain('href="/campaigns"');
  });

  it("keeps leader proof links inside the broader actions lane", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );

    const { default: EvidencePage } = await import("@/app/rush-month/evidence/page");
    const html = renderToStaticMarkup(await EvidencePage({}));

    expect(html).toContain("Proof and testimonials");
    expect(html).toContain("What should happen next?");
    expect(html).toContain("Submission preview");
    expect(html).toContain("Story details");
    expect(html).toContain("Current proof path");
    expect(html).toContain("Later handoffs");
    expect(html).toContain("Sharing stays reviewed");
    expect(html).toContain("Hold file upload");
    expect(html).toContain(
      'href="/rush-month/actions?assignmentId=member-push&amp;source=proof_status"',
    );
    expect(html).toContain("&amp;source=evidence_queue");
    expect(html).not.toContain('href="/rush-month/actions/member-push"');
    expect(html).not.toContain("Mock proof and testimonials");
    expect(html).not.toContain("Proof packet");
    expect(html).not.toContain("Metadata payload");
    expect(html).not.toContain("Result preview");
    expect(html).not.toContain("Future records");
    expect(html).not.toContain("Blocked writes");
    expect(html).not.toContain("Metadata only until approval");
    expect(html).not.toContain("Locked file upload");
    expect(html).not.toContain("local proof metadata function");
  });
});
