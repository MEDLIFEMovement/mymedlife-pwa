import { AppShell } from "@/components/app-shell";
import { EventOutboxLog } from "@/components/event-outbox-log";
import { integrationEvents, outboxItems } from "@/data/mock-rush-month";

export default function AdminPage() {
  return (
    <AppShell>
      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
          Admin / Super Admin placeholder
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Integration controls stay disabled.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
          Goal 2 only shows the future event and outbox posture. Real HubSpot,
          Luma, warehouse, Power BI, and n8n writes remain off until explicitly
          approved.
        </p>
      </section>

      <EventOutboxLog events={integrationEvents} outboxItems={outboxItems} />
    </AppShell>
  );
}
