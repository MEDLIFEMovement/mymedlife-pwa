import Link from "next/link";
import type { LumaEventLoopPilotReadback } from "@/services/luma-event-loop-pilot";

type LumaEventLoopPilotPanelProps = {
  readback: LumaEventLoopPilotReadback;
  compact?: boolean;
};

export function LumaEventLoopPilotPanel({
  readback,
  compact = false,
}: LumaEventLoopPilotPanelProps) {
  return (
    <section className="rounded-[1.6rem] border border-[#bfdbfe] bg-[#f8fbff] p-4 shadow-[0_14px_38px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <p className="app-eyebrow app-eyebrow-blue">{readback.eyebrow}</p>
            <span className="rounded-full border border-[#bfdbfe] bg-white px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">
              {readback.statusLabel}
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {readback.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {readback.summary}
          </p>
          <p className="mt-3 rounded-[1.1rem] border border-[#dbeafe] bg-white px-3 py-2 text-xs leading-5 text-slate-600">
            {readback.statusDetail}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={readback.primaryAction.href}
            className="rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
          >
            {readback.primaryAction.label}
          </Link>
          <Link
            href={readback.secondaryAction.href}
            className="rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#eff6ff]"
          >
            {readback.secondaryAction.label}
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {readback.cards.map((card) => (
          <article
            key={card.label}
            className="rounded-[1.1rem] border border-[#dbeafe] bg-white p-3"
          >
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#2563eb]">
              {card.label}
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-950">
              {card.value}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {card.detail}
            </p>
          </article>
        ))}
      </div>

      {readback.importedEvents.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {readback.importedEvents.map((event) => (
            <article
              key={event.id}
              className="rounded-[1.1rem] border border-[#dbeafe] bg-white px-3 py-2"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {event.title}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {event.timing} · imported from Luma
                  </p>
                </div>
                {event.href ? (
                  <a
                    href={event.href}
                    className="w-fit rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-xs font-semibold text-[#1d4ed8]"
                    rel="noreferrer"
                    target="_blank"
                  >
                    View Luma
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <div className={compact ? "mt-4 flex flex-wrap gap-2" : "mt-4 grid gap-2 sm:grid-cols-2"}>
        {readback.safetyGates.map((gate) => (
          <span
            key={gate}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
          >
            {gate}
          </span>
        ))}
      </div>
    </section>
  );
}
