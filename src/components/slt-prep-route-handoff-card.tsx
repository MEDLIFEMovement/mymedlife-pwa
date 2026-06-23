import Link from "next/link";

export function SltPrepRouteHandoffCard({
  eyebrow,
  title,
  detail,
  backHref,
  backLabel,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <section className="rounded-[1.35rem] border border-[#bfdbfe] bg-[#f8fbff] p-4">
      <p className="app-eyebrow app-eyebrow-blue">{eyebrow}</p>
      <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-base font-semibold leading-6 text-slate-950">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
        </div>
        <Link
          href={backHref}
          className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700"
        >
          {backLabel}
        </Link>
      </div>
    </section>
  );
}
