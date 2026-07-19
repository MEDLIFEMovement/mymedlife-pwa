import Link from "next/link";

import { WorkspaceAccountMenu } from "@/components/workspace-account-menu";
import type { LocalActorContext } from "@/services/local-actor-context";

export function MemberOperationalDataUnavailable({
  actor,
  message,
}: Readonly<{
  actor: LocalActorContext;
  message: string;
}>) {
  return (
    <main className="min-h-screen bg-[#d6e0f0] px-4 py-8 text-[#10223f]">
      <div className="mx-auto w-full max-w-[430px] overflow-hidden rounded-lg bg-white shadow-xl">
        <WorkspaceAccountMenu actor={actor} currentWorkspace="student_app" />
        <section className="px-6 py-12">
          <p className="text-xs font-bold uppercase text-[#1b4b8e]">
            Account data unavailable
          </p>
          <h1 className="mt-3 text-2xl font-extrabold">
            We could not load your approved chapter
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your signed-in identity is preserved. No TEST member, chapter, event, or
            points data has been substituted.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/onboarding"
              className="rounded-md bg-[#1b4b8e] px-4 py-2.5 text-sm font-bold text-white"
            >
              Review account setup
            </Link>
            <Link
              href="/profile"
              className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-bold text-[#10223f]"
            >
              Retry profile
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
