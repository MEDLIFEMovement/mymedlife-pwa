import Image from "next/image";
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
  const signInEnabled = Boolean(client);
  const initialMessage =
    session.status === "disabled"
      ? session.message
      : "Use one account. myMEDLIFE routes you into the right workspace after sign-in.";

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#0d1117] px-4 py-8"
      style={{ fontFamily: "'Plus Jakarta Sans', var(--font-space-grotesk), sans-serif" }}
    >
      <a
        href="#main-content"
        className="sr-only rounded-full bg-[#b8253a] px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to sign in
      </a>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(184,37,58,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[360px] flex-col justify-center">
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="/images/medlife-circle-logo.png"
            alt="myMEDLIFE logo"
            width={80}
            height={80}
            className="mb-5 h-20 w-20 object-contain"
            style={{ filter: "drop-shadow(0 0 18px rgba(184,37,58,0.45))" }}
            priority
          />
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            myMEDLIFE
          </h1>
          <p className="mt-1.5 text-sm text-[#6b7280]">
            Sign in to your workspace
          </p>
        </div>

        <div id="main-content" tabIndex={-1}>
          {session.status === "signed_in" ? (
            <AuthSessionPanel session={session} redirectTo={redirectTo} />
          ) : (
            <LoginForm
              redirectTo={redirectTo}
              signInEnabled={signInEnabled}
              initialStatus={session.status === "disabled" ? "disabled" : "idle"}
              initialMessage={initialMessage}
            />
          )}
        </div>

        <p className="mt-6 text-center text-xs text-[#374151]">
          &copy; {new Date().getFullYear()} myMEDLIFE. All rights reserved.
        </p>
      </div>
    </main>
  );
}
