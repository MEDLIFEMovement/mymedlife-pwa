/* global console, process, fetch */

import dns from "node:dns/promises";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm production:launch-check [--app-url https://mymedlife-pwa.vercel.app] [--public-url https://www.mymedlife.org] [--packet production-rollout-packet.json]",
  "",
  "This is read-only. It checks the deployed app routes, public domain DNS/login, and optional 30-chapter rollout packet.",
].join("\n");

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.error(usage);
  process.exit(0);
}

try {
  const appUrl = normalizeUrl(getArgValue(args, "--app-url") ?? "https://mymedlife-pwa.vercel.app");
  const publicUrl = normalizeUrl(
    getArgValue(args, "--public-url") ?? "https://www.mymedlife.org",
  );
  const packetPath = getArgValue(args, "--packet");
  const [
    { getProductionCoreRouteSmokeResult },
    { getProductionDomainReadiness },
    {
      formatCoreProductionLaunchReadiness,
      getCoreProductionLaunchReadiness,
    },
  ] = await Promise.all([
    import("../src/services/production-core-route-smoke.ts"),
    import("../src/services/production-domain-readiness.ts"),
    import("../src/services/core-production-launch-readiness.ts"),
  ]);
  const { rolloutReadiness, rolloutHandoff } = await getRolloutInputs(packetPath);
  const routeSmoke = getProductionCoreRouteSmokeResult(
    await Promise.all([
      getRouteSnapshot(appUrl, "/login", true),
      getRouteSnapshot(appUrl, "/app", false),
      getRouteSnapshot(appUrl, "/leader", false),
      getRouteSnapshot(appUrl, "/staff", false),
      getRouteSnapshot(appUrl, "/admin", false),
    ]),
  );
  const publicUrlObject = new URL(publicUrl);
  const domainReadiness = getProductionDomainReadiness({
    apex: await getDnsSnapshot(getApexDomain(publicUrlObject.hostname)),
    www: await getDnsSnapshot(publicUrlObject.hostname),
    login: await getLoginSnapshot(publicUrl),
  });
  const readiness = getCoreProductionLaunchReadiness({
    appUrl,
    publicUrl,
    routeSmoke,
    domainReadiness,
    rolloutReadiness,
    rolloutHandoff,
  });

  console.log(formatCoreProductionLaunchReadiness(readiness));
  process.exit(readiness.ready ? 0 : 1);
} catch (error) {
  console.error("Core production launch readiness: NOT READY");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(usage);
  process.exit(1);
}

async function getRolloutInputs(packetPath) {
  if (!packetPath) {
    return {
      rolloutReadiness: null,
      rolloutHandoff: null,
    };
  }

  const [
    { getProductionRolloutBootstrapReadiness },
    { getProductionRolloutHandoff },
  ] = await Promise.all([
    import("../src/services/production-rollout-bootstrap.ts"),
    import("../src/services/production-rollout-handoff.ts"),
  ]);
  const packet = JSON.parse(await readFile(resolve(packetPath), "utf8"));

  return {
    rolloutReadiness: getProductionRolloutBootstrapReadiness(packet),
    rolloutHandoff: getProductionRolloutHandoff(packet),
  };
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

function getArgValue(args, name) {
  const inline = args.find((arg) => arg.startsWith(`${name}=`));

  if (inline) {
    return inline.slice(name.length + 1);
  }

  const index = args.indexOf(name);

  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function normalizeUrl(url) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
