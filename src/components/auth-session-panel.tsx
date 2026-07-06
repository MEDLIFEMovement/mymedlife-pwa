import Link from "next/link";
import { signOut } from "@/app/login/actions";
import type { AuthSessionState } from "@/services/auth-session";
import { getLocalSandboxAuthLandingRoute } from "@/services/local-sandbox-auth-routing";

type AuthSessionPanelProps = {
  redirectTo?: string;
  session: AuthSessionState;
};

export function AuthSessionPanel({
  redirectTo = "/",
  session,
}: AuthSessionPanelProps) {
  if (session.status !== "signed_in" || !session.user) {
    return null;
  }

  const continueHref =
    redirectTo === "/"
      ? getLocalSandboxAuthLandingRoute(session.user.email) ?? redirectTo
      : redirectTo;

  return (
    <section
      className="rounded-2xl p-8"
      style={{
        background: "#161b22",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
      }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: "#6b7280" }}
      >
        Current session
      </p>
      <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white">
        {session.user.displayName}
      </h2>
      <p className="mt-1 text-sm text-[#9ca3af]">{session.user.email}</p>
      <p className="mt-4 text-sm leading-6 text-[#9ca3af]">
        This account is ready to continue into its role-based workspace.
      </p>
      <div className="mt-6 grid gap-3">
        <Link
          href={continueHref}
          className="rounded-xl py-3 text-center text-sm font-bold text-white transition-all"
          style={{ background: "#b8253a" }}
        >
          Continue into myMEDLIFE
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-xl border px-4 py-3 text-sm font-semibold text-[#f3f4f6] transition"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
              background: "#0d1117",
            }}
          >
            Sign out
          </button>
        </form>
      </div>
    </section>
  );
}
