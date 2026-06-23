"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type SltPrepSubnavItem = {
  href: string;
  label: string;
};

export function SltPrepSubnav({ items }: { items: SltPrepSubnavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="SLT trip prep sections"
      className="flex snap-x gap-2 overflow-x-auto pb-1"
    >
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/slt-prep" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={[
              "shrink-0 snap-start rounded-full border px-3 py-2 text-sm font-medium transition",
              isActive
                ? "border-[#bfdbfe] bg-[#dbeafe] text-[#1d4ed8] shadow-[0_12px_24px_rgba(59,115,231,0.12)]"
                : "border-slate-200 bg-white text-slate-600 hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
