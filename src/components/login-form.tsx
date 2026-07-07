"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signInWithPassword, type LoginActionState } from "@/app/login/actions";

type LoginFormProps = {
  redirectTo?: string;
  signInEnabled?: boolean;
  initialStatus?: LoginActionState["status"];
  initialMessage?: string;
  initialEmail?: string;
};

export function LoginForm({
  redirectTo = "/",
  signInEnabled = true,
  initialStatus = "idle",
  initialMessage = "Use one account. myMEDLIFE routes you into the right workspace after sign-in.",
  initialEmail = "",
}: LoginFormProps) {
  const initialLoginActionState: LoginActionState = {
    status: initialStatus,
    message: initialMessage,
    email: initialEmail,
  };
  const [state, formAction] = useActionState(
    signInWithPassword,
    initialLoginActionState,
  );

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-2xl p-8"
      style={{
        background: "#161b22",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
      }}
    >
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div>
        <label
          htmlFor="login-email"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
          style={{ color: "#6b7280" }}
        >
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          defaultValue={state.email}
          autoComplete="email"
          placeholder="you@example.com"
          required
          disabled={!signInEnabled}
          className="w-full rounded-xl border-[1.5px] border-white/10 bg-[#0d1117] px-4 py-2.5 text-sm text-[#f3f4f6] transition-all placeholder:text-[#6b7280] focus:border-[#b8253a] focus:outline-none disabled:opacity-60"
          style={{
            background: "#0d1117",
            color: "#f3f4f6",
          }}
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label
            htmlFor="login-password"
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "#6b7280" }}
          >
            Password
          </label>
          <button
            type="button"
            className="text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: "#b8253a" }}
            title="Use the secure link from your invite or password reset email."
          >
            Forgot password?
          </button>
        </div>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          disabled={!signInEnabled}
          className="w-full rounded-xl border-[1.5px] border-white/10 bg-[#0d1117] px-4 py-2.5 text-sm text-[#f3f4f6] transition-all placeholder:text-[#6b7280] focus:border-[#b8253a] focus:outline-none disabled:opacity-60"
          style={{
            background: "#0d1117",
            color: "#f3f4f6",
          }}
        />
      </div>

      {state.status !== "idle" ? (
        <p
          role="status"
          className="rounded-lg px-3 py-2 text-xs"
          style={{
            color: state.status === "error" ? "#fca5a5" : "#93c5fd",
            background:
              state.status === "error"
                ? "rgba(184,37,58,0.15)"
                : "rgba(37,99,235,0.12)",
            border: state.status === "error"
              ? "1px solid rgba(184,37,58,0.3)"
              : "1px solid rgba(37,99,235,0.24)",
          }}
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton signInEnabled={signInEnabled} />
    </form>
  );
}

function SubmitButton({ signInEnabled }: { signInEnabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || !signInEnabled}
      className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all disabled:opacity-50"
      style={{ background: "#b8253a" }}
    >
      {pending ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8v8z"
            />
          </svg>
          Signing in...
        </>
      ) : (
        "Sign in"
      )}
    </button>
  );
}
