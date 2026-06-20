const [baseUrl, mode = "preauth"] = process.argv.slice(2);

if (!baseUrl || !["preauth", "staging_auth"].includes(mode)) {
  console.error(
    "Usage: node scripts/hosted-auth-smoke.mjs <base-url> <preauth|staging_auth>",
  );
  process.exit(1);
}

const normalizedBaseUrl = baseUrl.endsWith("/")
  ? baseUrl.slice(0, -1)
  : baseUrl;

const [homeResponse, loginResponse] = await Promise.all([
  fetch(normalizedBaseUrl),
  fetch(`${normalizedBaseUrl}/login`),
]);

const [homeHtml, loginHtml] = await Promise.all([
  homeResponse.text(),
  loginResponse.text(),
]);

const homeEvaluation = evaluateHostedHomeSmoke({
  html: homeHtml,
  status: homeResponse.status,
  url: normalizedBaseUrl,
});

const loginEvaluation = evaluateHostedLoginSmoke(
  {
    html: loginHtml,
    status: loginResponse.status,
    url: `${normalizedBaseUrl}/login`,
  },
  mode,
);

for (const line of summarizeHostedAuthSmoke(homeEvaluation)) {
  console.log(line);
}

for (const line of summarizeHostedAuthSmoke(loginEvaluation)) {
  console.log(line);
}

if (
  hasHostedAuthSmokeFailures(homeEvaluation) ||
  hasHostedAuthSmokeFailures(loginEvaluation)
) {
  process.exit(1);
}

function evaluateHostedHomeSmoke(snapshot) {
  const checks = [
    statusCheck(snapshot.status, "home_http_ok", "Home route returns HTTP 200"),
    includesCheck(
      snapshot.html,
      "Chapter operating system",
      "home_contains_chapter_operating_system",
      'Home page contains "Chapter operating system"',
    ),
    includesCheck(
      snapshot.html,
      "Pilot-safe",
      "home_contains_pilot_safe",
      'Home page contains "Pilot-safe"',
    ),
    includesCheck(
      snapshot.html,
      "Mock-seeded review data",
      "home_contains_mock_seeded_review_data",
      'Home page contains "Mock-seeded review data"',
    ),
  ];

  return {
    mode: "preauth",
    targetUrl: snapshot.url,
    checks,
  };
}

function evaluateHostedLoginSmoke(snapshot, mode) {
  const modeNeedles =
    mode === "staging_auth"
      ? [
          "Staging sign-in is the review gate before the first hosted write.",
          "This page proves Supabase Auth on staging.mymedlife.org only",
          "Hosted auth is allowed only on staging.mymedlife.org.",
          "Use an approved staging account on staging.mymedlife.org only.",
        ]
      : [
          "Local sign-in is the bridge from review mode to real MVP behavior.",
          "Use a fake local Supabase account from the seed data.",
          "Supabase Auth is disabled because MYMEDLIFE_AUTH_MODE is not set to local_supabase",
        ];

  const forbiddenNeedles =
    mode === "staging_auth"
      ? [
          "Local sign-in is the bridge from review mode to real MVP behavior.",
          "Use a fake local Supabase account from the seed data.",
        ]
      : [
          "Staging sign-in is the review gate before the first hosted write.",
          "Hosted auth is allowed only on staging.mymedlife.org.",
        ];

  const modeLabel =
    mode === "staging_auth" ? "Hosted staging auth" : "Hosted pre-auth safety";

  const checks = [
    statusCheck(snapshot.status, "login_http_ok", "Login route returns HTTP 200"),
    ...modeNeedles.map((needle) =>
      includesCheck(
        snapshot.html,
        needle,
        `login_contains_${slugify(needle)}`,
        `${modeLabel} contains "${needle}"`,
      ),
    ),
    includesCheck(
      snapshot.html,
      "Production auth remains disabled.",
      "login_safety_production_auth_remains_disabled",
      'Login route keeps "Production auth remains disabled." visible',
    ),
    includesCheck(
      snapshot.html,
      "Browser writes remain disabled.",
      "login_safety_browser_writes_remain_disabled",
      'Login route keeps "Browser writes remain disabled." visible',
    ),
    ...forbiddenNeedles.map((needle) =>
      excludesCheck(
        snapshot.html,
        needle,
        `login_excludes_${slugify(needle)}`,
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

function summarizeHostedAuthSmoke(evaluation) {
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

function hasHostedAuthSmokeFailures(evaluation) {
  return evaluation.checks.some((check) => !check.passed);
}

function statusCheck(status, key, label) {
  return {
    key,
    label,
    passed: status === 200,
    detail: `received HTTP ${status}`,
  };
}

function includesCheck(html, needle, key, label) {
  const passed = html.includes(needle);

  return {
    key,
    label,
    passed,
    detail: passed ? "expected text found" : "expected text missing",
  };
}

function excludesCheck(html, needle, key, label) {
  const passed = !html.includes(needle);

  return {
    key,
    label,
    passed,
    detail: passed ? "unexpected text absent" : "unexpected text present",
  };
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}
