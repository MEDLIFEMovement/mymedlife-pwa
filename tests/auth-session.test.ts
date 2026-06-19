import { describe, expect, it } from "vitest";
import {
  getAuthDisplayName,
  getAuthSessionState,
  getDisabledAuthSessionState,
  normalizeLoginRedirect,
  type AuthReader,
} from "@/services/auth-session";

describe("auth session service", () => {
  it("summarizes disabled auth config", () => {
    const state = getDisabledAuthSessionState({
      enabled: false,
      mode: "disabled",
      isLocalOnly: true,
      reason: "Auth is off.",
    });

    expect(state).toMatchObject({
      status: "disabled",
      message: "Auth is off.",
      user: null,
    });
  });

  it("detects a signed-in Supabase Auth user", async () => {
    const state = await getAuthSessionState(
      createFakeAuthReader({
        data: {
          user: {
            id: "user-1",
            email: "member.a@mymedlife.test",
            user_metadata: { name: "Sofia Alvarez" },
          },
        },
        error: null,
      }),
    );

    expect(state).toMatchObject({
      status: "signed_in",
      user: {
        id: "user-1",
        email: "member.a@mymedlife.test",
        displayName: "Sofia Alvarez",
      },
    });
  });

  it("treats missing sessions as signed out", async () => {
    const state = await getAuthSessionState(
      createFakeAuthReader({
        data: { user: null },
        error: { name: "AuthSessionMissingError", message: "Auth session missing!" },
      }),
    );

    expect(state).toMatchObject({
      status: "signed_out",
      user: null,
    });
  });

  it("reports unexpected auth errors without treating them as signed in", async () => {
    const state = await getAuthSessionState(
      createFakeAuthReader({
        data: { user: null },
        error: { message: "Network failed" },
      }),
    );

    expect(state.status).toBe("error");
    expect(state.user).toBeNull();
  });

  it("normalizes unsafe redirect targets", () => {
    expect(normalizeLoginRedirect("/rush-month")).toBe("/rush-month");
    expect(normalizeLoginRedirect("https://evil.example")).toBe("/");
    expect(normalizeLoginRedirect("//evil.example")).toBe("/");
    expect(normalizeLoginRedirect("/login")).toBe("/");
    expect(normalizeLoginRedirect("/rush-month\nSet-Cookie: bad")).toBe("/");
    expect(normalizeLoginRedirect(null)).toBe("/");
  });

  it("falls back to an email prefix for display names", () => {
    expect(getAuthDisplayName({ id: "user-1", email: "coach@mymedlife.test" })).toBe(
      "coach",
    );
  });
});

function createFakeAuthReader(
  result: Awaited<ReturnType<AuthReader["auth"]["getUser"]>>,
): AuthReader {
  return {
    auth: {
      async getUser() {
        return result;
      },
    },
  };
}
