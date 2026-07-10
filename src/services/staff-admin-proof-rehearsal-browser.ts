import {
  buildStaffAdminProofRehearsalValidation,
  type StaffAdminProofRehearsalMappedRow,
} from "./staff-admin-proof-rehearsal.ts";

export type StaffAdminProofRehearsalBrowserSnapshot = {
  title: string;
  summary: {
    ready: boolean;
    staffRows: number;
    adminRows: number;
    passedRows: number;
    failedRows: number;
  };
  html: string;
};

export function buildStaffAdminProofRehearsalBrowserSnapshot(
  csv: string,
): StaffAdminProofRehearsalBrowserSnapshot {
  const validation = buildStaffAdminProofRehearsalValidation(csv);

  return {
    title: "Staff/Admin TEST rehearsal browser proof",
    summary: {
      ready: validation.ready,
      staffRows: validation.summary.staffRows,
      adminRows: validation.summary.adminRows,
      passedRows: validation.summary.passedRows,
      failedRows: validation.summary.failedRows,
    },
    html: formatStaffAdminProofRehearsalBrowserHtml(validation.rows, validation.ready),
  };
}

export function formatStaffAdminProofRehearsalBrowserHtml(
  rows: StaffAdminProofRehearsalMappedRow[],
  ready: boolean,
): string {
  const rowsHtml = rows
    .map(
      (row) => `
        <tr data-workspace="${escapeHtml(row.normalizedWorkspace)}" data-status="${escapeHtml(
          row.status,
        )}">
          <td>${escapeHtml(row.email)}</td>
          <td>${escapeHtml(row.workspace)}</td>
          <td>${escapeHtml(row.expectedPath)}</td>
          <td>${escapeHtml(row.observedPath)}</td>
          <td>${escapeHtml(row.status)}</td>
          <td>${escapeHtml(row.checkedAt)}</td>
          <td>${escapeHtml(row.notes)}</td>
        </tr>`,
    )
    .join("");

  return `
    <section data-proof="staff-admin-test-rehearsal" data-production-proof="blocked">
      <header>
        <p>TEST-only rehearsal snapshot</p>
        <h1>Staff/Admin proof rehearsal browser snapshot</h1>
        <p>This browser/DOM helper is for local or staging rehearsal only. It must not be used as production proof.</p>
      </header>
      <dl>
        <div><dt>Status</dt><dd>${ready ? "Ready" : "Blocked"}</dd></div>
        <div><dt>Staff rows</dt><dd>${rows.filter((row) => row.normalizedWorkspace === "staff_command_center").length}</dd></div>
        <div><dt>Admin rows</dt><dd>${rows.filter((row) => row.normalizedWorkspace === "admin_backend").length}</dd></div>
        <div><dt>Passed rows</dt><dd>${rows.filter((row) => row.status === "passed").length}</dd></div>
        <div><dt>Failed rows</dt><dd>${rows.filter((row) => row.status === "failed").length}</dd></div>
      </dl>
      <table aria-label="Staff/Admin TEST rehearsal rows">
        <thead>
          <tr>
            <th>Email</th>
            <th>Workspace</th>
            <th>Expected route</th>
            <th>Observed route</th>
            <th>Status</th>
            <th>Checked at</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <footer>
        <p>Production evidence remains blocked until real hosted proof replaces these TEST rows.</p>
      </footer>
    </section>
  `.trim();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
