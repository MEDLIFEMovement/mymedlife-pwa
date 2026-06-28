import Link from "next/link";
import type { ReactNode } from "react";

type SurfaceTone = "default" | "soft" | "warm" | "info";

type SurfacePanelProps = {
  children: ReactNode;
  tone?: SurfaceTone;
  className?: string;
  as?: "section" | "article" | "div" | "aside";
  id?: string;
};

export function SurfacePanel({
  children,
  tone = "default",
  className,
  as = "section",
  id,
}: SurfacePanelProps) {
  const Tag = as;
  const toneClass =
    tone === "soft"
      ? "app-surface-soft"
      : tone === "warm"
        ? "app-surface-warm"
        : tone === "info"
          ? "app-surface-info"
          : "app-surface";
  const roundedClass = className?.includes("rounded-") ? "" : "rounded-[1.8rem]";
  const defaultPadding = className?.includes("p-") ? "" : "p-4";

  return (
    <Tag id={id} className={`${toneClass} ${roundedClass} ${defaultPadding} ${className ?? ""}`.trim()}>
      {children}
    </Tag>
  );
}

type PillTone = "blue" | "slate" | "yellow" | "gold" | "amber" | "white";

type StatusPillProps = {
  children: ReactNode;
  tone?: PillTone;
  className?: string;
};

export function StatusPill({ children, tone = "blue", className }: StatusPillProps) {
  const toneClass =
    tone === "blue"
      ? "border-[var(--mymedlife-border)] bg-[var(--background)] text-[var(--mymedlife-primary-button)]"
      : tone === "amber"
        ? "border-[var(--mymedlife-border)] bg-[var(--mymedlife-surface-hover)] text-[var(--mymedlife-info)]"
      : tone === "yellow"
        ? "border-[var(--mymedlife-primary-button)]/40 bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]"
      : tone === "gold"
          ? "border-[var(--mymedlife-badge-background)] bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]"
        : tone === "white"
              ? "border-white/16 bg-white/10 text-white/78"
              : "border-[var(--mymedlife-badge-background)] bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]";

  return (
    <span
      className={`inline-flex min-h-7 items-center justify-center rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${toneClass} ${className ?? ""}`.trim()}
    >
      {children}
    </span>
  );
}

type PanelButtonVariant = "primary" | "secondary" | "ghost";

type PanelButtonProps = {
  href: string;
  children: ReactNode;
  variant?: PanelButtonVariant;
  className?: string;
  ariaLabel?: string;
  rel?: string;
  target?: string;
};

export function PanelButton({
  href,
  children,
  variant = "primary",
  className,
  ariaLabel,
  rel,
  target,
}: PanelButtonProps) {
  const base =
    "inline-flex rounded-full px-4 py-2 text-sm font-semibold transition min-h-10 items-center justify-center";
  const variantClass =
    variant === "primary"
      ? "bg-[var(--mymedlife-primary-button)] text-white hover:bg-[var(--mymedlife-info)]"
      : variant === "secondary"
        ? "border border-[var(--mymedlife-border)] bg-white text-[var(--mymedlife-primary-button)] hover:border-[var(--mymedlife-focus-blue)] hover:bg-[var(--mymedlife-surface-hover)]"
        : "border border-slate-200 bg-white text-slate-700";

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      rel={rel}
      target={target}
      className={`${base} ${variantClass} ${className ?? ""}`}
    >
      {children}
    </Link>
  );
}

type StatCardTone = "default" | "soft" | "highlight";

type StatCardProps = {
  label: string;
  value: string | number;
  note?: ReactNode;
  tone?: StatCardTone;
  className?: string;
  children?: ReactNode;
};

export function StatCard({ label, value, note, tone = "default", className, children }: StatCardProps) {
  const toneClass =
    tone === "soft"
      ? "app-surface-soft border border-slate-200 bg-white/95"
      : tone === "highlight"
        ? "rounded-[1.4rem] border border-[var(--mymedlife-primary-button)]/28 bg-[var(--mymedlife-badge-background)]"
        : "rounded-[1.3rem] border border-[var(--mymedlife-border)] bg-[var(--mymedlife-surface-tint)]";

  return (
    <article className={`${toneClass} ${className ?? "p-3.5"}`}>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold leading-none text-slate-950">{value}</p>
      {note ? <p className="mt-1 text-xs leading-5 text-slate-600">{note}</p> : null}
      {children ? <div className="mt-2.5">{children}</div> : null}
    </article>
  );
}

type TabStripItem = {
  href: string;
  label: string;
  active?: boolean;
  icon?: ReactNode;
};

type VisualTabStripProps = {
  label: string;
  items: TabStripItem[];
  className?: string;
  iconClassName?: string;
};

export function VisualTabStrip({
  label,
  items,
  className,
  iconClassName,
}: VisualTabStripProps) {
  return (
    <nav
      aria-label={label}
      className={`grid gap-2 ${items.length >= 4 ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2"} ${className ?? ""}`.trim()}
    >
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={
            item.active
              ? "inline-flex min-h-11 items-center rounded-[1.35rem] border-[var(--mymedlife-border)] bg-[var(--mymedlife-surface-tint)] px-4 py-2.5 text-sm font-semibold text-[var(--mymedlife-primary-button)]"
              : "inline-flex min-h-11 items-center rounded-[1.35rem] border border-slate-200 bg-[var(--mymedlife-badge-background)] px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[var(--mymedlife-border)] hover:bg-[var(--mymedlife-surface-tint)]"
          }
        >
          {item.icon ? (
            <span className={`${iconClassName ?? "mr-2 text-[0.8rem]"} shrink-0`}>
              {item.icon}
            </span>
          ) : null}
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function SurfaceTable({
  caption,
  className,
  wrapperClassName,
  children,
}: {
  caption?: string;
  className?: string;
  wrapperClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={`overflow-x-auto ${wrapperClassName ?? ""}`}>
      <table
        aria-label={caption}
        className={`min-w-[1024px] w-full border-separate border-spacing-0 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white ${className ?? ""}`.trim()}
      >
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {children}
      </table>
    </div>
  );
}

export function SurfaceTh({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <th className={`border-b border-slate-200 bg-[var(--mymedlife-badge-background)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 ${className ?? ""}`.trim()}>
      {children}
    </th>
  );
}

export function SurfaceTd({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <td className={`border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-700 ${className ?? ""}`.trim()}>
      {children}
    </td>
  );
}

export function SurfaceTableRow({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <tr className={className}>
      {children}
    </tr>
  );
}
