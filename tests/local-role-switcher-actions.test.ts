import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieSet: vi.fn(),
  cookieDelete: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: mocks.cookieSet,
    delete: mocks.cookieDelete,
  }),
  headers: async () => ({
    get: (name: string) =>
      name === "referer"
        ? "https://mymedlife.org/admin/integrations/luma"
        : null,
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import {
  clearLocalActorPreviewAction,
  setLocalActorPreviewAction,
} from "@/components/local-role-switcher/actions";

describe("local role switcher actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not write a seeded preview cookie in production", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const formData = new FormData();
    formData.set("selectedEmail", "super.admin@mymedlife.test");

    await setLocalActorPreviewAction(formData);

    expect(mocks.cookieSet).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/integrations/luma");
  });

  it("keeps local preview switching and stale-cookie clearing available", async () => {
    vi.stubEnv("VERCEL_ENV", "development");
    const formData = new FormData();
    formData.set("selectedEmail", "super.admin@mymedlife.test");

    await setLocalActorPreviewAction(formData);
    await clearLocalActorPreviewAction();

    expect(mocks.cookieSet).toHaveBeenCalledWith(
      "mymedlife_preview_actor_email",
      "super.admin@mymedlife.test",
      expect.objectContaining({
        httpOnly: true,
        path: "/",
        sameSite: "lax",
      }),
    );
    expect(mocks.cookieDelete).toHaveBeenCalledWith(
      "mymedlife_preview_actor_email",
    );
  });
});
