import { describe, expect, it } from "vitest";
import { getThemeSettingDefinition } from "@/services/admin-rollout-controls-registry";

describe("admin rollout controls registry", () => {
  it("keeps translucent surface tokens editable as text values", () => {
    expect(getThemeSettingDefinition("panel")?.inputType).toBe("text");
    expect(getThemeSettingDefinition("panel_strong")?.inputType).toBe("text");
    expect(getThemeSettingDefinition("line")?.inputType).toBe("text");
  });

  it("keeps solid brand tokens on color inputs", () => {
    expect(getThemeSettingDefinition("background")?.inputType).toBe("color");
    expect(getThemeSettingDefinition("foreground")?.inputType).toBe("color");
    expect(getThemeSettingDefinition("accent")?.inputType).toBe("color");
    expect(getThemeSettingDefinition("accent_strong")?.inputType).toBe("color");
  });
});
