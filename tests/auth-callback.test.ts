import { describe, expect, it } from "vitest";
import {
  buildAuthCallbackFailureRedirectPath,
  buildAuthCallbackRedirectPath,
  getAuthCallbackFailureCode,
  getAuthCallbackFailureMessage,
  isSupabaseEmailOtpType,
} from "@/services/auth-callback";

describe("auth callback redirect logic", () => {
  it("routes invite links into password setup before the workspace", () => {
    expect(
      buildAuthCallbackRedirectPath({
        next: null,
        redirectTo: "/admin",
        type: "invite",
      }),
    ).toBe("/auth/set-password?redirectTo=%2Fadmin");
  });

  it("routes recovery links into password setup before the workspace", () => {
    expect(
      buildAuthCallbackRedirectPath({
        next: null,
        redirectTo: "/admin",
        type: "recovery",
      }),
    ).toBe("/auth/set-password?redirectTo=%2Fadmin");
  });

  it("honors an explicit update-password next step", () => {
    expect(
      buildAuthCallbackRedirectPath({
        next: "update-password",
        redirectTo: "/staff?view=chapters",
        type: null,
      }),
    ).toBe("/auth/set-password?redirectTo=%2Fstaff%3Fview%3Dchapters");
  });

  it("falls back to the login continuation flow for plain sign-in callbacks", () => {
    expect(
      buildAuthCallbackRedirectPath({
        next: null,
        redirectTo: "/admin",
        type: "magiclink",
      }),
    ).toBe("/login?redirectTo=%2Fadmin");
  });

  it("treats unknown otp types as unsupported", () => {
    expect(isSupabaseEmailOtpType("invite")).toBe(true);
    expect(isSupabaseEmailOtpType("recovery")).toBe(true);
    expect(isSupabaseEmailOtpType("unknown")).toBe(false);
    expect(isSupabaseEmailOtpType(null)).toBe(false);
  });

  it("routes failed recovery callbacks back to the recovery form", () => {
    expect(
      buildAuthCallbackFailureRedirectPath(
        {
          next: "update-password",
          redirectTo: "/app",
          type: "recovery",
        },
        "recovery_invalid_or_expired",
      ),
    ).toBe(
      "/auth/forgot-password?redirectTo=%2Fapp&recoveryError=recovery_invalid_or_expired",
    );
  });

  it("keeps invite and generic callback failures distinct", () => {
    expect(
      getAuthCallbackFailureCode({
        authAvailable: true,
        next: null,
        type: "invite",
      }),
    ).toBe("invite_invalid_or_expired");
    expect(
      getAuthCallbackFailureCode({
        authAvailable: true,
        next: null,
        type: "magiclink",
      }),
    ).toBe("callback_invalid_or_expired");
    expect(
      getAuthCallbackFailureCode({
        authAvailable: false,
        next: "update-password",
        type: "recovery",
      }),
    ).toBe("auth_unavailable");
  });

  it("uses safe user-facing callback failure copy", () => {
    expect(
      getAuthCallbackFailureMessage("recovery_invalid_or_expired"),
    ).toContain("Request a new secure link");
    expect(
      getAuthCallbackFailureMessage("invite_invalid_or_expired"),
    ).toContain("new invitation");
    expect(getAuthCallbackFailureMessage("unknown")).toBeNull();
  });
});
