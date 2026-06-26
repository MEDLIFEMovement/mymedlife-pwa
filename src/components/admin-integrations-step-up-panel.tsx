"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  verifyDsSecretStepUpAction,
  type DsSecretStepUpActionState,
} from "@/app/admin/integrations/actions";

const initialState: DsSecretStepUpActionState = {
  status: "idle",
  message: "Re-enter the local seed password for this DS Admin session.",
};

type AdminIntegrationsStepUpPanelProps = {
  title: string;
  message: string;
};

export function AdminIntegrationsStepUpPanel({
  title,
  message,
}: AdminIntegrationsStepUpPanelProps) {
  const [state, formAction] = useActionState(
    verifyDsSecretStepUpAction,
    initialState,
  );

  return (
    <section className="app-surface-info overflow-hidden rounded-[2rem] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2563eb]">
        Secure access lock
      </p>
      <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 xl:w-[28rem]">
          {[
            "Local auth only",
            "Write-only secrets",
            "Audited changes",
          ].map((label) => (
            <span
              key={label}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-center text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-600"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <form className="mt-5 grid gap-4" action={formAction}>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
          <label className="grid gap-2 text-sm font-semibold text-slate-950">
            Seed password
            <input
              name="password"
              type="password"
              defaultValue="password"
              autoComplete="current-password"
              className="rounded-2xl border border-white/12 bg-[#f8fbff] px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#2563eb]"
            />
          </label>
        </div>

        <div
          role="status"
          className={[
            "rounded-2xl border px-4 py-3 text-sm leading-6",
            state.status === "success"
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : state.status === "error"
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600",
          ].join(" ")}
        >
          {state.message}
        </div>

        <div className="flex flex-wrap gap-3">
          <SubmitButton />
        </div>
      </form>
    </section>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-[#2563eb] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? "Verifying..." : "Unlock secure area"}
    </button>
  );
}
