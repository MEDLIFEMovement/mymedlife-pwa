"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  requestPasswordRecovery,
  type ForgotPasswordActionState,
} from "@/app/auth/forgot-password/actions";

type AuthForgotPasswordFormProps = {
  redirectTo: string;
  recoveryEnabled: boolean;
  initialMessage: string;
  initialStatus?: ForgotPasswordActionState["status"];
};

export function AuthForgotPasswordForm({
  redirectTo,
  recoveryEnabled,
  initialMessage,
  initialStatus,
}: AuthForgotPasswordFormProps) {
  const initialState: ForgotPasswordActionState = {
    status: initialStatus ?? (recoveryEnabled ? "idle" : "disabled"),
    message: initialMessage,
    email: "",
  };
  const [state, formAction] = useActionState(
    requestPasswordRecovery,
    initialState,
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
          htmlFor="recovery-email"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
          style={{ color: "#6b7280" }}
        >
          Email
        </label>
        <input
          id="recovery-email"
          name="email"
          type="email"
          defaultValue={state.email}
          autoComplete="email"
          placeholder="you@example.com"
          required
          disabled={!recoveryEnabled || state.status === "sent"}
          className="w-full rounded-xl border-[1.5px] border-white/10 bg-[#0d1117] px-4 py-2.5 text-sm text-[#f3f4f6] transition-all placeholder:text-[#6b7280] focus:border-[#b8253a] focus:outline-none disabled:opacity-60"
        />
      </div>

      <p
        role="status"
        className="rounded-lg px-3 py-2 text-xs"
        style={{
          color: state.status === "error" ? "#fca5a5" : "#93c5fd",
          background:
            state.status === "error"
              ? "rgba(184,37,58,0.15)"
              : "rgba(37,99,235,0.12)",
          border:
            state.status === "error"
              ? "1px solid rgba(184,37,58,0.3)"
              : "1px solid rgba(37,99,235,0.24)",
        }}
      >
        {state.message}
      </p>

      {state.status === "sent" ? null : (
        <RecoverySubmitButton recoveryEnabled={recoveryEnabled} />
      )}

      <Link
        href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}
        className="block text-center text-sm font-semibold text-[#f3f4f6] hover:text-white"
      >
        Back to sign in
      </Link>
    </form>
  );
}

function RecoverySubmitButton({ recoveryEnabled }: { recoveryEnabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || !recoveryEnabled}
      className="flex w-full items-center justify-center rounded-xl bg-[#b8253a] py-3 text-sm font-bold text-white disabled:opacity-50"
    >
      {pending ? "Sending secure link..." : "Send password reset link"}
    </button>
  );
}
