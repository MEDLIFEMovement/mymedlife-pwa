import { describe, expect, it } from "vitest";
import {
  evaluateHostedHomeSmoke,
  evaluateHostedLoginSmoke,
  hasHostedAuthSmokeFailures,
} from "@/services/hosted-auth-smoke";

const hostedHomeHtml = `
  <html>
    <body>
      <h1>Chapter operating system</h1>
      <span>Pilot-safe</span>
      <p>Mock-seeded review data</p>
    </body>
  </html>
`;

const hostedPreauthLoginHtml = `
  <html>
    <head><title>Local Sign In | myMEDLIFE</title></head>
    <body>
      <h1>Local sign-in is the bridge from review mode to real MVP behavior.</h1>
      <p>Use a fake local Supabase account from the seed data.</p>
      <p>Supabase Auth is disabled because MYMEDLIFE_AUTH_MODE is not set to local_supabase or staging_supabase.</p>
      <li>Production auth remains disabled.</li>
      <li>Browser writes remain disabled.</li>
    </body>
  </html>
`;

const hostedStagingLoginHtml = `
  <html>
    <head><title>Local Sign In | myMEDLIFE</title></head>
    <body>
      <h1>Staging sign-in is the review gate before the first hosted write.</h1>
      <p>This page proves Supabase Auth on staging.mymedlife.org only, using the approved staging project while production auth, uploads, and external sends remain blocked.</p>
      <li>Hosted auth is allowed only on staging.mymedlife.org.</li>
      <li>Production auth remains disabled.</li>
      <li>Browser writes remain disabled.</li>
      <div>Use an approved staging account on staging.mymedlife.org only.</div>
    </body>
  </html>
`;

describe("hosted auth smoke", () => {
  it("passes home smoke checks for a live review build", () => {
    const evaluation = evaluateHostedHomeSmoke({
      html: hostedHomeHtml,
      status: 200,
      url: "https://mymedlife-pwa.vercel.app",
    });

    expect(hasHostedAuthSmokeFailures(evaluation)).toBe(false);
    expect(evaluation.checks).toHaveLength(4);
  });

  it("passes preauth login smoke when hosted auth is still off", () => {
    const evaluation = evaluateHostedLoginSmoke(
      {
        html: hostedPreauthLoginHtml,
        status: 200,
        url: "https://mymedlife-pwa.vercel.app/login",
      },
      "preauth",
    );

    expect(hasHostedAuthSmokeFailures(evaluation)).toBe(false);
  });

  it("passes staging auth login smoke only for the staging copy", () => {
    const evaluation = evaluateHostedLoginSmoke(
      {
        html: hostedStagingLoginHtml,
        status: 200,
        url: "https://staging.mymedlife.org/login",
      },
      "staging_auth",
    );

    expect(hasHostedAuthSmokeFailures(evaluation)).toBe(false);
  });

  it("fails preauth smoke if staging-only login copy leaks into the default host", () => {
    const evaluation = evaluateHostedLoginSmoke(
      {
        html: hostedStagingLoginHtml,
        status: 200,
        url: "https://mymedlife-pwa.vercel.app/login",
      },
      "preauth",
    );

    expect(hasHostedAuthSmokeFailures(evaluation)).toBe(true);
    expect(
      evaluation.checks.find((check) => check.key.includes("login_excludes"))?.passed,
    ).toBe(false);
  });
});
