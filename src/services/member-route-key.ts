const memberRouteKeyParamNames = [
  "source",
  "event",
  "campaign",
  "storyFilter",
  "story",
] as const;

type MemberRouteKeyParamName = (typeof memberRouteKeyParamNames)[number];

export type MemberRouteKeyParams = Partial<
  Record<MemberRouteKeyParamName, string | null | undefined>
>;

export function buildMemberRouteKey(pathname: string, params: MemberRouteKeyParams) {
  const searchParams = new URLSearchParams();

  for (const key of memberRouteKeyParamNames) {
    const value = params[key];

    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}
