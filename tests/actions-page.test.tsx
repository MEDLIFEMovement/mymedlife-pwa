import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/rush-month/actions",
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

describe("actions page", () => {
  it("lets the member actions route render as a student-owned assigned-actions screen", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing actions page."),
    );

    const { default: ActionsPage } = await import("@/app/rush-month/actions/page");
    const html = renderToStaticMarkup(await ActionsPage({}));

    expect(html).toContain("My Actions");
    expect(html).toContain("Assigned Actions");
    expect(html).toContain("Invite 3 friends to the Intro GBM");
    expect(html).toContain("Share Rush Week flyer on Instagram");
    expect(html).toContain("Start next action");
    expect(html).not.toContain("Mock-seeded review data");
    expect(html).not.toContain("This week actions");
    expect(html).not.toContain("Leader assignment path");
    expect(html).not.toContain("Keep this week moving with one clear next step.");
    expect(html).not.toContain("Visible on your member route");
    expect(html).not.toContain("Local preview tools");
    expect(html).not.toContain("Review only");
  });

  it("treats committee members as part of the member-owned actions surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("committee.member@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing committee-member actions page."),
    );

    const { default: ActionsPage } = await import("@/app/rush-month/actions/page");
    const html = renderToStaticMarkup(await ActionsPage({}));

    expect(html).toContain("My Actions");
    expect(html).not.toContain("This week actions");
    expect(html).not.toContain("Leader assignment path");
  });

  it("keeps the campaign handoff visible across the member actions list", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing campaign-source actions page."),
    );

    const { default: ActionsPage } = await import("@/app/rush-month/actions/page");
    const html = renderToStaticMarkup(
      await ActionsPage({
        searchParams: Promise.resolve({ source: "campaigns" }),
      }),
    );

    expect(html).toContain("From campaigns");
    expect(html).toContain("These actions came from the Rush Month campaign view.");
    expect(html).toContain("Back to campaigns");
    expect(html).toContain('href="/campaigns"');
    expect(html).toContain('href="/rush-month/actions/member-push?source=campaigns"');
    expect(html).toContain('href="/rush-month/events?source=campaigns"');
    expect(html).toContain('href="/rush-month/evidence?source=campaigns"');
  });

  it("keeps the home handoff visible across the member actions list", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing home-source actions page."),
    );

    const { default: ActionsPage } = await import("@/app/rush-month/actions/page");
    const html = renderToStaticMarkup(
      await ActionsPage({
        searchParams: Promise.resolve({ source: "home" }),
      }),
    );

    expect(html).toContain("From home");
    expect(html).toContain("These actions came from your member home priority.");
    expect(html).toContain("Back to home");
    expect(html).toContain('href="/app"');
    expect(html).toContain('href="/rush-month/actions/member-push?source=home"');
    expect(html).toContain('href="/campaigns?source=home"');
    expect(html).toContain('href="/rush-month/events?source=home"');
    expect(html).toContain('href="/rush-month/evidence?source=home"');
    expect(html.indexOf("My Actions")).toBeLessThan(html.indexOf("From home"));
  });

  it("keeps the proof handoff visible across the member actions list", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing evidence-source actions page."),
    );

    const { default: ActionsPage } = await import("@/app/rush-month/actions/page");
    const html = renderToStaticMarkup(
      await ActionsPage({
        searchParams: Promise.resolve({ source: "evidence" }),
      }),
    );

    expect(html).toContain("From proof");
    expect(html).toContain("These actions came from your proof queue.");
    expect(html).toContain("Back to proof");
    expect(html).toContain('href="/rush-month/evidence"');
    expect(html).toContain('href="/rush-month/actions/member-push?source=evidence"');
    expect(html).toContain('href="/campaigns"');
    expect(html).toContain('href="/rush-month/events"');
  });

  it("keeps the chapter-owned assignment handoff visible across the broader leader actions lane", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing chapter assignment-source actions page."),
    );

    const { default: ActionsPage } = await import("@/app/rush-month/actions/page");
    const html = renderToStaticMarkup(
      await ActionsPage({
        searchParams: Promise.resolve({
          source: "chapter_assign_action",
          member: "member-ivy",
          returnTo:
            "/chapter?view=members&member=member-ivy&pipeline=follow_up&q=Ivy&quickAction=assign_action",
        }),
      }),
    );

    expect(html).toContain("From member pipeline");
    expect(html).toContain("Ivy Invite is still the student in focus.");
    expect(html).toContain("Back to member pipeline");
    expect(html).toContain("Leader assignments");
    expect(html).toContain(
      'href="/chapter?view=members&amp;member=member-ivy&amp;pipeline=follow_up&amp;q=Ivy&amp;quickAction=assign_action"',
    );
    expect(html).toContain(
      'name="returnTo" value="/rush-month/actions?source=chapter_assign_action&amp;member=member-ivy&amp;returnTo=%2Fchapter%3Fview%3Dmembers%26member%3Dmember-ivy%26pipeline%3Dfollow_up%26q%3DIvy%26quickAction%3Dassign_action"',
    );
  });

  it("keeps leader assignment review inside the broader actions lane", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("leader.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing leader-selected assignment actions page."),
    );

    const { default: ActionsPage } = await import("@/app/rush-month/actions/page");
    const html = renderToStaticMarkup(
      await ActionsPage({
        searchParams: Promise.resolve({
          assignmentId: "member-push",
          source: "leader_follow_up",
        }),
      }),
    );

    expect(html).toContain("Selected assignment");
    expect(html).toContain("Keep review inside the broader role-owned actions lane.");
    expect(html).toContain("Invite 3 friends to the Intro GBM");
    expect(html).toContain(
      'href="/rush-month/actions?assignmentId=member-push&amp;source=leader_follow_up"',
    );
    expect(html).toContain('href="/rush-month/actions?assignmentId=share-rush-flyer&amp;source=leader_assignment_card"');
    expect(html).not.toContain('href="/rush-month/actions/member-push"');
  });

  it("keeps first-write admin review inside the broader actions lane", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing admin first-write actions page."),
    );

    const { default: ActionsPage } = await import("@/app/rush-month/actions/page");
    const html = renderToStaticMarkup(
      await ActionsPage({
        searchParams: Promise.resolve({
          assignmentId: "member-push",
          source: "first_write_packet",
        }),
      }),
    );

    expect(html).toContain("Selected assignment");
    expect(html).toContain("Keep review inside the broader role-owned actions lane.");
    expect(html).toContain(
      'href="/rush-month/actions?assignmentId=member-push&amp;source=first_write_packet"',
    );
    expect(html).not.toContain('href="/rush-month/actions/member-push"');
  });

  it("keeps proof metadata admin review inside the broader actions lane", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing admin proof metadata actions page."),
    );

    const { default: ActionsPage } = await import("@/app/rush-month/actions/page");
    const html = renderToStaticMarkup(
      await ActionsPage({
        searchParams: Promise.resolve({
          assignmentId: "member-push",
          source: "proof_metadata_packet",
        }),
      }),
    );

    expect(html).toContain("Selected assignment");
    expect(html).toContain(
      'href="/rush-month/actions?assignmentId=member-push&amp;source=proof_metadata_packet"',
    );
    expect(html).not.toContain('href="/rush-month/actions/member-push"');
  });

  it("keeps HQ proof review context inside the broader actions lane", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing HQ proof packet actions page."),
    );

    const { default: ActionsPage } = await import("@/app/rush-month/actions/page");
    const html = renderToStaticMarkup(
      await ActionsPage({
        searchParams: Promise.resolve({
          assignmentId: "member-push",
          source: "hq_proof_packet",
        }),
      }),
    );

    expect(html).toContain("Selected assignment");
    expect(html).toContain(
      'href="/rush-month/actions?assignmentId=member-push&amp;source=hq_proof_packet"',
    );
    expect(html).not.toContain('href="/rush-month/actions/member-push"');
  });
});
