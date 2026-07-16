import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  applyChromeDesktopPaintNudge,
  ChromeDesktopPaintShell,
  getChromeDesktopPaintSnapshot,
  restoreChromeDesktopPaintNudge,
  runChromeDesktopPaintNudge,
} from "@/components/chrome-desktop-paint-shell";

function buildPaintNode(width: number, style: Partial<CSSStyleDeclaration> = {}) {
  return {
    getBoundingClientRect: () => ({
      bottom: 0,
      height: 0,
      left: 0,
      right: width,
      top: 0,
      width,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
    offsetWidth: width,
    style: {
      opacity: style.opacity ?? "",
      transform: style.transform ?? "",
      willChange: style.willChange ?? "",
      width: style.width ?? "",
    },
  };
}

function buildPaintRuntime(width: number) {
  const frames: FrameRequestCallback[] = [];
  const canceled: number[] = [];
  const events: string[] = [];

  return {
    runtime: {
      innerWidth: width,
      requestAnimationFrame: (callback: FrameRequestCallback) => {
        frames.push(callback);
        return frames.length;
      },
      cancelAnimationFrame: (id: number) => {
        canceled.push(id);
      },
      dispatchEvent: (event: Event) => {
        events.push(event.type);
        return true;
      },
    },
    canceled,
    events,
    flushFrame: () => {
      const callback = frames.shift();
      callback?.(performance.now());
    },
  };
}

describe("ChromeDesktopPaintShell", () => {
  it("renders a transparent wrapper around children", () => {
    const html = renderToStaticMarkup(
      <ChromeDesktopPaintShell className="desktop-shell">
        <span>Member content</span>
      </ChromeDesktopPaintShell>,
    );

    expect(html).toContain('class="desktop-shell"');
    expect(html).toContain("<span>Member content</span>");
  });

  it("nudges and restores desktop paint styles while preserving existing values", () => {
    const node = buildPaintNode(320, {
      opacity: "1",
      transform: "scale(0.98)",
      willChange: "auto",
      width: "320px",
    });
    const snapshot = getChromeDesktopPaintSnapshot(node);

    applyChromeDesktopPaintNudge(node, snapshot);

    expect(node.style.opacity).toBe("0.999");
    expect(node.style.transform).toBe("scale(0.98) translateZ(0)");
    expect(node.style.willChange).toBe("opacity, transform, width");
    expect(node.style.width).toBe("319px");

    restoreChromeDesktopPaintNudge(node, snapshot);

    expect(node.style.opacity).toBe("1");
    expect(node.style.transform).toBe("scale(0.98)");
    expect(node.style.willChange).toBe("auto");
    expect(node.style.width).toBe("320px");
  });

  it("keeps width stable when the measured shell has no width yet", () => {
    const node = buildPaintNode(0, {
      width: "min(100%, 420px)",
    });
    const snapshot = getChromeDesktopPaintSnapshot(node);

    applyChromeDesktopPaintNudge(node, snapshot);

    expect(node.style.transform).toBe("translateZ(0)");
    expect(node.style.width).toBe("min(100%, 420px)");
  });

  it("runs the desktop repaint nudge and restores styles after two animation frames", () => {
    const node = buildPaintNode(240, {
      opacity: "1",
      transform: "scale(1)",
      willChange: "auto",
      width: "240px",
    });
    const { events, flushFrame, runtime } = buildPaintRuntime(1024);

    const cleanup = runChromeDesktopPaintNudge(node, runtime);

    expect(cleanup).toEqual(expect.any(Function));
    expect(node.style.opacity).toBe("0.999");
    expect(node.style.width).toBe("239px");

    flushFrame();
    expect(node.style.opacity).toBe("0.999");

    flushFrame();
    expect(node.style.opacity).toBe("1");
    expect(node.style.transform).toBe("scale(1)");
    expect(node.style.willChange).toBe("auto");
    expect(node.style.width).toBe("240px");
    expect(events).toEqual(["resize"]);
  });

  it("returns a cleanup that cancels scheduled frames and restores immediately", () => {
    const node = buildPaintNode(240, {
      opacity: "1",
      width: "240px",
    });
    const { canceled, runtime } = buildPaintRuntime(1024);

    const cleanup = runChromeDesktopPaintNudge(node, runtime);
    cleanup?.();

    expect(canceled).toEqual([1, 0]);
    expect(node.style.opacity).toBe("1");
    expect(node.style.width).toBe("240px");
  });

  it("skips the repaint nudge on mobile widths", () => {
    const node = buildPaintNode(240, {
      opacity: "1",
      width: "240px",
    });
    const { runtime } = buildPaintRuntime(390);

    const cleanup = runChromeDesktopPaintNudge(node, runtime);

    expect(cleanup).toBeUndefined();
    expect(node.style.opacity).toBe("1");
    expect(node.style.width).toBe("240px");
  });
});
