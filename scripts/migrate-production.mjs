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
