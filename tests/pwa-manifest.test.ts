import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("PWA manifest", () => {
  it("keeps the app install-ready for mobile use", () => {
    const pwaManifest = manifest();

    expect(pwaManifest.name).toBe("myMEDLIFE");
    expect(pwaManifest.short_name).toBe("myMEDLIFE");
    expect(pwaManifest.id).toBe("/");
    expect(pwaManifest.start_url).toBe("/");
    expect(pwaManifest.scope).toBe("/");
    expect(pwaManifest.display).toBe("standalone");
    expect(pwaManifest.orientation).toBe("portrait");
    expect(pwaManifest.categories).toEqual(["education", "productivity"]);
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
