import { AuthSessionPanel } from "@/components/auth-session-panel";
import { LoginForm } from "@/components/login-form";
import { LoginShell } from "@/components/login-shell";
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
  const redirectTo = normalizeLoginRedirect(query.redirectTo ?? null);
  const { client, config } = await createLocalSupabaseServerClient();
  const session = client
    ? await getAuthSessionState(client, config)
    : getDisabledAuthSessionState(config);
  const signInEnabled = Boolean(client);
  const initialMessage =
    session.status === "disabled"
      ? session.message
      : "Use one account. myMEDLIFE routes you into the right workspace after sign-in.";

  return (
    <LoginShell>
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
    </LoginShell>
  );
}
