export type SltChecklistDetailSource =
  | "overview"
  | "checklist"
  | "forms"
  | "payments"
  | "flights"
  | "meetings"
  | "extensions"
  | "notifications"
  | "profile"
  | "staff";

export function buildSltChecklistDetailHref(
  itemId: string,
  options: {
    source?: SltChecklistDetailSource;
    travelerId?: string;
  } = {},
) {
  const searchParams = new URLSearchParams();

  if (options.source) {
    searchParams.set("source", options.source);
  }

  if (options.travelerId) {
    searchParams.set("traveler", options.travelerId);
  }

  const query = searchParams.toString();

  return query.length > 0
    ? `/slt-prep/checklist/${itemId}?${query}`
    : `/slt-prep/checklist/${itemId}`;
}

export function mapChecklistDetailHref(
  href: string,
  options: {
    source?: SltChecklistDetailSource;
    travelerId?: string;
  } = {},
) {
  const match = href.match(/^\/slt-prep\/checklist\/([^/?#]+)/);

  if (!match) {
    return href;
  }

  return buildSltChecklistDetailHref(match[1], options);
}
