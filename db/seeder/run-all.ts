import { readdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

function normalizeSeederName(input: string): string {
  return input.endsWith(".seed.ts") ? input : `${input}.seed.ts`;
}

async function runSeeder(seederDir: string, seeder: string): Promise<void> {
  const seederPath = path.join(seederDir, seeder);
  console.log(`\nRunning seeder: ${seeder}`);

  await new Promise<void>((resolve, reject) => {
    const child = spawn("tsx", [seederPath], { stdio: "inherit" });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Seeder failed: ${seeder} (exit code ${code ?? "unknown"})`));
    });
  });
}

async function run() {
  const seederDir = path.resolve(process.cwd(), "db/seeder");
  const entries = await readdir(seederDir, { withFileTypes: true });
  const allSeeders = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".seed.ts"))
    .map((entry) => entry.name)
    .sort();

  if (allSeeders.length === 0) {
    console.log("No seeder files found in db/seeder.");
    return;
  }

  const requested = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
  const requestedSet = new Set(requested.map(normalizeSeederName));

  const seedersToRun = requestedSet.size > 0
    ? allSeeders.filter((name) => requestedSet.has(name))
    : allSeeders;

  if (requestedSet.size > 0 && seedersToRun.length !== requestedSet.size) {
    const missing = Array.from(requestedSet).filter((name) => !allSeeders.includes(name));
    throw new Error(`Seeder file not found: ${missing.join(", ")}`);
  }

  for (const seeder of seedersToRun) {
    await runSeeder(seederDir, seeder);
  }

  console.log("\nAll requested seeders completed successfully.");
}

run().catch((error) => {
  console.error("Seed pipeline failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
