"use client";

import { useEffect, useRef, type ReactNode } from "react";

type ChromeDesktopPaintShellProps = {
  children: ReactNode;
  className?: string;
  repaintKey?: string;
};

export function ChromeDesktopPaintShell({
  children,
  className,
  repaintKey,
}: ChromeDesktopPaintShellProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.innerWidth < 768) {
      return;
    }

    const node = shellRef.current;
    if (!node) {
      return;
    }

    const previousOpacity = node.style.opacity;
    const previousTransform = node.style.transform;
    const previousWillChange = node.style.willChange;
    const previousWidth = node.style.width;
    const measuredWidth = node.getBoundingClientRect().width;
    const nudgedWidth = Math.max(measuredWidth - 1, 0);

    node.style.opacity = "0.999";
    node.style.transform = previousTransform
      ? `${previousTransform} translateZ(0)`
      : "translateZ(0)";
    node.style.willChange = "opacity, transform, width";
    node.style.width = nudgedWidth > 0 ? `${nudgedWidth}px` : previousWidth;

    let rafOne = 0;
    let rafTwo = 0;

    rafOne = window.requestAnimationFrame(() => {
      void node.offsetWidth;

      rafTwo = window.requestAnimationFrame(() => {
        node.style.opacity = previousOpacity;
        node.style.transform = previousTransform;
        node.style.willChange = previousWillChange;
        node.style.width = previousWidth;
        window.dispatchEvent(new Event("resize"));
      });
    });

    return () => {
      window.cancelAnimationFrame(rafOne);
      window.cancelAnimationFrame(rafTwo);
      node.style.opacity = previousOpacity;
      node.style.transform = previousTransform;
      node.style.willChange = previousWillChange;
      node.style.width = previousWidth;
    };
  }, [repaintKey]);

  return (
    <div
      ref={shellRef}
      className={className}
    >
      {children}
    </div>
  );
}
