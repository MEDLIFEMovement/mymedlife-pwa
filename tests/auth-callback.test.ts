import { describe, expect, it } from "vitest";
import {
  buildAuthCallbackRedirectPath,
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
});
