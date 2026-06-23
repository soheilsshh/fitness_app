import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");

const linkTargets = [
  "src",
  "public",
  "scripts",
  "node_modules",
  "package.json",
  "package-lock.json",
  "next.config.mjs",
  "postcss.config.mjs",
  "tailwind.config.js",
  "jsconfig.json",
  "components.json",
  "eslint.config.mjs",
];

function setupBuildEnv() {
  const envDir = fs.mkdtempSync(path.join(os.tmpdir(), "fitino-spa-build-"));

  for (const target of linkTargets) {
    const source = path.join(root, target);
    if (!fs.existsSync(source)) continue;
    const linkPath = path.join(envDir, target);
    const type = fs.statSync(source).isDirectory() ? "dir" : "file";
    fs.symlinkSync(source, linkPath, type);
  }

  return envDir;
}

function runNextBuild(envDir) {
  const result = spawnSync("npm", ["run", "build:next"], {
    cwd: envDir,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function assertExists(dir) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Expected build output at ${dir}.`);
  }
}

function copyOutToDist(envDir) {
  const outDir = path.join(envDir, "out");
  const stagingDir = path.join(root, `.dist-staging-${process.pid}`);

  assertExists(outDir);

  fs.rmSync(stagingDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
  fs.cpSync(outDir, stagingDir, { recursive: true });

  const rootIndex = path.join(stagingDir, "index.html");
  if (!fs.existsSync(rootIndex)) {
    throw new Error("dist/index.html is missing after export.");
  }

  const keep = new Set([rootIndex]);

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!entry.name.endsWith(".html")) continue;
      if (keep.has(fullPath)) continue;

      fs.unlinkSync(fullPath);
    }
  }

  walk(stagingDir);

  function removeEmptyDirs(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.name === "_next") continue;
      removeEmptyDirs(fullPath);
      if (fs.readdirSync(fullPath).length === 0) {
        fs.rmdirSync(fullPath);
      }
    }
  }

  removeEmptyDirs(stagingDir);

  try {
    fs.rmSync(distDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
    fs.renameSync(stagingDir, distDir);
    return distDir;
  } catch {
    const fallbackDir = path.join(root, "dist-new");
    fs.rmSync(fallbackDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
    fs.renameSync(stagingDir, fallbackDir);
    console.warn(
      `Warning: could not replace dist/ (permission?). Fresh build is in ${fallbackDir}`
    );
    return fallbackDir;
  }
}

function cleanupBuildEnv(envDir) {
  try {
    fs.rmSync(envDir, { recursive: true, force: true, maxRetries: 2, retryDelay: 50 });
  } catch {
    // temp dir cleanup is best-effort
  }
}

const envDir = setupBuildEnv();

try {
  runNextBuild(envDir);
  const outputDir = copyOutToDist(envDir);
  console.log("SPA export ready:", outputDir);
  console.log("Deploy dist/ behind nginx with try_files -> /index.html");
} finally {
  cleanupBuildEnv(envDir);
}
