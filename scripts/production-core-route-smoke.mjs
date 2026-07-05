/* global console, process, fetch */

const usage = [
  "Usage:",
  "  pnpm production:smoke <base-url>",
  "",
  "Example:",
  "  pnpm production:smoke https://mymedlife-pwa.vercel.app",
].join("\n");

const [baseUrl] = process.argv.slice(2);

if (!baseUrl || baseUrl === "--help" || baseUrl === "-h") {
  console.error(usage);
  process.exit(baseUrl ? 0 : 1);
}

try {
  const {
    formatProductionCoreRouteSmokeResult,
    getProductionCoreRouteSmokeResult,
  } = await import("../src/services/production-core-route-smoke.ts");
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const snapshots = await Promise.all([
    getRouteSnapshot(normalizedBaseUrl, "/login", true),
    getRouteSnapshot(normalizedBaseUrl, "/app", false),
    getRouteSnapshot(normalizedBaseUrl, "/leader", false),
    getRouteSnapshot(normalizedBaseUrl, "/staff", false),
    getRouteSnapshot(normalizedBaseUrl, "/admin", false),
  ]);
  const result = getProductionCoreRouteSmokeResult(snapshots);

  console.log(formatProductionCoreRouteSmokeResult(result, normalizedBaseUrl));
  process.exit(result.ready ? 0 : 1);
} catch (error) {
  console.error("Production core route smoke: NOT READY");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(usage);
  process.exit(1);
}

async function getRouteSnapshot(baseUrl, path, includeHtml) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
  });
  const snapshot = {
    path,
    status: response.status,
    location: response.headers.get("location"),
  };

  if (includeHtml) {
    snapshot.html = await response.text();
  }

  return snapshot;
}
