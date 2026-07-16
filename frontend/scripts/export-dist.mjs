import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "out");
const distDir = path.join(root, "dist");
const nextDir = path.join(root, ".next");

/** Top-level `.next` can be user-owned while nested files are root-owned (sudo build). */
function isNextCacheUsable() {
  if (!fs.existsSync(nextDir)) return true;
  try {
    const diagDir = path.join(nextDir, "diagnostics");
    fs.mkdirSync(diagDir, { recursive: true });
    const target = path.join(diagDir, "build-diagnostics.json");
    if (fs.existsSync(target)) fs.unlinkSync(target);
    fs.writeFileSync(target, "{}");
    return true;
  } catch {
    return false;
  }
}

function runNextBuild(cwd) {
  const result = spawnSync("npx", ["next", "build", "--webpack"], {
    cwd,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function assertExportReady(exportRoot) {
  if (!fs.existsSync(exportRoot)) {
    throw new Error(`Missing out/ — next build did not produce a static export at ${exportRoot}`);
  }

  const checks = [
    "index.html",
    "admin/index.html",
    "ali-rashidabadi/index.html",
    "auth/login/index.html",
    "780027.txt",
  ];

  for (const rel of checks) {
    const full = path.join(exportRoot, rel);
    if (!fs.existsSync(full)) {
      throw new Error(`Export incomplete: ${path.basename(exportRoot)}/${rel} is missing.`);
    }
  }
}

function copyOutToDist(exportRoot) {
  fs.rmSync(distDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
  fs.cpSync(exportRoot, distDir, { recursive: true });
}

/**
 * When `.next` is root-owned (from `sudo npm run build`), build in a clean
 * temp tree so we never need to unlink the locked cache.
 */
function buildInCleanTemp() {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "fitness-frontend-build-"));
  console.warn(
    `[export-dist] ${nextDir} is not writable (often from sudo npm run build). Building in ${tmpRoot}`,
  );

  const copy = spawnSync(
    "rsync",
    [
      "-a",
      "--exclude",
      ".next",
      "--exclude",
      ".next-build",
      "--exclude",
      "out",
      "--exclude",
      "dist",
      "--exclude",
      "node_modules",
      "--exclude",
      ".git",
      `${root}/`,
      `${tmpRoot}/`,
    ],
    { stdio: "inherit" },
  );
  if (copy.status !== 0) {
    process.exit(copy.status ?? 1);
  }

  fs.symlinkSync(path.join(root, "node_modules"), path.join(tmpRoot, "node_modules"));
  runNextBuild(tmpRoot);

  const tmpOut = path.join(tmpRoot, "out");
  assertExportReady(tmpOut);

  fs.rmSync(outDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
  fs.cpSync(tmpOut, outDir, { recursive: true });
  copyOutToDist(outDir);

  fs.rmSync(tmpRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
}

if (!isNextCacheUsable()) {
  buildInCleanTemp();
} else {
  runNextBuild(root);
  assertExportReady(outDir);
  copyOutToDist(outDir);
}

console.log("Next.js static export ready:", distDir);
console.log("Deploy frontend/dist/ to nginx root (each route has its own index.html).");
