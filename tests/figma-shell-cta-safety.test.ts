import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const figmaShellFiles = [
  "src/components/figma-member-mobile-home.tsx",
  "src/components/figma-leader-command-center.tsx",
  "src/components/figma-leader-create-event-screen.tsx",
  "src/components/figma-leader-stories-screen.tsx",
  "src/components/figma-staff-command-center.tsx",
  "src/components/figma-admin-panel.tsx",
];

function readProjectFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function findUnsafeButtonOpenings(source: string) {
  const lines = source.split("\n");
  const unsafe: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index]?.includes("<button")) continue;

    let chunk = lines[index] ?? "";
    let cursor = index;

    while (!chunk.includes(">") && cursor + 1 < lines.length && cursor < index + 8) {
      cursor += 1;
      chunk += `\n${lines[cursor] ?? ""}`;
    }

    if (!/onClick=|disabled|type="submit"|aria-disabled/.test(chunk)) {
      unsafe.push(`${index + 1}: ${chunk.trim().replace(/\s+/g, " ").slice(0, 180)}`);
    }
  }

  return unsafe;
}

describe("copied Figma shell CTA safety", () => {
  it("does not keep fake href placeholders or empty click handlers", () => {
    for (const file of figmaShellFiles) {
      const source = readProjectFile(file);

      expect(source, file).not.toContain('href="#"');
      expect(source, file).not.toContain("onClick={() => {}}");
      expect(source, file).not.toContain("onClick={e=>e.preventDefault()}");
      expect(source, file).not.toContain("onClick={(e) => e.preventDefault()}");
      expect(source, file).not.toMatch(/javascript:void/i);
    }
  });

  it("does not leave raw button openings without a handler or disabled state", () => {
    for (const file of figmaShellFiles) {
      expect(findUnsafeButtonOpenings(readProjectFile(file)), file).toEqual([]);
    }
  });

  it("documents fail-closed helpers for copied member and leader shell buttons", () => {
    expect(readProjectFile("src/components/figma-member-mobile-home.tsx")).toContain(
      "disabled={!onClick}",
    );
    expect(readProjectFile("src/components/figma-leader-command-center.tsx")).toContain(
      "disabled={isBlocked}",
    );
  });

  it("keeps copied admin and staff integration copy mock-safe", () => {
    const adminSource = readProjectFile("src/components/figma-admin-panel.tsx");
    const staffSource = readProjectFile("src/components/figma-staff-command-center.tsx");

    expect(adminSource).not.toMatch(/environment:\s*"production"/);
    expect(adminSource).not.toMatch(/secret-ref:[^"]*:production:/);
    expect(adminSource).not.toContain("Production · API v2.1");
    expect(adminSource).not.toContain("Luma Provider: Connected");
    expect(adminSource).not.toContain("Core data pipeline — always on");
    expect(adminSource).toContain("Staging/mock-safe");
    expect(adminSource).toContain("Live Writes Off");

    expect(staffSource).not.toContain("real-time HubSpot sync");
    expect(staffSource).not.toContain("Triggered automation");
    expect(staffSource).not.toContain("Shared post to 28 chapters");
    expect(staffSource).toContain("No live Luma writes from this shell");
    expect(staffSource).toContain("Workflow execution disabled");
  });

  it("keeps the copied admin account row visibly delegated to the top-right session menu", () => {
    const adminSource = readProjectFile("src/components/figma-admin-panel.tsx");

    expect(adminSource).toContain("Use the top-right menu to switch workspaces or log out.");
    expect(adminSource).toContain("Account menu");
  });
});
