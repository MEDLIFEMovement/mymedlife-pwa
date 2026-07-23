import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { promisify } from "node:util";

import { afterEach, describe, expect, it } from "vitest";

import {
  normalizeSha,
  normalizeUrl,
  readPayload,
  runReleaseProvenanceCheck,
  usage,
} from "../scripts/check-production-release-provenance.mjs";

const execFileAsync = promisify(execFile);
const releaseSha = "9798e2be63f277480122d6ccc48126df84a38065";
const servers: ReturnType<typeof createServer>[] = [];

describe("production release provenance script", () => {
  afterEach(async () => {
    await Promise.all(servers.splice(0).map(
      (server) => new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      }),
    ));
  });

  it("passes only when payload, header, and expected commit all match", async () => {
    const server = createServer((request, response) => {
      if (request.url !== "/api/release") {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, {
        "content-type": "application/json",
        "x-mymedlife-release": releaseSha,
      });
      response.end(JSON.stringify({
        service: "mymedlife-pwa",
        releaseSha,
        ready: true,
      }));
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("The release-provenance test server did not start.");
    }
    const baseUrl = `http://localhost:${address.port}`;

    const ready = await execFileAsync(process.execPath, [
      "scripts/check-production-release-provenance.mjs",
      baseUrl,
      releaseSha,
    ]);
    expect(ready.stdout).toContain("Production release provenance: READY");
    expect(ready.stdout).toContain("PASS Deployed commit matches the approved commit");

    let mismatch: { code?: number; stdout?: string } | null = null;
    try {
      await execFileAsync(process.execPath, [
        "scripts/check-production-release-provenance.mjs",
        baseUrl,
        "1111111111111111111111111111111111111111",
      ]);
    } catch (error) {
      mismatch = error as { code?: number; stdout?: string };
    }
    expect(mismatch?.code).toBe(1);
    expect(mismatch?.stdout).toContain(
      "Production release provenance: NOT READY",
    );
    expect(mismatch?.stdout).toContain(
      "FAIL Deployed commit matches the approved commit",
    );
  });

  it("covers the in-process success and mismatch contracts", async () => {
    const lines: string[] = [];
    const fetchImpl = async () => new Response(JSON.stringify({
      service: "mymedlife-pwa",
      releaseSha,
      ready: true,
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mymedlife-release": releaseSha,
      },
    });

    await expect(runReleaseProvenanceCheck({
      args: ["https://mymedlife.org/path", releaseSha.toUpperCase()],
      fetchImpl,
      log: (line: string) => lines.push(line),
    })).resolves.toBe(0);
    expect(lines).toContain("Production release provenance: READY");
    expect(lines).toContain("Base URL: https://mymedlife.org");

    lines.length = 0;
    await expect(runReleaseProvenanceCheck({
      args: ["https://mymedlife.org", "1".repeat(40)],
      fetchImpl,
      log: (line: string) => lines.push(line),
    })).resolves.toBe(1);
    expect(lines.some((line) => line.startsWith(
      "FAIL Deployed commit matches the approved commit",
    ))).toBe(true);
  });

  it("fails closed for malformed metadata and unreachable release contracts", async () => {
    const errors: string[] = [];
    await expect(runReleaseProvenanceCheck({
      args: ["http://example.com", releaseSha],
      fetchImpl: async () => {
        throw new Error("fetch should not run");
      },
      logError: (line: string) => errors.push(line),
    })).resolves.toBe(1);
    expect(errors).toContain("The release URL must use HTTPS.");

    errors.length = 0;
    await expect(runReleaseProvenanceCheck({
      args: ["https://mymedlife.org"],
      env: { NODE_ENV: "test" },
      fetchImpl: async () => {
        throw new Error("fetch should not run");
      },
      logError: (line: string) => errors.push(line),
    })).resolves.toBe(1);
    expect(errors).toContain(
      "An exact 40-character expected commit SHA is required.",
    );

    const lines: string[] = [];
    await expect(runReleaseProvenanceCheck({
      args: ["https://mymedlife.org", releaseSha],
      fetchImpl: async () => new Response("not-json", { status: 503 }),
      log: (line: string) => lines.push(line),
    })).resolves.toBe(1);
    expect(lines.some((line) => line.startsWith(
      "FAIL Release payload contains a valid commit SHA",
    ))).toBe(true);
  });

  it("supports help, environment fallback, and defensive payload parsing", async () => {
    const lines: string[] = [];
    await expect(runReleaseProvenanceCheck({
      args: ["--help"],
      log: (line: string) => lines.push(line),
    })).resolves.toBe(0);
    expect(lines).toEqual([usage]);

    lines.length = 0;
    await expect(runReleaseProvenanceCheck({
      args: ["https://mymedlife.org"],
      env: {
        NODE_ENV: "test",
        EXPECTED_RELEASE_SHA: releaseSha,
      },
      fetchImpl: async () => new Response(JSON.stringify({
        service: "mymedlife-pwa",
        releaseSha,
      }), {
        status: 200,
        headers: { "x-mymedlife-release": releaseSha },
      }),
      log: (line: string) => lines.push(line),
    })).resolves.toBe(0);

    await expect(readPayload(new Response("[]"))).resolves.toEqual({});
    expect(normalizeUrl("http://localhost:3217/path")).toBe(
      "http://localhost:3217",
    );
    expect(normalizeSha(null)).toBeNull();
  });
});
