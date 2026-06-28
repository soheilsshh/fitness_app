import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "out");
const distDir = path.join(root, "dist");

function runNextBuild() {
  const result = spawnSync("npx", ["next", "build", "--webpack"], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function assertExportReady() {
  if (!fs.existsSync(outDir)) {
    throw new Error("Missing out/ — next build did not produce a static export.");
  }

  const checks = [
    "index.html",
    "admin/index.html",
    "leadfunnel/index.html",
    "auth/login/index.html",
    "780027.txt",
  ];

  for (const rel of checks) {
    const full = path.join(outDir, rel);
    if (!fs.existsSync(full)) {
      throw new Error(`Export incomplete: out/${rel} is missing.`);
    }
  }
}

function copyOutToDist() {
  fs.rmSync(distDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
  fs.cpSync(outDir, distDir, { recursive: true });
}

runNextBuild();
assertExportReady();
copyOutToDist();

console.log("Next.js static export ready:", distDir);
console.log("Deploy frontend/dist/ to nginx root (each route has its own index.html).");
