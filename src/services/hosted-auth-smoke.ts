export type HostedAuthSmokeMode = "preauth" | "staging_auth";

export type HostedAuthSmokeCheck = {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type HostedAuthSmokeEvaluation = {
  mode: HostedAuthSmokeMode;
  targetUrl: string;
  checks: HostedAuthSmokeCheck[];
};

type PageSnapshot = {
  html: string;
  status: number;
  url: string;
};

const sharedHomeNeedles = [
  "Chapter operating system",
  "Pilot-safe",
  "Mock-seeded review data",
] as const;

const sharedSafetyNeedles = [
  "Production auth remains disabled.",
  "Browser writes remain disabled.",
] as const;

const preauthLoginNeedles = [
  "Local sign-in is the bridge from review mode to real MVP behavior.",
  "Use a fake local Supabase account from the seed data.",
  "Supabase Auth is disabled because MYMEDLIFE_AUTH_MODE is not set to local_supabase",
] as const;

const stagingLoginNeedles = [
  "Staging sign-in is the review gate before the first hosted write.",
  "This page proves Supabase Auth on staging.mymedlife.org only",
  "Hosted auth is allowed only on staging.mymedlife.org.",
  "Use an approved staging account on staging.mymedlife.org only.",
] as const;

const preauthForbiddenNeedles = [
  "Staging sign-in is the review gate before the first hosted write.",
  "Hosted auth is allowed only on staging.mymedlife.org.",
] as const;

const stagingForbiddenNeedles = [
  "Local sign-in is the bridge from review mode to real MVP behavior.",
  "Use a fake local Supabase account from the seed data.",
] as const;

export function evaluateHostedHomeSmoke(
  snapshot: PageSnapshot,
): HostedAuthSmokeEvaluation {
  const checks: HostedAuthSmokeCheck[] = [
    statusCheck(snapshot.status, "home_http_ok", "Home route returns HTTP 200"),
    ...sharedHomeNeedles.map((needle) =>
      includesCheck(
        snapshot.html,
        needle,
        toCheckKey("home_contains", needle),
        `Home page contains "${needle}"`,
      ),
    ),
  ];

  return {
    mode: "preauth",
    targetUrl: snapshot.url,
    checks,
  };
}

export function evaluateHostedLoginSmoke(
  snapshot: PageSnapshot,
  mode: HostedAuthSmokeMode,
): HostedAuthSmokeEvaluation {
  const modeNeedles =
    mode === "staging_auth" ? stagingLoginNeedles : preauthLoginNeedles;
  const forbiddenNeedles =
    mode === "staging_auth" ? stagingForbiddenNeedles : preauthForbiddenNeedles;
  const modeLabel =
    mode === "staging_auth" ? "Hosted staging auth" : "Hosted pre-auth safety";

  const checks: HostedAuthSmokeCheck[] = [
    statusCheck(snapshot.status, "login_http_ok", "Login route returns HTTP 200"),
    ...modeNeedles.map((needle) =>
      includesCheck(
        snapshot.html,
        needle,
        toCheckKey("login_contains", needle),
        `${modeLabel} contains "${needle}"`,
      ),
    ),
    ...sharedSafetyNeedles.map((needle) =>
      includesCheck(
        snapshot.html,
        needle,
        toCheckKey("login_safety", needle),
        `Login route keeps "${needle}" visible`,
      ),
    ),
    ...forbiddenNeedles.map((needle) =>
      excludesCheck(
        snapshot.html,
        needle,
        toCheckKey("login_excludes", needle),
        `${modeLabel} excludes "${needle}"`,
      ),
    ),
  ];

  return {
    mode,
    targetUrl: snapshot.url,
    checks,
  };
}

export function summarizeHostedAuthSmoke(
  evaluation: HostedAuthSmokeEvaluation,
): string[] {
  const passedCount = evaluation.checks.filter((check) => check.passed).length;
  const lines = [
    `${evaluation.mode} ${evaluation.targetUrl}`,
    `${passedCount}/${evaluation.checks.length} checks passed`,
  ];

  return lines.concat(
    evaluation.checks.map(
      (check) => `${check.passed ? "PASS" : "FAIL"} ${check.label}: ${check.detail}`,
    ),
  );
}

export function hasHostedAuthSmokeFailures(
  evaluation: HostedAuthSmokeEvaluation,
): boolean {
  return evaluation.checks.some((check) => !check.passed);
}

function statusCheck(
  status: number,
  key: string,
  label: string,
): HostedAuthSmokeCheck {
  return {
    key,
    label,
    passed: status === 200,
    detail: `received HTTP ${status}`,
  };
}

function includesCheck(
  html: string,
  needle: string,
  key: string,
  label: string,
): HostedAuthSmokeCheck {
  const passed = html.includes(needle);

  return {
    key,
    label,
    passed,
    detail: passed ? "expected text found" : "expected text missing",
  };
}

function excludesCheck(
  html: string,
  needle: string,
  key: string,
  label: string,
): HostedAuthSmokeCheck {
  const passed = !html.includes(needle);

  return {
    key,
    label,
    passed,
    detail: passed ? "unexpected text absent" : "unexpected text present",
  };
}

function toCheckKey(prefix: string, value: string): string {
  return `${prefix}_${value.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
}
