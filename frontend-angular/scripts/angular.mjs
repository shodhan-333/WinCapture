import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const frontendEnvPath = path.resolve(projectRoot, "..", "frontend", ".env");
const envText = await readFile(frontendEnvPath, "utf8").catch((error) => {
  throw new Error(`Could not read frontend environment file at ${frontendEnvPath}.`, {
    cause: error,
  });
});
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const separator = line.indexOf("=");
      if (separator < 1) return null;
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, "$2");
      return [key, value];
    })
    .filter((entry) => entry !== null),
);
const requiredKeys = [
  "VITE_API_BASE_URL",
  "VITE_MSAL_AUTHORITY",
  "VITE_MSAL_CLIENT_ID",
  "VITE_MSAL_TENANT_ID",
  "VITE_MSAL_API_SCOPE",
  "VITE_ANGULAR_MSAL_REDIRECT_URI",
  "VITE_ANGULAR_REACT_BASE_URL",
  "VITE_GOOGLE_FONTS_URL",
  "VITE_ANGULAR_DEV_HOST",
  "VITE_ANGULAR_DEV_PORT",
];
const missingKeys = requiredKeys.filter((key) => !env[key]?.trim());
if (missingKeys.length > 0) {
  throw new Error(`Missing environment variables: ${missingKeys.join(", ")}`);
}

const runtimeEnvironment = {
  apiBaseUrl: env.VITE_API_BASE_URL,
  msalAuthority: env.VITE_MSAL_AUTHORITY,
  msalClientId: env.VITE_MSAL_CLIENT_ID,
  msalTenantId: env.VITE_MSAL_TENANT_ID,
  msalApiScope: env.VITE_MSAL_API_SCOPE,
  redirectUri: env.VITE_ANGULAR_MSAL_REDIRECT_URI,
  reactBaseUrl: env.VITE_ANGULAR_REACT_BASE_URL,
  googleFontsUrl: env.VITE_GOOGLE_FONTS_URL,
};
await writeFile(
  path.join(projectRoot, "public", "runtime-config.js"),
  `window.__WINCAPTURE_ENV__ = ${JSON.stringify(runtimeEnvironment)};\n`,
  "utf8",
);

const [command, ...args] = process.argv.slice(2);
if (!command) {
  throw new Error("Specify an Angular CLI command.");
}

if (command === "serve") {
  args.push("--host", env.VITE_ANGULAR_DEV_HOST, "--port", env.VITE_ANGULAR_DEV_PORT);
}

const cliPath =
  command === "typecheck"
    ? path.join(projectRoot, "node_modules", "typescript", "bin", "tsc")
    : path.join(projectRoot, "node_modules", "@angular", "cli", "bin", "ng.js");
const cliArgs =
  command === "typecheck"
    ? ["--noEmit", "-p", "tsconfig.app.json"]
    : [command, ...args];
const child = spawn(process.execPath, [cliPath, ...cliArgs], {
  cwd: projectRoot,
  stdio: "inherit",
});
child.on("error", (error) => {
  console.error(`Could not start Angular ${command}: ${error.message}`);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
