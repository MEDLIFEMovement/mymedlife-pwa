"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signInWithPassword, type LoginActionState } from "@/app/login/actions";
import type { SupabaseAuthConfig } from "@/services/supabase-auth-config";

type LoginFormProps = {
  redirectTo?: string;
  config: SupabaseAuthConfig;
};

const fakeAccounts = [
  "member.a@mymedlife.test",
  "committee.member@mymedlife.test",
  "committee.chair@mymedlife.test",
  "leader.a@mymedlife.test",
  "eboard.a@mymedlife.test",
  "coach@mymedlife.test",
  "admin@mymedlife.test",
  "ds.admin@mymedlife.test",
  "super.admin@mymedlife.test",
];

export function LoginForm({ redirectTo = "/", config }: LoginFormProps) {
  const isHostedStaging = config.isHostedStaging;
  const [state, formAction] = useActionState(
    signInWithPassword,
    getInitialLoginActionState(isHostedStaging),
  );

  return (
    <form
      action={formAction}
      className="rounded-[2rem] border border-white/12 bg-white/[0.06] p-5"
    >
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
          {isHostedStaging ? "Hosted staging Supabase Auth" : "Local Supabase Auth"}
        </p>
        <h2 className="text-2xl font-semibold text-white">
          {isHostedStaging ? "Sign in to the staging review app" : "Sign in to the local MVP"}
        </h2>
        <p className="text-sm leading-6 text-white/64">
          {isHostedStaging
            ? "This uses the approved staging host and staging Supabase project only. It does not enable production auth, browser writes, or external automation."
            : "This uses fake local seed users only. It does not create production users, enable browser writes, or send external automation."}
        </p>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-white">
          Email
          <input
            name="email"
            type="email"
            defaultValue={state.email}
            list={isHostedStaging ? undefined : "fake-local-accounts"}
            autoComplete="email"
            className="rounded-2xl border border-white/14 bg-black/24 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/34 focus:border-emerald-200"
          />
        </label>
        {!isHostedStaging ? (
          <datalist id="fake-local-accounts">
            {fakeAccounts.map((email) => (
              <option key={email} value={email} />
            ))}
          </datalist>
        ) : null}

        <label className="grid gap-2 text-sm font-semibold text-white">
          Password
          <input
            name="password"
            type="password"
            defaultValue={isHostedStaging ? "" : "password"}
            autoComplete="current-password"
            className="rounded-2xl border border-white/14 bg-black/24 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/34 focus:border-emerald-200"
          />
        </label>
      </div>

      <div
        role="status"
        className={[
          "mt-4 rounded-2xl border px-4 py-3 text-sm leading-6",
          state.status === "error"
            ? "border-rose-300/30 bg-rose-300/10 text-rose-100"
            : state.status === "disabled"
              ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
              : "border-white/10 bg-white/[0.04] text-white/62",
        ].join(" ")}
      >
        {state.message}
      </div>

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
      className="mt-5 w-full rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-[#06211d] transition hover:bg-emerald-200 disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? "Signing in..." : "Sign in"}
    </button>
  );
}

function getInitialLoginActionState(
  isHostedStaging: boolean,
): LoginActionState {
  return isHostedStaging
    ? {
        status: "idle",
        message:
          "Use an approved staging account on staging.mymedlife.org only.",
        email: "",
      }
    : {
        status: "idle",
        message: "Use a fake local Supabase account from the seed data.",
        email: "member.a@mymedlife.test",
      };
}
