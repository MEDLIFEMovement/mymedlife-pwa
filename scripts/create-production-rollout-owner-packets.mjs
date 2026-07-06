/* global console, process */
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  pnpm rollout:owner-packets --out rollout-owner-packets",
  "",
  "This creates owner-specific folders for collecting the real 30-chapter rollout CSV data.",
  "It does not create users, write Supabase rows, call Luma, send invites, or change production config.",
].join("\n");

try {
  const args = parseArgs(process.argv.slice(2));
  const {
    formatProductionRolloutOwnerPacketIndex,
    getProductionRolloutOwnerPacketFiles,
    getProductionRolloutOwnerPackets,
  } = await import("../src/services/production-rollout-owner-packets.ts");
  const outDir = resolve(args.out);
  const packets = getProductionRolloutOwnerPackets();

  await mkdir(outDir, { recursive: true });
  await writeFile(
    join(outDir, "README.md"),
    formatProductionRolloutOwnerPacketIndex(args.out),
  );

  for (const packet of packets) {
    const packetDir = join(outDir, packet.slug);

    await mkdir(packetDir, { recursive: true });

    for (const file of getProductionRolloutOwnerPacketFiles(packet)) {
      await writeFile(join(packetDir, file.path), file.content);
    }
  }

  console.log(`Production rollout owner packets written to ${outDir}`);
  console.log("Next: ask each owner to fill only their folder, then assemble rollout-csv.");
} catch (error) {
  console.error("Production rollout owner packets were not created.");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(usage);
  process.exit(1);
}

function parseArgs(args) {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage);
    process.exit(0);
  }

  const out = getValue(args, "--out");

  if (!out) {
    throw new Error("Missing required argument --out.");
  }

  return {
    out,
  };
}

function getValue(args, name) {
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
