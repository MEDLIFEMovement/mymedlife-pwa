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

  it("documents fail-closed helpers for copied member and leader shell buttons", () => {
    expect(readProjectFile("src/components/figma-member-mobile-home.tsx")).toContain(
      "disabled={!onClick}",
    );
    expect(readProjectFile("src/components/figma-leader-command-center.tsx")).toContain(
      "disabled={isBlocked}",
    );
  });
});
