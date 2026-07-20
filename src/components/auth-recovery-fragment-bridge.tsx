"use client";

import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { parseAuthRecoveryFragment } from "@/services/auth-recovery-fragment";

type AuthRecoveryFragmentBridgeProps = {
  anonKey: string;
  redirectTo: string;
  supabaseUrl: string;
};

export function AuthRecoveryFragmentBridge({
  anonKey,
  redirectTo,
  supabaseUrl,
}: AuthRecoveryFragmentBridgeProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function completeRecovery() {
      const session = parseAuthRecoveryFragment(window.location.hash);
      window.history.replaceState(null, "", window.location.pathname);

      if (!session) {
        if (active) {
          setError("This password reset link is invalid or has expired.");
        }
        return;
      }

      const client = createBrowserClient(supabaseUrl, anonKey);
      const { error: sessionError } = await client.auth.setSession({
        access_token: session.accessToken,
        refresh_token: session.refreshToken,
      });

      if (sessionError) {
        if (active) {
          setError("This password reset link could not be verified. Request a new link and try again.");
        }
        return;
      }

      router.replace(
        `/auth/set-password?redirectTo=${encodeURIComponent(redirectTo)}`,
      );
      router.refresh();
    }

    void completeRecovery();

    return () => {
      active = false;
    };
  }, [anonKey, redirectTo, router, supabaseUrl]);

  return (
    <div
      className="space-y-4 rounded-2xl p-8 text-center"
      style={{
        background: "#161b22",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
      }}
    >
      <p role="status" className="text-sm text-[#93c5fd]">
        {error ?? "Verifying your secure password reset link..."}
      </p>
      {error ? (
        <Link
          href={`/auth/forgot-password?redirectTo=${encodeURIComponent(redirectTo)}`}
          className="inline-flex rounded-xl bg-[#b8253a] px-4 py-3 text-sm font-bold text-white"
        >
          Request a new reset link
        </Link>
      ) : null}
    </div>
  );
}
