import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AuthSessionPanel } from "@/components/auth-session-panel";
import { LoginForm } from "@/components/login-form";
import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import {
  getAuthSessionState,
  getDisabledAuthSessionState,
} from "@/services/auth-session";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("login");
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const { client, config } = await createLocalSupabaseServerClient();
  const session = client
    ? await getAuthSessionState(client)
    : getDisabledAuthSessionState(config);

  return (
    <AppShell>
      <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(145deg,#0a3b88_0%,#0b4f9b_58%,#081a3a_100%)] p-5 shadow-[0_24px_80px_rgba(2,14,38,0.32)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f7d05e]">
          Sign in
        </p>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Sign in to continue into your myMEDLIFE role.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">
              Use a seeded account to open the matching member, leader, coach,
              or staff experience with a real session-backed route.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-sm font-semibold text-white">Current access boundaries</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-white/72">
              <li>Accounts stay limited to seeded review users.</li>
              <li>Broader browser saves stay held back.</li>
              <li>Proof uploads and public sharing stay held back.</li>
              <li>HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, and AI remain off.</li>
            </ul>
            <Link
              href="/onboarding"
              className="mt-4 inline-flex rounded-full bg-[#f7d05e] px-4 py-2 text-sm font-semibold text-[#10223f]"
            >
              See onboarding flow
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <LoginForm />
        <AuthSessionPanel session={session} />
      </div>

      <section className="app-surface rounded-[2rem] p-5">
        <h2 className="text-xl font-semibold text-slate-950">Use a seeded account</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600">
          <li>Choose one of the seeded emails from the sign-in list below.</li>
          <li>Use the shared review password <code className="text-[#2563eb]">password</code>.</li>
          <li>After sign-in, continue into the member, leader, coach, or staff view that matches the account.</li>
          <li>
            Use <Link href="/admin" className="text-[#2563eb] underline">Admin</Link>{" "}
            when you need to inspect broader system posture.
          </li>
        </ol>
      </section>
    </AppShell>
  );
}
