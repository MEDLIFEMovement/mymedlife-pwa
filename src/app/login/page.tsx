import { AuthSessionPanel } from "@/components/auth-session-panel";
import { LoginForm } from "@/components/login-form";
import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import {
  getAuthSessionState,
  getDisabledAuthSessionState,
  normalizeLoginRedirect,
} from "@/services/auth-session";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("login");
export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams?: Promise<{
    redirectTo?: string;
  }>;
};

export default async function LoginPage(props: LoginPageProps) {
  const query = (await props.searchParams) ?? {};
  const redirectTo = normalizeLoginRedirect(query.redirectTo);
  const { client, config } = await createLocalSupabaseServerClient();
  const session = client
    ? await getAuthSessionState(client, {
        isLocalOnly: config.isLocalOnly,
        sessionLabel:
          config.reviewEnvironment === "staging"
            ? "hosted staging Supabase Auth"
            : "local Supabase Auth",
      })
    : getDisabledAuthSessionState(config);

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <a
        href="#main-content"
        className="sr-only rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-[#08224c] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to sign in
      </a>

      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-4xl items-stretch">
        <section className="relative flex w-full flex-col justify-center overflow-hidden rounded-[2.25rem] border border-[#bfdbfe] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(93,143,246,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(191,219,254,0.34),transparent_34%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#bfdbfe] bg-[#dbeafe] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
                  myMEDLIFE
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  Secure sign in
                </span>
              </div>

              <div className="max-w-2xl space-y-4">
                <p className="app-eyebrow app-eyebrow-blue">Sign in</p>
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Sign in to myMEDLIFE.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  One account, one platform, and one clean entry point. After you sign in,
                  myMEDLIFE routes you to the workspace your role can actually use.
                </p>
              </div>

              <div className="app-surface-info rounded-[1.75rem] p-4 sm:p-5">
                <p className="text-sm font-semibold text-slate-950">
                  What this login does
                </p>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
                  <li>Routes by your actual role after authentication.</li>
                  <li>Lets approved staging reviewers use the seeded access path when hosted auth is disabled.</li>
                  <li>Keeps member, leader, staff, admin, and SLT Prep workspaces separate after sign-in.</li>
                </ul>
              </div>
            </div>

            <div
              id="main-content"
              tabIndex={-1}
              className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white/96 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-6"
            >
              <LoginForm redirectTo={redirectTo} />
              <AuthSessionPanel session={session} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
