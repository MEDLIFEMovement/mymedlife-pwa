import type { IntegrationEvent, OutboxItem } from "@/shared/types/domain";

type EventOutboxLogProps = {
  events: IntegrationEvent[];
  outboxItems: OutboxItem[];
};

export function EventOutboxLog({ events, outboxItems }: EventOutboxLogProps) {
  return (
    <section className="app-surface rounded-[2rem] p-4">
      <div>
        <p className="app-eyebrow app-eyebrow-slate">Event and outbox log</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">Automation-ready, mock-only</h2>
        <p className="app-copy mt-2">
          These records show what future n8n, HubSpot, Luma, and warehouse
          workflows could consume. Nothing here sends a live external write.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-950">Structured events</h3>
          {events.map((event) => (
            <article key={event.id} className="app-surface-soft rounded-2xl p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{event.title}</p>
                  <p className="mt-1 font-mono text-xs text-slate-500">
                    {event.eventType}
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-500">
                  {event.status}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{event.detail}</p>
            </article>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-950">Automation outbox</h3>
          {outboxItems.map((item) => (
            <article key={item.id} className="app-surface-soft rounded-2xl p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-950">{item.destination}</p>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
                  {item.status}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.payloadSummary}</p>
              <p className="mt-2 font-mono text-xs text-slate-400">
                source: {item.sourceEventId}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
