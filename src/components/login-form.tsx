"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signInWithPassword, type LoginActionState } from "@/app/login/actions";

type LoginFormProps = {
  redirectTo?: string;
};

const fakeAccounts = [
  "member.a@mymedlife.test",
  "committee.member@mymedlife.test",
  "committee.chair@mymedlife.test",
  "leader.a@mymedlife.test",
  "eboard.a@mymedlife.test",
  "coach@mymedlife.test",
  "general.staff@mymedlife.test",
  "admin@mymedlife.test",
  "ds.admin@mymedlife.test",
  "super.admin@mymedlife.test",
];

const initialLoginActionState: LoginActionState = {
  status: "idle",
  message: "Choose a seeded myMEDLIFE account to continue.",
  email: "member.a@mymedlife.test",
};

export function LoginForm({ redirectTo = "/app" }: LoginFormProps) {
  const [state, formAction] = useActionState(
    signInWithPassword,
    initialLoginActionState,
  );

  return (
    <form
      action={formAction}
      className="app-surface rounded-[2rem] p-5"
    >
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div className="space-y-2">
        <p className="app-eyebrow app-eyebrow-blue">
          Seeded account access
        </p>
        <h2 className="text-2xl font-semibold text-slate-950">Sign in with a seeded account</h2>
        <p className="text-sm leading-6 text-slate-600">
          Choose a member, leader, staff, admin, or traveler account to open the
          matching myMEDLIFE experience.
        </p>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-slate-950">
          Email
          <input
            name="email"
            type="email"
            defaultValue={state.email}
            list="fake-local-accounts"
            autoComplete="email"
            className="rounded-2xl border border-slate-200 bg-[#dbeafe] px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#5d8ff6]"
          />
        </label>
        <datalist id="fake-local-accounts">
          {fakeAccounts.map((email) => (
            <option key={email} value={email} />
          ))}
        </datalist>

        <label className="grid gap-2 text-sm font-semibold text-slate-950">
          Password
          <input
            name="password"
            type="password"
            defaultValue="password"
            autoComplete="current-password"
            className="rounded-2xl border border-slate-200 bg-[#dbeafe] px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#5d8ff6]"
          />
        </label>
      </div>

      <div
        role="status"
        className={[
          "mt-4 rounded-2xl border px-4 py-3 text-sm leading-6",
          state.status === "error"
            ? "border-blue-200 bg-blue-50 text-blue-700"
            : state.status === "disabled"
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-[#dbeafe] text-slate-600",
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
      className="mt-5 w-full rounded-full bg-[#2563eb] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? "Signing in..." : "Continue"}
    </button>
  );
}
