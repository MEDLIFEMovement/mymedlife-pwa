import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppNavigation } from "@/components/app-navigation";

const navigationState = {
  pathname: "/leader",
  searchParams: new URLSearchParams(),
};

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
  useSearchParams: () => navigationState.searchParams,
}));

describe("app navigation", () => {
  beforeEach(() => {
    navigationState.pathname = "/leader";
    navigationState.searchParams = new URLSearchParams();
  });

  it("treats the leader overview as active when the route relies on the default view", () => {
    const html = renderToStaticMarkup(
      <AppNavigation
        navItems={[
          { href: "/leader?view=overview", label: "Overview" },
          { href: "/leader?view=members", label: "Member Pipeline" },
        ]}
        quickItems={[]}
      />,
    );

    expect(html).toMatch(
      /<a aria-current="page"[^>]*href="\/leader\?view=overview"[^>]*>Overview<\/a>/,
    );
    expect(html).not.toMatch(
      /<a aria-current="page"[^>]*href="\/leader\?view=members"[^>]*>Member Pipeline<\/a>/,
    );
  });

  it("keeps query-param views distinct so the selected chapter screen stays highlighted", () => {
    navigationState.searchParams = new URLSearchParams("view=member_profile&member=member-ivy");

    const html = renderToStaticMarkup(
      <AppNavigation
        navItems={[
          { href: "/leader?view=members", label: "Member Pipeline" },
          { href: "/leader?view=member_profile", label: "Member Profile" },
        ]}
        quickItems={[]}
      />,
    );

    expect(html).toMatch(
      /<a aria-current="page"[^>]*href="\/leader\?view=member_profile"[^>]*>Member Profile<\/a>/,
    );
    expect(html).not.toMatch(
      /<a aria-current="page"[^>]*href="\/leader\?view=members"[^>]*>Member Pipeline<\/a>/,
    );
  });

  it("treats the coach portfolio screen as active when the default coach view is implied", () => {
    navigationState.pathname = "/coach";
    navigationState.searchParams = new URLSearchParams();

    const html = renderToStaticMarkup(
      <AppNavigation
        navItems={[
          { href: "/coach?view=chapters", label: "Portfolio" },
          { href: "/coach?view=campaigns", label: "Campaigns" },
        ]}
        quickItems={[]}
      />,
    );

    expect(html).toMatch(
      /<a aria-current="page"[^>]*href="\/coach\?view=chapters"[^>]*>Portfolio<\/a>/,
    );
    expect(html).not.toMatch(
      /<a aria-current="page"[^>]*href="\/coach\?view=campaigns"[^>]*>Campaigns<\/a>/,
    );
  });

  it("shrinks the mobile quick nav when helper labels are hidden", () => {
    const html = renderToStaticMarkup(
      <AppNavigation
        mode="mobile-app"
        navItems={[]}
        quickItems={[
          { href: "/", label: "Home", helper: "Start" },
          { href: "/campaigns", label: "Campaigns", helper: "Loop" },
          { href: "/profile", label: "Profile", helper: "Me" },
        ]}
        showQuickItemHelpers={false}
      />,
    );

    expect(html).toContain("bottom-2");
    expect(html).toContain("p-1.5");
    expect(html).toContain("min-h-[3rem]");
    expect(html).not.toContain(">Start<");
    expect(html).not.toContain(">Loop<");
    expect(html).not.toContain(">Me<");
  });

  it("renders a stacked sidebar rail for command-center layouts", () => {
    const html = renderToStaticMarkup(
      <AppNavigation
        layout="sidebar"
        navItems={[
          { href: "/staff?view=chapters", label: "Chapters" },
          { href: "/staff?view=campaigns", label: "Campaigns" },
        ]}
        quickItems={[]}
      />,
    );

    expect(html).toContain("Navigation");
    expect(html).toContain("Move through the surface that matches your role.");
    expect(html).toContain("/staff?view=chapters");
    expect(html).toContain("/staff?view=campaigns");
  });
});
