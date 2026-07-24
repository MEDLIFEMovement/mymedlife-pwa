import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  buildLoginRedirectHref,
  buildLoginRedirectHrefForPath,
  shouldRedirectActorToLogin,
} from "@/services/login-route";

describe("login route service", () => {
  it("requires login when the app is only using the default local actor fallback", () => {
    expect(
      shouldRedirectActorToLogin(getMockLocalActorContext("member.a@mymedlife.test")),
    ).toBe(true);
  });

  it("does not require login for a signed-in auth session or preview-selected actor", () => {
    expect(
      shouldRedirectActorToLogin(
        getMockLocalActorContext(
          "member.a@mymedlife.test",
          "Signed in actor.",
          "mock_fallback",
          "local_auth_session",
          "signed_in",
        ),
      ),
    ).toBe(false);

    expect(
      shouldRedirectActorToLogin(
        getMockLocalActorContext(
          "leader.a@mymedlife.test",
          "Preview actor.",
          "mock_fallback",
          "local_preview_cookie",
          "disabled",
        ),
      ),
    ).toBe(false);
  });

  it("rejects a preview cookie on production hosts", () => {
    expect(
      shouldRedirectActorToLogin(
        getMockLocalActorContext(
          "leader.a@mymedlife.test",
          "Preview actor.",
          "mock_fallback",
          "local_preview_cookie",
          "disabled",
        ),
        { VERCEL_ENV: "production" },
      ),
    ).toBe(true);

    expect(
      shouldRedirectActorToLogin(
        getMockLocalActorContext(
          "leader.a@mymedlife.test",
          "Signed in actor.",
          "supabase_ready",
          "local_auth_session",
          "signed_in",
        ),
        { VERCEL_ENV: "production" },
      ),
    ).toBe(false);
  });

  it("builds a safe login redirect path for owned workspace entry", () => {
    expect(buildLoginRedirectHref("/staff?view=chapters")).toBe(
      "/login?redirectTo=%2Fstaff%3Fview%3Dchapters",
    );
  });

  it("preserves protected route search params while building login redirects", () => {
    expect(
      buildLoginRedirectHrefForPath("/admin", {
        view: "integrations",
        tab: ["luma", "outbox"],
        empty: undefined,
      }),
    ).toBe(
      "/login?redirectTo=%2Fadmin%3Fview%3Dintegrations%26tab%3Dluma%26tab%3Doutbox",
    );

    expect(
      buildLoginRedirectHrefForPath("//evil.example", { view: "admin" }),
    ).toBe("/login?redirectTo=%2F%3Fview%3Dadmin");
  });
});
