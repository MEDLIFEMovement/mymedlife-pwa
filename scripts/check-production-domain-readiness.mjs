/* global console, process, fetch */

import dns from "node:dns/promises";

const usage = [
  "Usage:",
  "  pnpm production:domain <public-base-url>",
  "",
  "Example:",
  "  pnpm production:domain https://www.mymedlife.org",
].join("\n");

const [publicBaseUrl] = process.argv.slice(2);

if (!publicBaseUrl || publicBaseUrl === "--help" || publicBaseUrl === "-h") {
  console.error(usage);
  process.exit(publicBaseUrl ? 0 : 1);
}

try {
  const {
    formatProductionDomainReadinessResult,
    getProductionDomainReadiness,
  } = await import("../src/services/production-domain-readiness.ts");
  const normalizedBaseUrl = publicBaseUrl.endsWith("/")
    ? publicBaseUrl.slice(0, -1)
    : publicBaseUrl;
  const publicUrl = new URL(normalizedBaseUrl);
  const apexDomain = getApexDomain(publicUrl.hostname);
  const snapshot = {
    apex: await getDnsSnapshot(apexDomain),
    www: await getDnsSnapshot(publicUrl.hostname),
    login: await getLoginSnapshot(normalizedBaseUrl),
  };
  const result = getProductionDomainReadiness(snapshot);

  console.log(formatProductionDomainReadinessResult(result, normalizedBaseUrl));
  process.exit(result.ready ? 0 : 1);
} catch (error) {
  console.error("Production domain readiness: NOT READY");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(usage);
  process.exit(1);
}

async function getDnsSnapshot(domain) {
  const [addresses, cnames] = await Promise.all([
    resolveOrEmpty(() => dns.resolve4(domain)),
    resolveOrEmpty(() => dns.resolveCname(domain)),
  ]);

  return {
    domain,
    addresses,
    cnames,
  };
}

async function getLoginSnapshot(baseUrl) {
  const url = `${baseUrl}/login`;
  const response = await fetch(url, {
    redirect: "follow",
  });

  return {
    url,
    status: response.status,
    finalUrl: response.url,
    html: await response.text(),
  };
}

async function resolveOrEmpty(resolve) {
  try {
    return await resolve();
  } catch {
    return [];
  }
}

function getApexDomain(hostname) {
  const parts = hostname.split(".");

  if (parts.length <= 2) {
    return hostname;
  }

  return parts.slice(-2).join(".");
}
