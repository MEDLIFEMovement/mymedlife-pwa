import { AuthForgotPasswordForm } from "@/components/auth-forgot-password-form";
import { LoginShell } from "@/components/login-shell";
import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthCallbackFailureMessage } from "@/services/auth-callback";
import { normalizeLoginRedirect } from "@/services/auth-session";

type ForgotPasswordPageProps = {
  searchParams?: Promise<{
    recoveryError?: string;
    redirectTo?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const query = (await searchParams) ?? {};
  const redirectTo = normalizeLoginRedirect(query.redirectTo ?? null);
  const { client, config } = await createLocalSupabaseServerClient();
  const callbackFailureMessage = getAuthCallbackFailureMessage(
    query.recoveryError,
  );

  return (
    <LoginShell>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-extrabold text-white">Reset your password</h1>
        <p className="mt-2 text-sm text-[#6b7280]">
          We will email you a secure link to choose a new password.
        </p>
      </div>
      <AuthForgotPasswordForm
        redirectTo={redirectTo}
        recoveryEnabled={Boolean(client)}
        initialMessage={
          callbackFailureMessage ??
          (client
            ? "Enter the email address used for your myMEDLIFE account."
            : config.reason)
        }
        initialStatus={callbackFailureMessage ? "error" : undefined}
      />
    </LoginShell>
  );
}
