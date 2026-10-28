import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const frontend = path.join(root, "frontend");
const angular = path.join(root, "frontend-angular");
const angularOutput = path.join(angular, "dist", "wincapture-angular", "browser");
const staticOutput = path.join(frontend, "dist");
const publishRoot = path.join(root, "backend", "wwwroot");
if (!publishRoot.startsWith(`${root}${path.sep}`)) throw new Error("Static output path must stay inside the repository.");
function readDotEnv(content) {
  return Object.fromEntries(content.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1].startsWith("#")) return [];
    return [[match[1], match[2].replace(/^(["'])(.*)\1$/, "$2")]];
  }));
}

let localEnv = {};
try { localEnv = readDotEnv(await readFile(path.join(frontend, ".env.production"), "utf8")); } catch {}
const env = { ...localEnv, ...process.env };
const required = ["VITE_MSAL_CLIENT_ID", "VITE_MSAL_TENANT_ID", "VITE_MSAL_API_SCOPE"];
const missing = required.filter((key) => !env[key]?.trim() || env[key].includes("<"));
if (missing.length) throw new Error(`Set public frontend build values: ${missing.join(", ")}`);
if (env.VITE_API_BASE_URL?.trim()) {
  const apiUrl = new URL(env.VITE_API_BASE_URL);
  if (apiUrl.protocol !== "https:" || ["localhost", "127.0.0.1", "::1"].includes(apiUrl.hostname)) {
    throw new Error("VITE_API_BASE_URL must be blank for same-origin hosting or a non-local HTTPS URL.");
  }
}

function run(command, args, cwd, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
    shell: process.platform === "win32",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("npm", ["run", "build:production"], angular);

const runtimeConfig = {
  msalClientId: env.VITE_MSAL_CLIENT_ID,
  msalTenantId: env.VITE_MSAL_TENANT_ID,
  msalApiScope: env.VITE_MSAL_API_SCOPE,
  apiBaseUrl: env.VITE_API_BASE_URL?.trim() ?? "",
};
await writeFile(
  path.join(angularOutput, "runtime-config.js"),
  `window.__WINCAPTURE_CONFIG__ = ${JSON.stringify(runtimeConfig)};\n`,
  "utf8",
);

run("npm", ["run", "build"], frontend, env);
await mkdir(path.join(staticOutput, "angular"), { recursive: true });
await cp(angularOutput, path.join(staticOutput, "angular"), { recursive: true });
await rm(publishRoot, { recursive: true, force: true });
await mkdir(publishRoot, { recursive: true });
await cp(staticOutput, publishRoot, { recursive: true });
console.log("Combined React and Angular production assets are ready in backend/wwwroot.");
