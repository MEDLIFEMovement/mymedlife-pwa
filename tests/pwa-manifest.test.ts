import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("PWA manifest", () => {
  it("keeps the app install-ready without adding offline behavior", () => {
    const pwaManifest = manifest();

    expect(pwaManifest.name).toBe("myMEDLIFE");
    expect(pwaManifest.short_name).toBe("myMEDLIFE");
    expect(pwaManifest.start_url).toBe("/");
    expect(pwaManifest.scope).toBe("/");
    expect(pwaManifest.display).toBe("standalone");
    expect(pwaManifest.icons).toEqual([
      {
        src: "/icons/my-medlife-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ]);
  });
});
