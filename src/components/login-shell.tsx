import type { ReactNode } from "react";
import Image from "next/image";

type LoginShellProps = {
  children: ReactNode;
};

export function LoginShell({ children }: LoginShellProps) {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
      style={{
        fontFamily: "'Plus Jakarta Sans', var(--font-space-grotesk), sans-serif",
        background: "#0d1117",
      }}
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

      <div className="relative w-full max-w-[360px]">
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
          <h1 className="text-3xl font-extrabold tracking-tight text-white">myMEDLIFE</h1>
          <p className="mt-1.5 text-sm" style={{ color: "#6b7280" }}>
            Sign in to your workspace
          </p>
        </div>

        <div id="main-content" tabIndex={-1}>
          {children}
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: "#374151" }}>
          &copy; {new Date().getFullYear()} myMEDLIFE. All rights reserved.
        </p>
      </div>
    </main>
  );
}
