/* global console, fetch, process */

const usage = [
  "Usage:",
  "  pnpm production:release [base-url] [expected-commit-sha]",
  "",
  "This is read-only. It verifies that the deployed myMEDLIFE release endpoint",
  "reports the exact approved 40-character Git commit SHA.",
].join("\n");

const [baseUrlInput = "https://mymedlife.org", expectedShaInput] =
  process.argv.slice(2);

if (baseUrlInput === "--help" || baseUrlInput === "-h") {
  console.log(usage);
  process.exit(0);
}

try {
  const baseUrl = normalizeUrl(baseUrlInput);
  const expectedSha = normalizeSha(
    expectedShaInput ?? process.env.EXPECTED_RELEASE_SHA,
  );
  if (!expectedSha) {
    throw new Error("An exact 40-character expected commit SHA is required.");
  }

  const response = await fetch(`${baseUrl}/api/release`, {
    cache: "no-store",
    redirect: "error",
  });
  const payload = await readPayload(response);
  const releaseSha = normalizeSha(payload.releaseSha);
  const headerSha = normalizeSha(response.headers.get("x-mymedlife-release"));
  const checks = [
    {
      label: "Release endpoint returns HTTP 200",
      passed: response.status === 200,
      detail: `received HTTP ${response.status}`,
    },
    {
      label: "Release endpoint identifies myMEDLIFE",
      passed: payload.service === "mymedlife-pwa",
      detail: `received service ${String(payload.service ?? "missing")}`,
    },
    {
      label: "Release payload contains a valid commit SHA",
      passed: releaseSha !== null,
      detail: `received ${releaseSha ?? "invalid or missing SHA"}`,
    },
    {
      label: "Release header matches the payload",
      passed: headerSha !== null && headerSha === releaseSha,
      detail: `payload ${releaseSha ?? "missing"}; header ${headerSha ?? "missing"}`,
    },
    {
      label: "Deployed commit matches the approved commit",
      passed: releaseSha === expectedSha,
      detail: `expected ${expectedSha}; received ${releaseSha ?? "missing"}`,
    },
  ];
  const ready = checks.every((check) => check.passed);

  console.log(`Production release provenance: ${ready ? "READY" : "NOT READY"}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Expected commit: ${expectedSha}`);
  console.log("");
  for (const check of checks) {
    console.log(`${check.passed ? "PASS" : "FAIL"} ${check.label}: ${check.detail}`);
  }
  process.exit(ready ? 0 : 1);
} catch (error) {
  console.error("Production release provenance: NOT READY");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(usage);
  process.exit(1);
}

async function readPayload(response) {
  try {
    const value = await response.json();
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  } catch {
    return {};
  }
}

function normalizeUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new Error("The release URL must use HTTPS.");
  }
  return url.origin;
}

function normalizeSha(value) {
  const normalized = typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
  return /^[0-9a-f]{40}$/.test(normalized) ? normalized : null;
}
