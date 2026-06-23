export function normalizeLocalRoleSwitcherReturnTo(
  value: FormDataEntryValue | null | undefined,
) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\n") ||
    trimmed.includes("\r")
  ) {
    return null;
  }

  return trimmed;
}
