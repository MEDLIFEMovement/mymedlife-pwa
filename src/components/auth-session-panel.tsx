import Link from "next/link";
import { signOut } from "@/app/login/actions";
import type { AuthSessionState } from "@/services/auth-session";

type AuthSessionPanelProps = {
  session: AuthSessionState;
};

export function AuthSessionPanel({ session }: AuthSessionPanelProps) {
  if (session.status !== "signed_in" || !session.user) {
    return (
      <section className="app-surface-info rounded-[2rem] p-5">
        <p className="app-eyebrow app-eyebrow-blue">
          Workspace access
        </p>
        <h2 className="app-title mt-2">No signed-in account yet</h2>
        <p className="app-copy mt-2">
          Sign in with a seeded account, then myMEDLIFE will route you to the matching
          role-based workspace.
        </p>
        <p className="app-copy mt-3 text-xs text-slate-500">
          {session.message}
        </p>
      </section>
    );
  }

  return (
    <section className="app-surface-info rounded-[2rem] p-5">
      <p className="app-eyebrow app-eyebrow-blue">
        Current workspace
      </p>
      <h2 className="app-title mt-2">{session.user.displayName}</h2>
      <p className="app-copy mt-2">{session.user.email}</p>
      <p className="app-copy mt-3">
        This account is ready to continue into the role-based workspace.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="rounded-full bg-[#2563eb] px-4 py-2 text-center text-sm font-semibold text-[#10223f]"
        >
          Continue into myMEDLIFE
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-[#5d8ff6]/28 hover:text-slate-950 sm:w-auto"
          >
            Sign out
          </button>
        </form>
      </div>
    </section>
  );
}
