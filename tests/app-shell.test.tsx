import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/app-shell";
import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/chapter",
  useSearchParams: () => new URLSearchParams(),
}));

describe("app shell", () => {
  it("renders the shared command header by default for command surfaces", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");

    const html = renderToStaticMarkup(<AppShell actor={actor}><section>Chapter surface</section></AppShell>);

    expect(html).toContain("Leadership command center");
    expect(html).toContain("Student Leadership Command Center");
    expect(html).toContain("Leader shell");
    expect(html).toContain("Leader navigation");
    expect(html).toContain("/leader?view=overview");
    expect(html).toContain("Chapter surface");
  });

  it("can hide the shared command header while preserving content and optional preview tools", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");

    const html = renderToStaticMarkup(
      <AppShell actor={actor} hideTopHeader>
        <section>Chapter surface</section>
      </AppShell>,
    );

    expect(html).not.toContain("Leadership command center");
    expect(html).not.toContain("Student Leadership Command Center");
    expect(html).not.toContain("Leader shell");
    expect(html).toContain("Chapter surface");
    expect(html).toContain("Preview role");
    expect(html).toContain("Browser only");
  });

  it("can keep preview tools out of a command surface when the route owns the full product shell", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");

    const html = renderToStaticMarkup(
      <AppShell actor={actor} hideTopHeader showDebugTools={false}>
        <section>Chapter surface</section>
      </AppShell>,
    );

    expect(html).toContain("Chapter surface");
    expect(html).not.toContain("Preview role");
    expect(html).not.toContain("Browser only");
  });

  it("can hide the member shell header while keeping mobile quick navigation available", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");

    const html = renderToStaticMarkup(
      <AppShell actor={actor} hideTopHeader>
        <section>Member surface</section>
      </AppShell>,
    );

    expect(html).not.toContain("General member app");
    expect(html).not.toContain("Pilot-safe");
    expect(html).not.toContain("Rush Month live");
    expect(html).toContain("Member surface");
    expect(html).toContain("Mobile quick navigation");
    expect(html).toContain("Home");
    expect(html).toContain("Events");
    expect(html).toContain("Points");
    expect(html).toContain("Profile");
    expect(html).toContain("pb-[calc(11rem+env(safe-area-inset-bottom))]");
    expect(html).not.toMatch(
      /<h2[^>]*>Preview another local role without leaving the app\.<\/h2>/,
    );
  });

  it("uses the richer chapter role label for committee-member shell copy", () => {
    const actor = getMockLocalActorContext("committee.member@mymedlife.test");

    const html = renderToStaticMarkup(<AppShell actor={actor}><section>Member surface</section></AppShell>);

    expect(html).toContain("Member app");
    expect(html).toContain("Action Committee Member");
    expect(html).not.toContain("Student member view");
    expect(html).toContain("Member surface");
  });

  it("keeps the coach and staff shell copy centered on events, attendance, and leaderboard movement", () => {
    const coach = getMockLocalActorContext("coach@mymedlife.test");
    const staff = getMockLocalActorContext("general.staff@mymedlife.test");

    const coachHtml = renderToStaticMarkup(
      <AppShell actor={coach}>
        <section>Coach surface</section>
      </AppShell>,
    );
    const staffHtml = renderToStaticMarkup(
      <AppShell actor={staff}>
        <section>Staff surface</section>
      </AppShell>,
    );

    expect(coachHtml).toContain("Portfolio chapters, events, attendance, and leaderboard.");
    expect(coachHtml).not.toContain("Portfolio chapters, events, points, and risks.");
    expect(staffHtml).toContain("Chapters, events, attendance, and leaderboard.");
    expect(staffHtml).not.toContain("Chapters, events, points, and risks.");
  });
});
