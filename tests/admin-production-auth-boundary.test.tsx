import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  actor: {
    audience: "super_admin",
    identitySource: "local_actor_email",
    authSessionStatus: "disabled",
  },
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/services/local-actor-context", () => ({
  getLocalActorContext: async () => mocks.actor,
}));

vi.mock("@/services/landing-route", () => ({
  getLandingRouteForActor: () => "/app",
}));

vi.mock("@/services/role-visibility", () => ({
  canAccessAdminWorkspace: (actor: { audience: string }) =>
    ["admin", "ds_admin", "super_admin"].includes(actor.audience),
}));

import AdminLayout from "@/app/admin/layout";

describe("admin production auth boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VERCEL_ENV", "production");
    mocks.actor.audience = "super_admin";
    mocks.actor.identitySource = "local_actor_email";
    mocks.actor.authSessionStatus = "disabled";
  });

  it("redirects an unsigned seeded actor before any nested admin page renders", async () => {
    await AdminLayout({ children: <p>Deep admin content</p> });

    expect(mocks.redirect).toHaveBeenCalledWith(
      "/login?redirectTo=%2Fadmin",
    );
  });

  it("renders nested admin content for a real signed-in actor", async () => {
    mocks.actor.identitySource = "local_auth_session";
    mocks.actor.authSessionStatus = "signed_in";

    const html = renderToStaticMarkup(
      await AdminLayout({ children: <p>Deep admin content</p> }),
    );

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(html).toContain("Deep admin content");
  });

  it("redirects a signed-in non-admin actor to their owned workspace", async () => {
    mocks.actor.audience = "member";
    mocks.actor.identitySource = "local_auth_session";
    mocks.actor.authSessionStatus = "signed_in";

    await AdminLayout({ children: <p>Deep admin content</p> });

    expect(mocks.redirect).toHaveBeenCalledWith("/app");
  });
});
