import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mockUseActionState = vi.fn();
const mockUseFormStatus = vi.fn();

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useActionState: (...args: unknown[]) => mockUseActionState(...args),
  };
});

vi.mock("react-dom", async () => {
  const actual = await vi.importActual<typeof import("react-dom")>("react-dom");
  return {
    ...actual,
    useFormStatus: () => mockUseFormStatus(),
  };
});

describe("auth set password form", () => {
  it("renders the secure-link guidance and password fields", async () => {
    mockUseActionState.mockReturnValueOnce([
      {
        status: "idle",
        message: "Set a password for this account, then the app will continue into your workspace.",
      },
      vi.fn(),
    ]);
    mockUseFormStatus.mockReturnValueOnce({ pending: false });

    const { AuthSetPasswordForm } = await import(
      "@/components/auth-set-password-form"
    );
    const html = renderToStaticMarkup(
      <AuthSetPasswordForm redirectTo="/admin" />,
    );

    expect(html).toContain("No password is sent in plain text.");
    expect(html).toContain("New password");
    expect(html).toContain("Confirm password");
    expect(html).toContain('value="/admin"');
    expect(html).toContain("Save password");
  });

  it("renders the error state when password save fails", async () => {
    mockUseActionState.mockReturnValueOnce([
      {
        status: "error",
        message: "Session missing.",
      },
      vi.fn(),
    ]);
    mockUseFormStatus.mockReturnValueOnce({ pending: false });

    const { AuthSetPasswordForm } = await import(
      "@/components/auth-set-password-form"
    );
    const html = renderToStaticMarkup(
      <AuthSetPasswordForm redirectTo="/admin" />,
    );

    expect(html).toContain("Session missing.");
    expect(html).toContain("rgba(184,37,58,0.15)");
  });
});
