import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/integrations/luma",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
}));

vi.mock("@/app/login/actions", () => ({
  signOut: async () => undefined,
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

describe("admin management pages", () => {
  it("renders DS Admin user management with filters, access summary, safeguards, and audit previews", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("ds.admin@mymedlife.test"),
    );

    const { default: AdminUsersPage } = await import("@/app/admin/users/page");
    const html = renderToStaticMarkup(
      await AdminUsersPage({
        searchParams: Promise.resolve({ q: "sofia" }),
      }),
    );

    expect(html).toContain("User Access Management");
    expect(html).toContain("Search name or email");
    expect(html).toContain("sofia.alvarez@mymedlife.test");
    expect(html).toContain("General Student App");
    expect(html).toContain("Promote / demote role");
    expect(html).toContain("Return to General Student App only");
    expect(html).toContain("Deactivate user");
    expect(html).toContain("Delete user safeguard");
    expect(html).toContain("Audit record preview");
    expect(html).toContain("Server-backed access changes");
    expect(html).toContain("admin_change_user_access");
    expect(html).toContain("Save chapter role");
    expect(html).toContain("Assign staff role");
    expect(html).toContain("Assign coach portfolio");
    expect(html).toContain("Admin writes locked");
    expect(html).toContain("Historical event, attendance, and points records remain preserved.");
  });

  it("filters the admin user directory by query", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("ds.admin@mymedlife.test"),
    );

    const { default: AdminUsersPage } = await import("@/app/admin/users/page");
    const html = renderToStaticMarkup(
      await AdminUsersPage({
        searchParams: Promise.resolve({ q: "ivy" }),
      }),
    );

    expect(html).toContain("Ivy Invite");
    expect(html).toContain("ivy.invite@mymedlife.test");
    expect(html).not.toContain("sofia.alvarez@mymedlife.test");
  });

  it("blocks non-DS staff from the admin user management page", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: AdminUsersPage } = await import("@/app/admin/users/page");

    await expect(AdminUsersPage({})).rejects.toThrow(
      "NEXT_REDIRECT:/staff?view=chapters",
    );
  });

  it("renders Super Admin chapter management with owner/module changes and destructive safeguards", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("super.admin@mymedlife.test"),
    );

    const { default: AdminChaptersPage } = await import("@/app/admin/chapters/page");
    const html = renderToStaticMarkup(
      await AdminChaptersPage({
        searchParams: Promise.resolve({ chapterId: "chapter-ucla" }),
      }),
    );

    expect(html).toContain("Chapter Management");
    expect(html).toContain("UCLA MEDLIFE");
    expect(html).toContain("Chapter type");
    expect(html).toContain("College / University Chapter");
    expect(html).toContain("Needs Review");
    expect(html).toContain("Edit chapter ownership and modules");
    expect(html).toContain("Archive chapter");
    expect(html).toContain("Soft delete chapter");
    expect(html).toContain("Hard delete safeguard");
    expect(html).toContain("chapter_has_active_data");
    expect(html).toContain("Server-backed chapter changes");
    expect(html).toContain("admin_manage_chapter");
    expect(html).toContain("Create chapter");
    expect(html).toContain("Save chapter profile");
    expect(html).toContain("Assign coach");
    expect(html).toContain("Assign student leader");
    expect(html).toContain("write_disabled");
    expect(html).toContain("Historical events, attendance, and points records must be preserved.");
  });

  it("renders the access matrix with managed users and audit posture", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("ds.admin@mymedlife.test"),
    );

    const { default: AdminAccessPage } = await import("@/app/admin/access/page");
    const html = renderToStaticMarkup(await AdminAccessPage());

    expect(html).toContain("Access Matrix");
    expect(html).toContain("Managed Directory Access");
    expect(html).toContain("General Student App");
    expect(html).toContain("Student Command Center");
    expect(html).toContain("Failed unauthorized admin attempt");
    expect(html).toContain("Sensitive preview access");
    expect(html).toContain("access.denied");
    expect(html).toContain("access.preview_viewed");
  });

  it("renders DS Admin Luma provider setup without exposing keys", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("ds.admin@mymedlife.test"),
    );

    const { default: AdminLumaIntegrationPage } = await import(
      "@/app/admin/integrations/luma/page"
    );
    const html = renderToStaticMarkup(await AdminLumaIntegrationPage());

    expect(html).toContain("Luma integration status");
    expect(html).toContain("Safe test connection");
    expect(html).toContain("Outbox safety");
    expect(html).toContain("Secrets exposure");
    expect(html).toContain("Open outbox");
    expect(html).toContain("External writes");
    expect(html).not.toContain("LUMA_API_KEY");
  });

  it("blocks general staff from Luma provider setup", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: AdminLumaIntegrationPage } = await import(
      "@/app/admin/integrations/luma/page"
    );
    const html = renderToStaticMarkup(await AdminLumaIntegrationPage());

    expect(html).toContain("Luma integration hidden for this role");
    expect(html).toContain("Only DS Admin and Super Admin");
  });
});
