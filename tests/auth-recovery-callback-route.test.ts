import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockHandleAuthCallback = vi.fn();

vi.mock("@/services/auth-callback-handler", () => ({
  handleAuthCallback: (...args: unknown[]) => mockHandleAuthCallback(...args),
}));

describe("recovery auth callback route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preserves recovery intent when Supabase replaces the callback query", async () => {
    const expected = new Response(null, { status: 307 });
    mockHandleAuthCallback.mockResolvedValueOnce(expected);
    const { GET } = await import(
      "@/app/auth/callback/recovery/[continuation]/route"
    );
    const request = new NextRequest(
      "https://www.mymedlife.org/auth/callback/recovery/L2FwcA?code=test-code",
    );

    const response = await GET(request, {
      params: Promise.resolve({ continuation: "L2FwcA" }),
    });

    expect(response).toBe(expected);
    expect(mockHandleAuthCallback).toHaveBeenCalledWith(request, {
      next: "update-password",
      redirectTo: "/app",
      type: "recovery",
    });
  });

  it("bridges fragment-based recovery sessions through the browser", async () => {
    const { GET } = await import(
      "@/app/auth/callback/recovery/[continuation]/route"
    );
    const request = new NextRequest(
      "https://www.mymedlife.org/auth/callback/recovery/L2FwcA",
    );

    const response = await GET(request, {
      params: Promise.resolve({ continuation: "L2FwcA" }),
    });

    expect(response.headers.get("location")).toBe(
      "https://www.mymedlife.org/auth/recovery/complete/L2FwcA",
    );
    expect(mockHandleAuthCallback).not.toHaveBeenCalled();
  });

  it("rejects an encoded external continuation", async () => {
    mockHandleAuthCallback.mockResolvedValueOnce(new Response());
    const { GET } = await import(
      "@/app/auth/callback/recovery/[continuation]/route"
    );

    await GET(
      new NextRequest(
        "https://www.mymedlife.org/auth/callback/recovery/aHR0cHM6Ly9hdHRhY2tlci5leGFtcGxl?code=test-code",
      ),
      {
        params: Promise.resolve({
          continuation: "aHR0cHM6Ly9hdHRhY2tlci5leGFtcGxl",
        }),
      },
    );

    expect(mockHandleAuthCallback).toHaveBeenCalledWith(
      expect.any(NextRequest),
      expect.objectContaining({ redirectTo: "/" }),
    );
  });
});
