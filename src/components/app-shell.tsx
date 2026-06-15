import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { href: "/chapter", label: "Chapter" },
  { href: "/rush-month", label: "Rush Month" },
  { href: "/rush-month/actions", label: "Actions" },
  { href: "/rush-month/evidence", label: "Evidence" },
  { href: "/rush-month/review", label: "Review" },
  { href: "/coach", label: "Coach" },
  { href: "/admin", label: "Admin" },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <main className="min-h-screen px-4 pb-10 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="rounded-[2rem] border border-white/12 bg-white/[0.06] p-4 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/" className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
                myMEDLIFE
              </p>
              <p className="text-xl font-semibold text-white">Rush Month operating shell</p>
            </Link>
            <nav className="flex gap-2 overflow-x-auto pb-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="shrink-0 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-sm font-medium text-white/72"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
