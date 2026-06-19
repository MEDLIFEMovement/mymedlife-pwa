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
      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
          Goal 58
        </p>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Local sign-in is the bridge from review mode to real MVP behavior.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">
              This page adds Supabase Auth session plumbing for fake local users.
              It is the next required step before browser writes can safely use
              server-derived identity instead of the local role switcher.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
            <p className="text-sm font-semibold text-white">Safety boundary</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-white/64">
              <li>Production auth remains disabled.</li>
              <li>Browser writes remain disabled.</li>
              <li>Proof uploads and public sharing remain disabled.</li>
              <li>HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, and AI writes remain disabled.</li>
            </ul>
            <Link
              href="/onboarding"
              className="mt-4 inline-flex rounded-full border border-white/12 bg-black/20 px-4 py-2 text-sm font-semibold text-white"
            >
              Review onboarding path
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <LoginForm />
        <AuthSessionPanel session={session} />
      </div>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
        <h2 className="text-xl font-semibold text-white">How to test locally</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-white/64">
          <li>Run the local Supabase stack and seed data.</li>
          <li>
            Set <code className="text-emerald-100">MYMEDLIFE_AUTH_MODE=local_supabase</code>.
          </li>
          <li>
            Set the local <code className="text-emerald-100">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
          </li>
          <li>Sign in with any fake seed user and password `password`.</li>
          <li>
            Use <Link href="/admin" className="text-emerald-100 underline">Admin</Link>{" "}
            to confirm writes and external sends are still blocked.
          </li>
        </ol>
      </section>
    </AppShell>
  );
}
