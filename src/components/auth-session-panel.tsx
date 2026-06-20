import Link from "next/link";
import { signOut } from "@/app/login/actions";
import type { AuthSessionState } from "@/services/auth-session";

type AuthSessionPanelProps = {
  session: AuthSessionState;
};

export function AuthSessionPanel({ session }: AuthSessionPanelProps) {
  const isHostedStaging = session.isHostedStaging;

  if (session.status !== "signed_in" || !session.user) {
    return (
      <section className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100">
          Auth status
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          {isHostedStaging ? "No staging session yet" : "No local session yet"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/68">{session.message}</p>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
        {isHostedStaging ? "Signed in on staging" : "Signed in locally"}
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">
        {session.user.displayName}
      </h2>
      <p className="mt-2 text-sm leading-6 text-white/68">{session.user.email}</p>
      <p className="mt-3 text-sm leading-6 text-white/64">
        {isHostedStaging
          ? "This confirms the hosted staging Supabase Auth cookie flow works on staging.mymedlife.org. Role-aware routes now prefer the signed-in staging identity while production auth remains blocked."
          : "This confirms the local Supabase Auth cookie flow works. Role-aware app routes now prefer this local session over the debug actor email when the matching fake profile exists."}
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/rush-month"
          className="rounded-full bg-emerald-300 px-4 py-2 text-center text-sm font-semibold text-[#06211d]"
        >
          Continue to Rush Month
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-full border border-white/14 px-4 py-2 text-sm font-semibold text-white/78 transition hover:border-white/28 hover:text-white sm:w-auto"
          >
            Sign out
          </button>
        </form>
      </div>
    </section>
  );
}
