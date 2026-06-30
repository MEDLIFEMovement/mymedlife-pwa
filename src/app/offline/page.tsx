import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline",
  description: "Offline fallback for the myMEDLIFE PWA.",
};

const recoveryLinks = [
  { href: "/", label: "Home" },
  { href: "/rush-month", label: "Rush Month" },
  { href: "/rush-month/actions", label: "Actions" },
];

export default function OfflinePage() {
  return (
    <main className="min-h-screen px-4 py-6">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col justify-between rounded-[2rem] border border-slate-200 bg-white/96 p-5 shadow-[0_18px_54px_rgb(var(--mymedlife-shadow-rgb)/0.08)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-primary-button)]">
            myMEDLIFE
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-slate-950">
            You are offline
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The app can show this recovery screen without saving private chapter
            data on the device. Reconnect to continue live Rush Month work.
          </p>
        </div>

        <div className="mt-8 grid gap-3">
          {recoveryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[1.15rem] border border-[var(--accent)]/24 bg-[var(--mymedlife-info-surface)] px-4 py-3 text-sm font-semibold text-[var(--mymedlife-primary-button)]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <p className="mt-8 rounded-[1.15rem] border border-[var(--mymedlife-primary-button)]/26 bg-[var(--mymedlife-badge-background)] p-3 text-xs leading-5 text-slate-600">
          Offline mode does not submit assignments, upload proof, update points,
          send nudges, or run external automation.
        </p>
      </section>
    </main>
  );
}
