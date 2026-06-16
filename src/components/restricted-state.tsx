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
    <section className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/68">{message}</p>
      {nextHref && nextLabel ? (
        <Link
          href={nextHref}
          className="mt-4 inline-flex rounded-full border border-white/12 bg-black/20 px-4 py-2 text-sm font-semibold text-white"
        >
          {nextLabel}
        </Link>
      ) : null}
    </section>
  );
}
