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

describe("login form", () => {
  it("renders the error-state status styling from the login shell", async () => {
    mockUseActionState.mockReturnValueOnce([
      {
        status: "error",
        message: "Invalid email or password.",
        email: "member.a@mymedlife.test",
      },
      vi.fn(),
    ]);
    mockUseFormStatus.mockReturnValueOnce({ pending: false });

    const { LoginForm } = await import("@/components/login-form");
    const html = renderToStaticMarkup(
      <LoginForm
        redirectTo="/app"
        signInEnabled
        initialStatus="error"
        initialMessage="Invalid email or password."
        initialEmail="member.a@mymedlife.test"
      />,
    );

    expect(html).toContain("Invalid email or password.");
    expect(html).toContain("#fca5a5");
    expect(html).toContain("rgba(184,37,58,0.15)");
    expect(html).toContain("1px solid rgba(184,37,58,0.3)");
  });

  it("shows the pending submit affordance while sign-in is in progress", async () => {
    mockUseActionState.mockReturnValueOnce([
      {
        status: "idle",
        message: "Use one account. myMEDLIFE routes you into the right workspace after sign-in.",
        email: "",
      },
      vi.fn(),
    ]);
    mockUseFormStatus.mockReturnValueOnce({ pending: true });

    const { LoginForm } = await import("@/components/login-form");
    const html = renderToStaticMarkup(
      <LoginForm
        redirectTo="/app"
        signInEnabled
        initialStatus="idle"
        initialMessage="Use one account. myMEDLIFE routes you into the right workspace after sign-in."
      />,
    );

    expect(html).toContain("Signing in...");
    expect(html).toContain("animate-spin");
    expect(html).toContain("disabled");
  });
});
