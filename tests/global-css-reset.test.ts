import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("global CSS reset", () => {
  it("keeps link and button resets in Tailwind base so utility colors stay visible", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

    expect(css).toContain("@layer base");
    expect(css).toMatch(/@layer base\s*{[\s\S]*a\s*{[\s\S]*color:\s*inherit;/);
    expect(css).toMatch(/@layer base\s*{[\s\S]*button\s*{[\s\S]*font:\s*inherit;/);
    expect(css).not.toMatch(/\n(?:a|button)\s*{\n\s*(?:color:\s*inherit|font:\s*inherit)/);
  });
});
