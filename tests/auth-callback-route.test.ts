import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockExchangeCodeForSession = vi.fn();
const mockVerifyOtp = vi.fn();
const mockCreateServerClient = vi.fn();
const mockGetSupabaseAuthConfig = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => mockCreateServerClient(...args),
}));

vi.mock("@/services/supabase-auth-config", () => ({
  getSupabaseAuthConfig: (...args: unknown[]) => mockGetSupabaseAuthConfig(...args),
}));

describe("auth callback route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects immediately when hosted auth is disabled", async () => {
    mockGetSupabaseAuthConfig.mockReturnValueOnce({
      enabled: false,
      reason: "Hosted production Supabase Auth is disabled.",
    });

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new NextRequest(
        "https://www.mymedlife.org/auth/callback?type=invite&redirectTo=%2Fadmin",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://www.mymedlife.org/login?redirectTo=%2Fadmin&authError=auth_unavailable",
    );
    expect(mockCreateServerClient).not.toHaveBeenCalled();
  });

  it("exchanges a code for a session before redirecting", async () => {
    mockGetSupabaseAuthConfig.mockReturnValueOnce({
      enabled: true,
      url: "https://fnlhontvvprwgooevzdl.supabase.co",
      anonKey: "anon-key",
    });
    mockCreateServerClient.mockReturnValueOnce({
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession.mockResolvedValueOnce({}),
        verifyOtp: mockVerifyOtp,
      },
    });

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new NextRequest(
        "https://www.mymedlife.org/auth/callback?code=test-code&redirectTo=%2Fadmin",
      ),
    );

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("test-code");
    expect(mockVerifyOtp).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://www.mymedlife.org/login?redirectTo=%2Fadmin",
    );
  });

  it("verifies invite otp links and routes them into password setup", async () => {
    mockGetSupabaseAuthConfig.mockReturnValueOnce({
      enabled: true,
      url: "https://fnlhontvvprwgooevzdl.supabase.co",
      anonKey: "anon-key",
    });
    mockCreateServerClient.mockReturnValueOnce({
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession,
        verifyOtp: mockVerifyOtp.mockResolvedValueOnce({}),
      },
    });

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new NextRequest(
        "https://www.mymedlife.org/auth/callback?token_hash=hash-123&type=invite&redirectTo=%2Fadmin",
      ),
    );

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      type: "invite",
      token_hash: "hash-123",
    });
    expect(response.headers.get("location")).toBe(
      "https://www.mymedlife.org/auth/set-password?redirectTo=%2Fadmin",
    );
  });

  it("ignores unknown otp types instead of attempting verification", async () => {
    mockGetSupabaseAuthConfig.mockReturnValueOnce({
      enabled: true,
      url: "https://fnlhontvvprwgooevzdl.supabase.co",
      anonKey: "anon-key",
    });
    mockCreateServerClient.mockReturnValueOnce({
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession,
        verifyOtp: mockVerifyOtp,
      },
    });

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new NextRequest(
        "https://www.mymedlife.org/auth/callback?token_hash=hash-123&type=unknown&redirectTo=%2Fadmin",
      ),
    );

    expect(mockVerifyOtp).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://www.mymedlife.org/login?redirectTo=%2Fadmin&authError=callback_invalid_or_expired",
    );
  });

  it("fails closed when a recovery code cannot be exchanged", async () => {
    mockGetSupabaseAuthConfig.mockReturnValueOnce({
      enabled: true,
      url: "https://fnlhontvvprwgooevzdl.supabase.co",
      anonKey: "anon-key",
    });
    mockCreateServerClient.mockReturnValueOnce({
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession.mockResolvedValueOnce({
          error: { message: "Code expired" },
        }),
        verifyOtp: mockVerifyOtp,
      },
    });

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new NextRequest(
        "https://www.mymedlife.org/auth/callback?code=expired-code&type=recovery&redirectTo=%2Fapp",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://www.mymedlife.org/auth/forgot-password?redirectTo=%2Fapp&recoveryError=recovery_invalid_or_expired",
    );
  });

  it("fails closed when callback credentials are missing", async () => {
    mockGetSupabaseAuthConfig.mockReturnValueOnce({
      enabled: true,
      url: "https://fnlhontvvprwgooevzdl.supabase.co",
      anonKey: "anon-key",
    });
    mockCreateServerClient.mockReturnValueOnce({
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession,
        verifyOtp: mockVerifyOtp,
      },
    });

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new NextRequest(
        "https://www.mymedlife.org/auth/callback?type=invite&redirectTo=%2Fadmin",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://www.mymedlife.org/login?redirectTo=%2Fadmin&authError=invite_invalid_or_expired",
    );
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(mockVerifyOtp).not.toHaveBeenCalled();
  });
});
