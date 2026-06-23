import Link from "next/link";

type RestrictedStateProps = {
  eyebrow?: string;
  title: string;
  message: string;
  nextHref?: string;
  nextLabel?: string;
};

export function RestrictedState({
  eyebrow = "Restricted local view",
  title,
  message,
  nextHref,
  nextLabel,
}: RestrictedStateProps) {
  return (
    <section className="app-surface-warm rounded-[2rem] p-5">
      <p className="app-eyebrow app-eyebrow-warm">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold text-slate-950">{title}</h2>
      <p className="app-copy mt-2 max-w-2xl">{message}</p>
      {nextHref && nextLabel ? (
        <Link
          href={nextHref}
          className="mt-4 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
        >
          {nextLabel}
        </Link>
      ) : null}
    </section>
  );
}
