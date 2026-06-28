import type { ThemeTokenKey, ThemeTokenValue } from "./types";

export const themeTokenOrder = [
  "background",
  "pageBackground",
  "cardBlock",
  "primaryButton",
  "secondaryButton",
  "accent",
  "font",
  "mutedFont",
  "border",
  "success",
  "warning",
  "error",
  "info",
  "navBackground",
  "navText",
  "badgeBackground",
  "badgeText",
  "progressTrack",
  "progressFill",
] as const satisfies readonly ThemeTokenKey[];

export const defaultMedlifeThemeTokens: Record<ThemeTokenKey, ThemeTokenValue> = {
  background: token("background", "Background", "#f8fbff", "--background"),
  pageBackground: token("pageBackground", "Page background", "#ffffff", "--mymedlife-page-background"),
  cardBlock: token("cardBlock", "Card / block", "#ffffff", "--mymedlife-card-block"),
  primaryButton: token("primaryButton", "Primary button", "#2563eb", "--mymedlife-primary-button"),
  secondaryButton: token("secondaryButton", "Secondary button", "#facc15", "--mymedlife-secondary-button"),
  accent: token("accent", "Accent", "#5d8ff6", "--accent"),
  font: token("font", "Font", "#10223f", "--foreground"),
  mutedFont: token("mutedFont", "Muted font", "#475569", "--muted"),
  border: token("border", "Border", "#bfdbfe", "--mymedlife-border"),
  success: token("success", "Success", "#16a34a", "--mymedlife-success"),
  warning: token("warning", "Warning", "#ca8a04", "--warning"),
  error: token("error", "Error", "#dc2626", "--danger"),
  info: token("info", "Info", "#1d4ed8", "--mymedlife-info"),
  navBackground: token("navBackground", "Nav background", "#0b3b82", "--mymedlife-nav-background"),
  navText: token("navText", "Nav text", "#ffffff", "--mymedlife-nav-text"),
  badgeBackground: token("badgeBackground", "Badge background", "#dbeafe", "--mymedlife-badge-background"),
  badgeText: token("badgeText", "Badge text", "#1d4ed8", "--mymedlife-badge-text"),
  progressTrack: token("progressTrack", "Progress track", "#dbeafe", "--mymedlife-progress-track"),
  progressFill: token("progressFill", "Progress fill", "#2563eb", "--mymedlife-progress-fill"),
};

export const contrastPairs = [
  ["font", "background", "Body text on background"],
  ["font", "cardBlock", "Body text on cards"],
  ["navText", "navBackground", "Nav text"],
  ["badgeText", "badgeBackground", "Badge text"],
] as const satisfies readonly [ThemeTokenKey, ThemeTokenKey, string][];

function token(
  key: ThemeTokenKey,
  label: string,
  hex: string,
  cssVariable: string,
): ThemeTokenValue {
  return {
    key,
    label,
    hex,
    cssVariable,
    pantoneLabel: null,
    pantoneCode: null,
  };
}
