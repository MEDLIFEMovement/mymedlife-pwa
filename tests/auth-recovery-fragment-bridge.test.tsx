// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createBrowserClient: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  setSession: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: mocks.createBrowserClient,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));

import { AuthRecoveryFragmentBridge } from "@/components/auth-recovery-fragment-bridge";

describe("AuthRecoveryFragmentBridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createBrowserClient.mockReturnValue({
      auth: { setSession: mocks.setSession },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("establishes the recovery session, clears credentials, and continues", async () => {
    window.history.replaceState(
      null,
      "",
      "/auth/recovery/complete/L2FwcA#access_token=access-123&refresh_token=refresh-456&type=recovery",
    );
    mocks.setSession.mockResolvedValue({ error: null });

    renderBridge();

    await waitFor(() => {
      expect(mocks.setSession).toHaveBeenCalledWith({
        access_token: "access-123",
        refresh_token: "refresh-456",
      });
    });
    expect(window.location.hash).toBe("");
    expect(mocks.replace).toHaveBeenCalledWith(
      "/auth/set-password?redirectTo=%2Fapp",
    );
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("offers a new link when the fragment is incomplete", async () => {
    window.history.replaceState(
      null,
      "",
      "/auth/recovery/complete/L2FwcA#type=recovery",
    );

    renderBridge();

    expect(
      await screen.findByText("This password reset link is invalid or has expired."),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Request a new reset link" }).getAttribute("href"),
    ).toBe("/auth/forgot-password?redirectTo=%2Fapp");
    expect(mocks.setSession).not.toHaveBeenCalled();
  });

  it("offers a new link when Supabase rejects the session", async () => {
    window.history.replaceState(
      null,
      "",
      "/auth/recovery/complete/L2FwcA#access_token=access-123&refresh_token=refresh-456&type=recovery",
    );
    mocks.setSession.mockResolvedValue({
      error: { message: "Recovery session expired." },
    });

    renderBridge();

    expect(
      await screen.findByText(
        "This password reset link could not be verified. Request a new link and try again.",
      ),
    ).toBeTruthy();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});

function renderBridge() {
  return render(
    <AuthRecoveryFragmentBridge
      anonKey="anon-key"
      redirectTo="/app"
      supabaseUrl="https://project.supabase.co"
    />,
  );
}
