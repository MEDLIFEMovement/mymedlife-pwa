import { redirect } from "next/navigation";
import { AuthSetPasswordForm } from "@/components/auth-set-password-form";
import { LoginShell } from "@/components/login-shell";
import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import {
  getAuthSessionState,
  normalizeLoginRedirect,
} from "@/services/auth-session";

type SetPasswordPageProps = {
  searchParams?: Promise<{
    redirectTo?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function SetPasswordPage(props: SetPasswordPageProps) {
  const query = (await props.searchParams) ?? {};
  const redirectTo = normalizeLoginRedirect(query.redirectTo ?? null);
  const { client } = await createLocalSupabaseServerClient();

  if (!client) {
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  const session = await getAuthSessionState(client);

  if (session.status !== "signed_in") {
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  return (
    <LoginShell>
      <div className="mb-8 flex flex-col items-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Finish account setup
        </h1>
        <p className="mt-1.5 text-center text-sm" style={{ color: "#6b7280" }}>
          Set a password for {session.user?.email ?? "your myMEDLIFE account"}
          , then continue into the correct workspace.
        </p>
      </div>
      <div id="main-content" tabIndex={-1}>
        <AuthSetPasswordForm redirectTo={redirectTo} />
      </div>
    </LoginShell>
  );
}
