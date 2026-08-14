import { execFileSync } from "node:child_process";

const prismaCommand = process.platform === "win32" ? "prisma.cmd" : "prisma";

if (process.env.PRISMA_BASELINE_RESOLVE === "true") {
  execFileSync(prismaCommand, ["migrate", "resolve", "--applied", "0001_baseline"], {
    stdio: "inherit",
  });
}

execFileSync(prismaCommand, ["migrate", "deploy"], {
  stdio: "inherit",
});

// One-time, non-destructive administrator setup. This is intentionally opt-in
// and never runs during ordinary deployments.
if (process.env.ALLOW_ADMIN_SETUP === "true") {
  execFileSync(process.execPath, ["scripts/setup-admin.cjs"], {
    stdio: "inherit",
    env: process.env,
  });
}
