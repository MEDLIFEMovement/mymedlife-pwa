"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  savePasswordFromRecovery,
  type SetPasswordActionState,
} from "@/app/auth/set-password/actions";

type AuthSetPasswordFormProps = {
  redirectTo: string;
};

export function AuthSetPasswordForm({
  redirectTo,
}: AuthSetPasswordFormProps) {
  const initialState: SetPasswordActionState = {
    status: "idle",
    message:
      "Set a password for this account, then the app will continue into your workspace.",
  };
  const [state, formAction] = useActionState(
    savePasswordFromRecovery,
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

      <p
        className="rounded-lg px-3 py-2 text-xs"
        style={{
          color: "#93c5fd",
          background: "rgba(37,99,235,0.12)",
          border: "1px solid rgba(37,99,235,0.24)",
        }}
      >
        Use the secure link from your invite or password reset email. No
        password is sent in plain text.
      </p>

      <div>
        <label
          htmlFor="auth-set-password"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
          style={{ color: "#6b7280" }}
        >
          New password
        </label>
        <input
          id="auth-set-password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Choose a secure password"
          required
          className="w-full rounded-xl border-[1.5px] border-white/10 bg-[#0d1117] px-4 py-2.5 text-sm text-[#f3f4f6] transition-all placeholder:text-[#6b7280] focus:border-[#b8253a] focus:outline-none"
          style={{
            background: "#0d1117",
            color: "#f3f4f6",
          }}
        />
      </div>

      <div>
        <label
          htmlFor="auth-confirm-password"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
          style={{ color: "#6b7280" }}
        >
          Confirm password
        </label>
        <input
          id="auth-confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat the password"
          required
          className="w-full rounded-xl border-[1.5px] border-white/10 bg-[#0d1117] px-4 py-2.5 text-sm text-[#f3f4f6] transition-all placeholder:text-[#6b7280] focus:border-[#b8253a] focus:outline-none"
          style={{
            background: "#0d1117",
            color: "#f3f4f6",
          }}
        />
      </div>

      {state.status === "error" ? (
        <p
          role="status"
          className="rounded-lg px-3 py-2 text-xs"
          style={{
            color: "#fca5a5",
            background: "rgba(184,37,58,0.15)",
            border: "1px solid rgba(184,37,58,0.3)",
          }}
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all disabled:opacity-50"
      style={{ background: "#b8253a" }}
    >
      {pending ? "Saving password..." : "Save password"}
    </button>
  );
}
