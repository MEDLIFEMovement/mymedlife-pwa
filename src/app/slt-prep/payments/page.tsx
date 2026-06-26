import Link from "next/link";
import { SltPrepShell } from "@/components/slt-prep-shell";
import { SltPrepRouteHandoffCard } from "@/components/slt-prep-route-handoff-card";
import {
  SltPrepSectionCard,
  SltPrepTonePill,
} from "@/components/slt-prep-primitives";
import { SltPrepSubnav } from "@/components/slt-prep-subnav";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { buildSltChecklistDetailHref } from "@/services/slt-checklist-detail-href";
import {
  buildSltTripPrepRouteHref,
  getSltTripPrepRouteSourceContext,
  getSltTripPrepMobileQuickNavItems,
  getSltTripPrepSubnavItems,
  getSltTripPrepWorkspace,
  parseSltTripPrepRouteSource,
} from "@/services/slt-trip-prep-workspace";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("sltPrepPayments");
export const dynamic = "force-dynamic";

type SltPrepPaymentsPageProps = {
  searchParams?: Promise<{
    action?: string;
    source?: string;
    traveler?: string;
  }>;
};

export default async function SltPrepPaymentsPage({
  searchParams,
}: SltPrepPaymentsPageProps) {
  const emptySearchParams: { action?: string; source?: string; traveler?: string } = {};
  const [actor, search] = await Promise.all([
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const workspace = getSltTripPrepWorkspace(actor, search.traveler);
  const routeSource = parseSltTripPrepRouteSource(search.source);
  const routeSourceContext = getSltTripPrepRouteSourceContext(
    routeSource,
    search.traveler,
    workspace.traveler?.displayName,
  );

  if (!workspace.canReadWorkspace || !workspace.traveler) {
    return (
      <SltPrepShell
        actor={actor}
        mobileQuickItemsOverride={getSltTripPrepMobileQuickNavItems({
          source: routeSource ?? undefined,
          travelerId: search.traveler,
        })}
        hideTopHeader
        showMobileQuickItemHelpers={false}
        showDebugTools={false}
      >
        <SltPrepSubnav
          items={getSltTripPrepSubnavItems({
            source: routeSource ?? undefined,
            travelerId: search.traveler,
          })}
        />
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref={buildSltTripPrepRouteHref("/slt-prep", { travelerId: search.traveler })}
          nextLabel="Back to trip prep"
        />
      </SltPrepShell>
    );
  }

  const totalPaid = workspace.traveler.payments
    .filter((item) => item.status === "paid")
    .map((item) => getAmountValue(item.amountLabel))
    .reduce((sum, value) => sum + value, 0);
  const totalOutstanding = workspace.traveler.payments
    .filter((item) => item.status !== "paid")
    .map((item) => getAmountValue(item.amountLabel))
    .reduce((sum, value) => sum + value, 0);
  const totalTripCost = totalPaid + totalOutstanding;
  const primaryDue = workspace.traveler.payments.find((item) => item.status === "due");
  const processingPayment =
    workspace.traveler.payments.find((item) => item.status === "processing") ?? null;
  const paidPayment = workspace.traveler.payments.find((item) => item.status === "paid") ?? null;
  const openPaymentCount = workspace.traveler.payments.filter((item) => item.status !== "paid").length;
  const action = parsePaymentsAction(search.action);
  const actionState = getPaymentsActionState(action, {
    source: routeSource ?? undefined,
    totalOutstanding,
    travelerId: search.traveler,
  });

  return (
    <SltPrepShell
      actor={actor}
      mobileQuickItemsOverride={getSltTripPrepMobileQuickNavItems({
        source: routeSource ?? undefined,
        travelerId: search.traveler,
      })}
      hideTopHeader
      showMobileQuickItemHelpers={false}
      showDebugTools={false}
    >
      <SltPrepSubnav
        items={getSltTripPrepSubnavItems({
          source: routeSource ?? undefined,
          travelerId: search.traveler,
        })}
      />

      <section className="app-surface-info overflow-hidden rounded-[2rem] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2563eb]">
          Travel payments
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Payment Status
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          1-week Peru SLT. Keep {workspace.traveler.firstName}&apos;s payment plan simple: what is
          already cleared, what is due next, and what still needs finance follow-up before
          departure.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <PaymentsHeroStat label="Trip total" value={formatCurrency(totalTripCost)} />
          <PaymentsHeroStat label="Paid" value={formatCurrency(totalPaid)} />
          <PaymentsHeroStat label="Open" value={`${openPaymentCount}`} />
        </div>
      </section>

      <div className="grid gap-4 rounded-[2rem] bg-[#eef3fb] p-4 shadow-[0_18px_50px_rgba(5,24,60,0.12)]">
        {actionState ? (
          <section
            id="payment-action"
            className="rounded-[1.75rem] border border-[#bfdbfe] bg-[#f8fbff] p-4"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2563eb]">
                  {actionState.eyebrow}
                </p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">{actionState.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{actionState.detail}</p>
              </div>
              <Link
                href={actionState.backHref}
                className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Back to payment status
              </Link>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
          <article className="app-surface-info rounded-[2rem] p-5">
            <p className="app-eyebrow app-eyebrow-blue">Current payment lane</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Paid and still open</h2>
            <div className="mt-4 grid gap-3">
              <MiniFact
                label="Paid"
                value={formatCurrency(totalPaid)}
                note={
                  paidPayment?.summary ??
                  "No payment has cleared yet in this travel plan."
                }
              />
              <MiniFact
                label="Next due"
                value={primaryDue?.title ?? "No current balance due"}
                note={
                  primaryDue?.dueLabel ??
                  "There is no due payment milestone pulling focus right now."
                }
              />
            </div>
          </article>

          <article className="app-surface-warm rounded-[2rem] p-5">
            <p className="app-eyebrow app-eyebrow-warm">Current blocker</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {primaryDue?.title ?? processingPayment?.title ?? "No payment blocker is active right now."}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {primaryDue?.summary ??
                processingPayment?.summary ??
                "Every current payment milestone is already cleared in this plan."}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MiniFact
                label="Due"
                value={primaryDue?.dueLabel ?? processingPayment?.dueLabel ?? "Cleared"}
                note="Finance timing should stay visible before the traveler assumes the plan is complete."
              />
              <MiniFact
                label="Source"
                value={primaryDue?.sourceLabel ?? processingPayment?.sourceLabel ?? "Shopify mock"}
                note="The route can show payment-system context without turning on live order writes."
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={buildSltChecklistDetailHref("second-installment", {
                  source: "payments",
                  travelerId: search.traveler,
                })}
                className="rounded-full bg-[#0b66cc] px-4 py-2 text-sm font-semibold text-white"
              >
                Open payment checklist item
              </Link>
              <Link
                href={buildSltTripPrepRouteHref(
                  "/slt-prep/payments?action=receipts#payment-action",
                  {
                    source: routeSource ?? undefined,
                    travelerId: search.traveler,
                  },
                )}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                View receipts
              </Link>
            </div>
          </article>
        </section>

        {routeSourceContext ? <SltPrepRouteHandoffCard {...routeSourceContext} /> : null}

        <section className="grid gap-3 sm:grid-cols-3">
          <PaymentStatCard
            label="Payment milestones"
            value={`${workspace.traveler.payments.length}`}
            note="Cleared, due, and in-review finance steps for this trip."
          />
          <PaymentStatCard
            label="Outstanding"
            value={formatCurrency(totalOutstanding)}
            note="What still needs a due-date or review outcome before the plan feels settled."
          />
          <PaymentStatCard
            label="In review"
            value={processingPayment ? processingPayment.title : "None"}
            note="Scholarship and reconciliation items stay visible without turning on live edits."
          />
        </section>

        <SltPrepSectionCard eyebrow="Milestones" title="What is cleared, due, or still in review?">
          <div className="grid gap-3">
            {workspace.traveler.payments.map((item) => (
              <article
                key={item.id}
                className="app-surface-soft rounded-[1.35rem] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="app-eyebrow app-eyebrow-slate">{item.status.replace("_", " ")}</p>
                    <h2 className="text-lg font-semibold text-slate-950">{item.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{item.amountLabel}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
                  </div>
                  <SltPrepTonePill
                    tone={
                      item.status === "paid"
                        ? "green"
                        : item.status === "processing"
                          ? "yellow"
                          : "red"
                    }
                    label={item.status === "paid" ? "Paid" : item.status === "processing" ? "Processing" : "Due"}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                    {item.dueLabel}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                    {item.sourceLabel}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </SltPrepSectionCard>

        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="app-surface rounded-[1.75rem] p-5">
            <p className="app-eyebrow app-eyebrow-slate">Payment Options</p>
            <h2 className="mt-2 text-[1.72rem] font-semibold leading-tight text-slate-950">
              Choose a payment option.
            </h2>
            <div className="mt-4 space-y-3">
              <ActionRow
                title="Pay full balance"
                detail={formatCurrency(totalOutstanding)}
                cta="Pay now"
                href={buildSltTripPrepRouteHref(
                  "/slt-prep/payments?action=pay_balance#payment-action",
                  {
                    source: routeSource ?? undefined,
                    travelerId: search.traveler,
                  },
                )}
              />
              <ActionRow
                title="Set up payment plan"
                detail="Split the remaining balance into monthly follow-up."
                cta="Review plan"
                href={buildSltTripPrepRouteHref(
                  "/slt-prep/payments?action=payment_plan#payment-action",
                  {
                    source: routeSource ?? undefined,
                    travelerId: search.traveler,
                  },
                )}
              />
            </div>
          </article>

          <article className="app-surface rounded-[1.75rem] p-5">
            <p className="app-eyebrow app-eyebrow-slate">Payment History</p>
            <h2 className="mt-2 text-[1.72rem] font-semibold leading-tight text-slate-950">
              Payment Information
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              All payments are securely processed through Shopify. This route stays mock-safe for
              now, but it should still show the receipt trail, the due milestone, and any
              scholarship review that affects the traveler&apos;s final balance.
            </p>
            <div className="mt-4 space-y-3">
              <PaymentRow
                title="Receipt trail"
                amount={`${workspace.traveler.payments.length} item${workspace.traveler.payments.length === 1 ? "" : "s"}`}
                detail="Visible as read-only proof of what the traveler has already paid or still owes."
                tone="green"
              />
              <PaymentRow
                title="Scholarship watch"
                amount={processingPayment?.amountLabel ?? "No review open"}
                detail={
                  processingPayment?.dueLabel ??
                  "There is no scholarship or reconciliation review holding this plan."
                }
                tone={processingPayment ? "yellow" : "green"}
              />
            </div>
          </article>
        </section>
      </div>
    </SltPrepShell>
  );
}

function getAmountValue(amountLabel: string) {
  const match = amountLabel.replace(/,/g, "").match(/\$([0-9]+)/);

  if (!match) {
    return 0;
  }

  return Number.parseInt(match[1] ?? "0", 10);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function PaymentRow({
  title,
  amount,
  detail,
  tone,
}: {
  title: string;
  amount: string;
  detail: string;
  tone: "red" | "yellow" | "green";
}) {
  return (
    <div className="rounded-[1rem] border border-slate-200 bg-[#dbeafe] px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <p className="mt-1 text-sm text-slate-500">{detail}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-slate-950">{amount}</p>
          <div className="mt-2">
            <SltPrepTonePill tone={tone} label={tone === "red" ? "Due" : tone === "yellow" ? "Watch" : "Paid"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentStatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="app-surface-soft rounded-[1.35rem] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{note}</p>
    </article>
  );
}

function PaymentsHeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/14 bg-white/10 px-3 py-3 backdrop-blur">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/70">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function MiniFact({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-slate-200 bg-white/75 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{note}</p>
    </div>
  );
}

function ActionRow({
  title,
  detail,
  cta,
  href,
}: {
  title: string;
  detail: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[1rem] border border-slate-200 bg-[#dbeafe] px-3 py-3">
      <div>
        <p className="text-sm font-semibold text-slate-950">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{detail}</p>
      </div>
      <Link
        href={href}
        className="inline-flex rounded-full bg-[#0b66cc] px-4 py-2 text-sm font-semibold text-white"
      >
        {cta}
      </Link>
    </div>
  );
}

type SltPrepPaymentsAction = "pay_balance" | "payment_plan" | "receipts";

function parsePaymentsAction(value?: string): SltPrepPaymentsAction | null {
  switch (value) {
    case "pay_balance":
    case "payment_plan":
    case "receipts":
      return value;
    default:
      return null;
  }
}

function getPaymentsActionState(
  action: SltPrepPaymentsAction | null,
  options: {
    source?: "notifications" | "profile" | "staff";
    totalOutstanding: number;
    travelerId?: string;
  },
) {
  const backHref = buildSltTripPrepRouteHref("/slt-prep/payments", {
    source: options.source,
    travelerId: options.travelerId,
  });

  switch (action) {
    case "pay_balance":
      return {
        eyebrow: "Payment action",
        title: "Balance payment stays visible before it is live.",
        detail: `This route can preview a balance-payment handoff for ${formatCurrency(options.totalOutstanding)}, but it must not create a real Shopify charge or browser write until the live payment lane is approved.`,
        backHref,
      };
    case "payment_plan":
      return {
        eyebrow: "Payment action",
        title: "Payment-plan setup is visible before it is live.",
        detail:
          "Travelers can review the payment-plan posture here, but the app still stops short of creating a plan or changing a hosted billing record.",
        backHref,
      };
    case "receipts":
      return {
        eyebrow: "Receipt history",
        title: "Receipt review stays read-only here.",
        detail:
          "This route can surface what a future receipt trail should look like without exposing downloads, refunds, or live payment-system writes.",
        backHref,
      };
    default:
      return null;
  }
}
