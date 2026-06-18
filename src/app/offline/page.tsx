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
    <main className="min-h-screen bg-[#061412] px-4 py-6 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col justify-between rounded-lg border border-white/12 bg-[#0b211d] p-5 shadow-2xl shadow-black/30">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/70">
            myMEDLIFE
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight">
            You are offline
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/70">
            The app can show this recovery screen without saving private chapter
            data on the device. Reconnect to continue live Rush Month work.
          </p>
        </div>

        <div className="mt-8 grid gap-3">
          {recoveryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border border-emerald-200/20 bg-emerald-200/10 px-4 py-3 text-sm font-semibold text-emerald-50"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <p className="mt-8 rounded-lg border border-white/10 bg-black/20 p-3 text-xs leading-5 text-white/56">
          Offline mode does not submit assignments, upload proof, update points,
          send nudges, or run external automation.
        </p>
      </section>
    </main>
  );
}
