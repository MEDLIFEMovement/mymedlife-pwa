import type { IntegrationEvent, OutboxItem } from "@/shared/types/domain";

type EventOutboxLogProps = {
  events: IntegrationEvent[];
  outboxItems: OutboxItem[];
};

export function EventOutboxLog({ events, outboxItems }: EventOutboxLogProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#071d1a]/80 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/70">
          Event and outbox log
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Automation-ready, mock-only</h2>
        <p className="mt-2 text-sm leading-6 text-white/66">
          These records show what future n8n, HubSpot, Luma, and warehouse
          workflows could consume. Nothing here sends a live external write.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">Structured events</h3>
          {events.map((event) => (
            <article key={event.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{event.title}</p>
                  <p className="mt-1 font-mono text-xs text-emerald-100/70">
                    {event.eventType}
                  </p>
                </div>
                <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-white/64">
                  {event.status}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/64">{event.detail}</p>
            </article>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">Automation outbox</h3>
          {outboxItems.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">{item.destination}</p>
                <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-xs text-amber-100">
                  {item.status}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/64">{item.payloadSummary}</p>
              <p className="mt-2 font-mono text-xs text-white/42">
                source: {item.sourceEventId}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
