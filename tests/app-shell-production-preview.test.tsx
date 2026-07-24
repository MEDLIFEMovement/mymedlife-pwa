import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
  useSearchParams: () => new URLSearchParams(),
}));

import { AppShell } from "@/components/app-shell";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("AppShell production preview boundary", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not render seeded role controls in production", () => {
    vi.stubEnv("VERCEL_ENV", "production");

    const html = renderToStaticMarkup(
      <AppShell actor={getMockLocalActorContext("super.admin@mymedlife.test")}>
        <p>Production content</p>
      </AppShell>,
    );

    expect(html).toContain("Production content");
    expect(html).not.toContain("Preview role");
    expect(html).not.toContain("super.admin@mymedlife.test");
    expect(html).not.toContain("Preview this role");
  });

  it("keeps seeded role controls available outside production", () => {
    vi.stubEnv("VERCEL_ENV", "preview");

    const html = renderToStaticMarkup(
      <AppShell actor={getMockLocalActorContext("super.admin@mymedlife.test")}>
        <p>Preview content</p>
      </AppShell>,
    );

    expect(html).toContain("Preview role");
    expect(html).toContain("super.admin@mymedlife.test");
  });
});
