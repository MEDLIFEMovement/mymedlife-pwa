import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/feature-flags",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
  };
});

describe("feature flags and theme admin pages", () => {
  it("blocks non-DS users from feature flag controls", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    const { default: FeatureFlagsPage } = await import("@/app/admin/feature-flags/page");
    const html = renderToStaticMarkup(await FeatureFlagsPage({}));

    expect(html).toContain("Feature flags are restricted.");
    expect(html).toContain("Only DS Admin and Super Admin can manage module and provider feature flags.");
    expect(html).not.toContain("Module Flags");
  });

  it("renders the feature flag registry for DS Admin", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );

    const { default: FeatureFlagsPage } = await import("@/app/admin/feature-flags/page");
    const html = renderToStaticMarkup(await FeatureFlagsPage({}));

    expect(html).toContain("Feature flag registry");
    expect(html).toContain("Module Flags");
    expect(html).toContain("Provider Flags");
    expect(html).toContain("Events, Luma, and Points");
    expect(html).toContain("SOP Workflows and Next Action");
    expect(html).toContain("Luma");
    expect(html).toContain("Recent feature flag changes");
  });

  it("blocks non-DS users from theme controls", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("coach@mymedlife.test"),
    );

    const { default: ThemePage } = await import("@/app/admin/theme/page");
    const html = renderToStaticMarkup(await ThemePage({}));

    expect(html).toContain("Theme admin is restricted.");
    expect(html).toContain("Only DS Admin and Super Admin can edit, publish, rollback, or restore theme tokens.");
    expect(html).not.toContain("Theme tokens");
  });

  it("renders audited theme controls for Super Admin", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("super.admin@mymedlife.test"),
    );

    const { default: ThemePage } = await import("@/app/admin/theme/page");
    const html = renderToStaticMarkup(await ThemePage({}));

    expect(html).toContain("Manage myMEDLIFE colors as audited design tokens.");
    expect(html).toContain("Theme tokens");
    expect(html).toContain("Preview");
    expect(html).toContain("Publish theme");
    expect(html).toContain("Rollback theme");
    expect(html).toContain("Restore MEDLIFE default");
    expect(html).toContain("Contrast checks");
  });
});
