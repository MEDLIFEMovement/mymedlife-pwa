export type ProductionCoreRouteSnapshot = {
  path: string;
  status: number;
  location?: string | null;
  html?: string;
};

export type ProductionCoreRouteSmokeCheck = {
  label: string;
  passed: boolean;
  detail: string;
};

export type ProductionCoreRouteSmokeResult = {
  ready: boolean;
  checks: ProductionCoreRouteSmokeCheck[];
};

const expectedWorkspaceRedirects = [
  {
    path: "/app",
    location: "/login?redirectTo=%2Fapp",
    label: "Student feed redirects unauthenticated users to login",
  },
  {
    path: "/leader",
    location: "/login?redirectTo=%2Fleader",
    label: "Student command center redirects unauthenticated users to login",
  },
  {
    path: "/staff",
    location: "/login?redirectTo=%2Fstaff",
    label: "Staff command center redirects unauthenticated users to login",
  },
  {
    path: "/admin",
    location: "/login?redirectTo=%2Fadmin",
    label: "Admin backend redirects unauthenticated users to login",
  },
];

export function getProductionCoreRouteSmokeResult(
  snapshots: ProductionCoreRouteSnapshot[],
): ProductionCoreRouteSmokeResult {
  const checks: ProductionCoreRouteSmokeCheck[] = [];
  const snapshotsByPath = new Map(
    snapshots.map((snapshot) => [snapshot.path, snapshot]),
  );
  const loginSnapshot = snapshotsByPath.get("/login");

  checks.push(
    statusCheck(loginSnapshot, 200, "Login page returns HTTP 200"),
    textCheck(loginSnapshot, "myMEDLIFE", 'Login page contains "myMEDLIFE"'),
    textCheck(loginSnapshot, "Use one account", 'Login page contains "Use one account"'),
  );

  for (const expected of expectedWorkspaceRedirects) {
    const snapshot = snapshotsByPath.get(expected.path);

    checks.push(
      redirectStatusCheck(snapshot, expected.label),
      locationCheck(
        snapshot,
        expected.location,
        `${expected.path} preserves the intended destination`,
      ),
    );
  }

  return {
    ready: checks.every((check) => check.passed),
    checks,
  };
}

export function formatProductionCoreRouteSmokeResult(
  result: ProductionCoreRouteSmokeResult,
  baseUrl: string,
): string {
  const passedCount = result.checks.filter((check) => check.passed).length;
  const lines = [
    result.ready
      ? "Production core route smoke: READY"
      : "Production core route smoke: NOT READY",
    `Base URL: ${baseUrl}`,
    `${passedCount}/${result.checks.length} checks passed`,
    "",
    ...result.checks.map(
      (check) =>
        `${check.passed ? "PASS" : "FAIL"} ${check.label}: ${check.detail}`,
    ),
  ];

  return lines.join("\n");
}

function statusCheck(
  snapshot: ProductionCoreRouteSnapshot | undefined,
  expectedStatus: number,
  label: string,
): ProductionCoreRouteSmokeCheck {
  if (!snapshot) {
    return missingSnapshotCheck(label);
  }

  return {
    label,
    passed: snapshot.status === expectedStatus,
    detail: `received HTTP ${snapshot.status}`,
  };
}

function redirectStatusCheck(
  snapshot: ProductionCoreRouteSnapshot | undefined,
  label: string,
): ProductionCoreRouteSmokeCheck {
  if (!snapshot) {
    return missingSnapshotCheck(label);
  }

  const passed = snapshot.status >= 300 && snapshot.status < 400;

  return {
    label,
    passed,
    detail: `received HTTP ${snapshot.status}`,
  };
}

function locationCheck(
  snapshot: ProductionCoreRouteSnapshot | undefined,
  expectedLocation: string,
  label: string,
): ProductionCoreRouteSmokeCheck {
  if (!snapshot) {
    return missingSnapshotCheck(label);
  }

  return {
    label,
    passed: snapshot.location === expectedLocation,
    detail: snapshot.location
      ? `received location ${snapshot.location}`
      : "location header missing",
  };
}

function textCheck(
  snapshot: ProductionCoreRouteSnapshot | undefined,
  text: string,
  label: string,
): ProductionCoreRouteSmokeCheck {
  if (!snapshot) {
    return missingSnapshotCheck(label);
  }

  const passed = Boolean(snapshot.html?.includes(text));

  return {
    label,
    passed,
    detail: passed ? "expected text found" : "expected text missing",
  };
}

function missingSnapshotCheck(label: string): ProductionCoreRouteSmokeCheck {
  return {
    label,
    passed: false,
    detail: "route was not checked",
  };
}
