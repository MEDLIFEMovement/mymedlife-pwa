export type AuthRecoveryFragmentSession = {
  accessToken: string;
  refreshToken: string;
};

export function parseAuthRecoveryFragment(
  hash: string,
): AuthRecoveryFragmentSession | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (
    params.get("type") !== "recovery" ||
    !accessToken ||
    !refreshToken
  ) {
    return null;
  }

  return { accessToken, refreshToken };
}
