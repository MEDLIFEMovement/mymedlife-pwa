import { AppShell } from "@/components/app-shell";
import { RushMonthLocalLoopDemo } from "@/components/rush-month-local-loop-demo";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthLoop");
export const dynamic = "force-dynamic";

export default async function RushMonthLoopPage() {
  const actor = await getLocalActorContext();

  return (
    <AppShell actor={actor}>
      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
          Rush Month MVP loop
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          One operating path, end to end.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
          This screen is a mock-safe local proof of the Rush Month operating
          loop: leader assignment, member action, proof submission, completion
          review, points/KPI movement, HQ sharing posture, coach decision,
          structured events, disabled outbox rows, and audit logs.
        </p>
      </section>

      <RushMonthLocalLoopDemo />
    </AppShell>
  );
}
