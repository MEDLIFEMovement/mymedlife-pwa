import { redirect } from "next/navigation";

import { AuthRecoveryFragmentBridge } from "@/components/auth-recovery-fragment-bridge";
import { LoginShell } from "@/components/login-shell";
import { decodeAuthRecoveryContinuation } from "@/services/auth-recovery";
import { getSupabaseAuthConfig } from "@/services/supabase-auth-config";

type AuthRecoveryCompletePageProps = {
  params: Promise<{ continuation: string }>;
};

export const dynamic = "force-dynamic";

export default async function AuthRecoveryCompletePage({
  params,
}: AuthRecoveryCompletePageProps) {
  const { continuation } = await params;
  const redirectTo = decodeAuthRecoveryContinuation(continuation);
  const config = getSupabaseAuthConfig(process.env);

  if (!config.enabled) {
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  return (
    <LoginShell>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-extrabold text-white">
          Complete password recovery
        </h1>
      </div>
      <AuthRecoveryFragmentBridge
        anonKey={config.anonKey}
        redirectTo={redirectTo}
        supabaseUrl={config.url}
      />
    </LoginShell>
  );
}
