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
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={[
              "shrink-0 snap-start rounded-full border px-3 py-2 text-sm font-medium transition",
              isActive
                ? "border-[#f7d05e]/40 bg-[#f7d05e]/14 text-white"
                : "border-white/10 bg-black/20 text-white/72 hover:border-white/22 hover:text-white",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
