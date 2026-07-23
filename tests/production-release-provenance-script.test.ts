import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { promisify } from "node:util";

import { afterEach, describe, expect, it } from "vitest";

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
});
