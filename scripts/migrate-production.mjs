import { execFileSync } from "node:child_process";

const prismaCommand = process.platform === "win32" ? "prisma.cmd" : "prisma";
const migrationAttempts = 4;
const retryDelaysMs = [0, 15_000, 30_000, 60_000];

if (process.env.PRISMA_BASELINE_RESOLVE === "true") {
  execFileSync(prismaCommand, ["migrate", "resolve", "--applied", "0001_baseline"], {
    stdio: "inherit",
  });
}

let migrationError;
for (let attempt = 1; attempt <= migrationAttempts; attempt += 1) {
  if (retryDelaysMs[attempt - 1] > 0) {
    console.log(
      `Waiting ${retryDelaysMs[attempt - 1] / 1000}s before Prisma migration retry ${attempt}/${migrationAttempts}...`,
    );
    await new Promise((resolve) => setTimeout(resolve, retryDelaysMs[attempt - 1]));
  }

  try {
    console.log(`Running Prisma migrations (attempt ${attempt}/${migrationAttempts})...`);
    execFileSync(prismaCommand, ["migrate", "deploy"], {
      stdio: "inherit",
    });
    migrationError = undefined;
    break;
  } catch (error) {
    migrationError = error;
    console.error(`Prisma migration attempt ${attempt} failed.`);
    if (attempt < migrationAttempts) {
      console.error("This may be transient database advisory-lock contention; retrying with backoff.");
    }
  }
}

if (migrationError) {
  throw migrationError;
}

console.log("Seeding nationwide transport guides...");
execFileSync(process.execPath, ["scripts/seed-nationwide-transport.mjs"], {
  stdio: "inherit",
  env: process.env,
});
console.log("Nationwide transport guides seeded and verified successfully.");

// One-time, non-destructive administrator setup. This is intentionally opt-in
// and never runs during ordinary deployments.
if (process.env.ALLOW_ADMIN_SETUP === "true") {
  execFileSync(process.execPath, ["scripts/setup-admin.cjs"], {
    stdio: "inherit",
    env: process.env,
  });
}
