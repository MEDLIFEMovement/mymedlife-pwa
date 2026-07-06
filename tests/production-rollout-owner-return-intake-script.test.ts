import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("production rollout owner return intake script", () => {
  it("writes a dry-run report without copying returned CSVs", async () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-owner-return-intake-"));
    const returnsDir = join(directory, "returned-owner-packets");
    const ownerDir = join(directory, "rollout-owner-packets");
    const outPath = join(directory, "owner-return-intake.md");
    const targetPath = join(ownerDir, "nick-hq-launch-owner", "chapters.csv");

    await mkdir(join(returnsDir, "nick-hq-launch-owner"), { recursive: true });
    await mkdir(join(ownerDir, "nick-hq-launch-owner"), { recursive: true });
    writeFileSync(targetPath, "id,name,campus,region,status\n");
    writeFileSync(
      join(returnsDir, "nick-hq-launch-owner", "chapters.csv"),
      "id,name,campus,region,status\nchapter-ucla,UCLA MEDLIFE,UCLA,West,active\n",
    );

    const result = runScript([
      "--returns-dir",
      returnsDir,
      "--owner-dir",
      ownerDir,
      "--out",
      outPath,
    ]);
    const report = readFileSync(outPath, "utf8");
    const target = readFileSync(targetPath, "utf8");

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Current status: READY TO APPLY");
    expect(report).toContain("myMEDLIFE returned owner CSV intake: READY TO APPLY");
    expect(report).toContain("Mode: DRY RUN");
    expect(target).toBe("id,name,campus,region,status\n");
  });

  it("copies safe returned CSVs when apply is explicit", async () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-owner-return-apply-"));
    const returnsDir = join(directory, "returned-owner-packets");
    const ownerDir = join(directory, "rollout-owner-packets");
    const outPath = join(directory, "owner-return-intake.md");
    const targetPath = join(ownerDir, "campaign-launch-owner", "campaigns.csv");

    await mkdir(join(returnsDir, "campaign-launch-owner"), { recursive: true });
    await mkdir(join(ownerDir, "campaign-launch-owner"), { recursive: true });
    writeFileSync(targetPath, "chapterId,name,slug,status\n");
    writeFileSync(
      join(returnsDir, "campaign-launch-owner", "campaigns.csv"),
      "chapterId,name,slug,status\nchapter-ucla,Rush Month,rush-month-ucla,active\n",
    );

    const result = runScript([
      "--returns-dir",
      returnsDir,
      "--owner-dir",
      ownerDir,
      "--out",
      outPath,
      "--apply",
    ]);
    const report = readFileSync(outPath, "utf8");
    const target = await readFile(targetPath, "utf8");

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Current status: APPLIED");
    expect(report).toContain("myMEDLIFE returned owner CSV intake: APPLIED");
    expect(target).toContain("chapter-ucla,Rush Month,rush-month-ucla,active");
  });

  it("refuses to apply unsafe returned CSVs", async () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-owner-return-unsafe-"));
    const returnsDir = join(directory, "returned-owner-packets");
    const ownerDir = join(directory, "rollout-owner-packets");
    const outPath = join(directory, "owner-return-intake.md");
    const targetPath = join(ownerDir, "ds-launch-owner", "users.csv");

    await mkdir(join(returnsDir, "ds-launch-owner"), { recursive: true });
    await mkdir(join(ownerDir, "ds-launch-owner"), { recursive: true });
    writeFileSync(targetPath, "email,displayName\n");
    writeFileSync(
      join(returnsDir, "ds-launch-owner", "users.csv"),
      "email,displayName\nstudent@example.org,password=abc123\n",
    );

    const result = runScript([
      "--returns-dir",
      returnsDir,
      "--owner-dir",
      ownerDir,
      "--out",
      outPath,
      "--apply",
    ]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("not safe to apply");
    expect(existsSync(outPath)).toBe(false);
    expect(readFileSync(targetPath, "utf8")).toBe("email,displayName\n");
  });
});

function runScript(args: string[]) {
  return spawnSync(
    "node",
    [
      "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
      "scripts/create-production-rollout-owner-return-intake.mjs",
      ...args,
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );
}
