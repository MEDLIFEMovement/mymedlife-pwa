export type ProductionDomainHttpSnapshot = {
  url: string;
  status: number;
  finalUrl: string;
  html: string;
};

export type ProductionDomainDnsSnapshot = {
  domain: string;
  addresses: string[];
  cnames: string[];
};

export type ProductionDomainReadinessSnapshot = {
  apex: ProductionDomainDnsSnapshot;
  www: ProductionDomainDnsSnapshot;
  login: ProductionDomainHttpSnapshot;
};

export type ProductionDomainReadinessCheck = {
  label: string;
  passed: boolean;
  detail: string;
};

export type ProductionDomainReadinessResult = {
  ready: boolean;
  checks: ProductionDomainReadinessCheck[];
};

const godaddyParkingAddresses = new Set(["3.33.130.190", "15.197.148.33"]);
const vercelApexAddress = "76.76.21.21";
const appCopyMarkers = ["myMEDLIFE", "Use one account"];
const parkingMarkers = ["window.location.href=\"/lander\"", "GoDaddy", "godaddy"];

export function getProductionDomainReadiness(
  snapshot: ProductionDomainReadinessSnapshot,
): ProductionDomainReadinessResult {
  const checks: ProductionDomainReadinessCheck[] = [
    noGodaddyParkingCheck(snapshot.apex, "Root domain no longer points to GoDaddy parking"),
    vercelApexCheck(snapshot.apex),
    noGodaddyParkingCheck(snapshot.www, "www domain no longer points to GoDaddy parking"),
    loginStatusCheck(snapshot.login),
    appCopyCheck(snapshot.login),
    noParkingHtmlCheck(snapshot.login),
  ];

  return {
    ready: checks.every((check) => check.passed),
    checks,
  };
}

export function formatProductionDomainReadinessResult(
  result: ProductionDomainReadinessResult,
  publicBaseUrl: string,
): string {
  const passedCount = result.checks.filter((check) => check.passed).length;
  const lines = [
    result.ready
      ? "Production domain readiness: READY"
      : "Production domain readiness: NOT READY",
    `Public URL: ${publicBaseUrl}`,
    `${passedCount}/${result.checks.length} checks passed`,
    "",
    ...result.checks.map(
      (check) =>
        `${check.passed ? "PASS" : "FAIL"} ${check.label}: ${check.detail}`,
    ),
  ];

  return lines.join("\n");
}

function noGodaddyParkingCheck(
  dns: ProductionDomainDnsSnapshot,
  label: string,
): ProductionDomainReadinessCheck {
  const parkedAddresses = dns.addresses.filter((address) =>
    godaddyParkingAddresses.has(address),
  );

  return {
    label,
    passed: parkedAddresses.length === 0,
    detail:
      parkedAddresses.length === 0
        ? formatDnsDetail(dns)
        : `found GoDaddy parking address ${parkedAddresses.join(", ")}`,
  };
}

function vercelApexCheck(
  dns: ProductionDomainDnsSnapshot,
): ProductionDomainReadinessCheck {
  return {
    label: "Root domain points to Vercel apex address",
    passed: dns.addresses.includes(vercelApexAddress),
    detail: formatDnsDetail(dns),
  };
}

function loginStatusCheck(
  login: ProductionDomainHttpSnapshot,
): ProductionDomainReadinessCheck {
  return {
    label: "Public login page returns HTTP 200",
    passed: login.status === 200,
    detail: `received HTTP ${login.status} at ${login.finalUrl}`,
  };
}

function appCopyCheck(
  login: ProductionDomainHttpSnapshot,
): ProductionDomainReadinessCheck {
  const missingMarkers = appCopyMarkers.filter((marker) => !login.html.includes(marker));

  return {
    label: "Public login page serves myMEDLIFE app copy",
    passed: missingMarkers.length === 0,
    detail:
      missingMarkers.length === 0
        ? "expected app copy found"
        : `missing ${missingMarkers.map((marker) => `"${marker}"`).join(", ")}`,
  };
}

function noParkingHtmlCheck(
  login: ProductionDomainHttpSnapshot,
): ProductionDomainReadinessCheck {
  const foundMarkers = parkingMarkers.filter((marker) => login.html.includes(marker));

  return {
    label: "Public login page is not the GoDaddy lander",
    passed: foundMarkers.length === 0,
    detail:
      foundMarkers.length === 0
        ? "no parking-page marker found"
        : `found parking-page marker ${foundMarkers
            .map((marker) => `"${marker}"`)
            .join(", ")}`,
  };
}

function formatDnsDetail(dns: ProductionDomainDnsSnapshot): string {
  const addresses = dns.addresses.length > 0 ? dns.addresses.join(", ") : "none";
  const cnames = dns.cnames.length > 0 ? dns.cnames.join(", ") : "none";

  return `${dns.domain} addresses: ${addresses}; cnames: ${cnames}`;
}
