"use client";

import { useEffect, useRef, type ReactNode } from "react";

type ChromeDesktopPaintShellProps = {
  children: ReactNode;
  className?: string;
  repaintKey?: string;
};

type ChromeDesktopPaintNode = Pick<HTMLDivElement, "getBoundingClientRect" | "offsetWidth"> & {
  style: Pick<CSSStyleDeclaration, "opacity" | "transform" | "willChange" | "width">;
};

type ChromeDesktopPaintRuntime = Pick<
  Window,
  "cancelAnimationFrame" | "dispatchEvent" | "innerWidth" | "requestAnimationFrame"
>;

export type ChromeDesktopPaintSnapshot = {
  previousOpacity: string;
  previousTransform: string;
  previousWillChange: string;
  previousWidth: string;
  nudgedWidth: number;
};

export function getChromeDesktopPaintSnapshot(
  node: ChromeDesktopPaintNode,
): ChromeDesktopPaintSnapshot {
  const measuredWidth = node.getBoundingClientRect().width;

  return {
    previousOpacity: node.style.opacity,
    previousTransform: node.style.transform,
    previousWillChange: node.style.willChange,
    previousWidth: node.style.width,
    nudgedWidth: Math.max(measuredWidth - 1, 0),
  };
}

export function applyChromeDesktopPaintNudge(
  node: ChromeDesktopPaintNode,
  snapshot: ChromeDesktopPaintSnapshot,
) {
  node.style.opacity = "0.999";
  node.style.transform = snapshot.previousTransform
    ? `${snapshot.previousTransform} translateZ(0)`
    : "translateZ(0)";
  node.style.willChange = "opacity, transform, width";
  node.style.width =
    snapshot.nudgedWidth > 0 ? `${snapshot.nudgedWidth}px` : snapshot.previousWidth;
}

export function restoreChromeDesktopPaintNudge(
  node: ChromeDesktopPaintNode,
  snapshot: ChromeDesktopPaintSnapshot,
) {
  node.style.opacity = snapshot.previousOpacity;
  node.style.transform = snapshot.previousTransform;
  node.style.willChange = snapshot.previousWillChange;
  node.style.width = snapshot.previousWidth;
}

export function runChromeDesktopPaintNudge(
  node: ChromeDesktopPaintNode | null,
  browserWindow: ChromeDesktopPaintRuntime = window,
) {
  if (browserWindow.innerWidth < 768 || !node) {
    return undefined;
  }

  const snapshot = getChromeDesktopPaintSnapshot(node);
  applyChromeDesktopPaintNudge(node, snapshot);

  let rafOne = 0;
  let rafTwo = 0;

  rafOne = browserWindow.requestAnimationFrame(() => {
    void node.offsetWidth;

    rafTwo = browserWindow.requestAnimationFrame(() => {
      restoreChromeDesktopPaintNudge(node, snapshot);
      browserWindow.dispatchEvent(new Event("resize"));
    });
  });

  return () => {
    browserWindow.cancelAnimationFrame(rafOne);
    browserWindow.cancelAnimationFrame(rafTwo);
    restoreChromeDesktopPaintNudge(node, snapshot);
  };
}

export function ChromeDesktopPaintShell({
  children,
  className,
  repaintKey,
}: ChromeDesktopPaintShellProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return runChromeDesktopPaintNudge(shellRef.current, window);
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
