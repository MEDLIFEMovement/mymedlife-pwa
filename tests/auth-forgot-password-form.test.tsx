import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

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
  return { ...actual, useFormStatus: () => mockUseFormStatus() };
});

describe("forgot password form", () => {
  it("renders a working recovery form and return path", async () => {
    mockUseActionState.mockReturnValueOnce([
      {
        status: "idle",
        message: "Enter the email address used for your myMEDLIFE account.",
        email: "",
      },
      vi.fn(),
    ]);
    mockUseFormStatus.mockReturnValueOnce({ pending: false });

    const { AuthForgotPasswordForm } = await import(
      "@/components/auth-forgot-password-form"
    );
    const html = renderToStaticMarkup(
      <AuthForgotPasswordForm
        redirectTo="/leader?view=events"
        recoveryEnabled
        initialMessage="Enter the email address used for your myMEDLIFE account."
      />,
    );

    expect(html).toContain('name="email"');
    expect(html).toContain("Send password reset link");
    expect(html).toContain(
      'href="/login?redirectTo=%2Fleader%3Fview%3Devents"',
    );
  });

  it("replaces the submit control with confirmation after sending", async () => {
    mockUseActionState.mockReturnValueOnce([
      {
        status: "sent",
        message: "If an account exists for that email, a secure password reset link is on its way.",
        email: "member@example.com",
      },
      vi.fn(),
    ]);
    mockUseFormStatus.mockReturnValueOnce({ pending: false });

    const { AuthForgotPasswordForm } = await import(
      "@/components/auth-forgot-password-form"
    );
    const html = renderToStaticMarkup(
      <AuthForgotPasswordForm
        redirectTo="/app"
        recoveryEnabled
        initialMessage="ignored"
      />,
    );

    expect(html).toContain("secure password reset link is on its way");
    expect(html).not.toContain("Send password reset link");
  });
});
