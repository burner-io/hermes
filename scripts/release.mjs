#!/usr/bin/env node
// Reproducible release script: run with `npm run release`.
// Verifies a clean tree, rebuilds/tests/typechecks, publishes to npm, then
// tags and pushes the release commit so the published version always maps
// to a reachable git ref.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

function run(cmd, args, opts = {}) {
  console.log(`\n$ ${cmd} ${args.join(" ")}`);
  execFileSync(cmd, args, { stdio: "inherit", ...opts });
}

function capture(cmd, args) {
  return execFileSync(cmd, args, { encoding: "utf8" }).trim();
}

const dryRun = process.argv.includes("--dry-run");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const tag = `v${pkg.version}`;

const status = capture("git", ["status", "--porcelain"]);
if (status) {
  console.error("Working tree is not clean. Commit or stash changes before releasing:\n" + status);
  process.exit(1);
}

const existingTags = capture("git", ["tag", "--list", tag]);
if (existingTags) {
  console.error(`Tag ${tag} already exists. Bump "version" in package.json first.`);
  process.exit(1);
}

run("npm", ["run", "check"]);
run("npm", ["pack", "--dry-run"]);

if (dryRun) {
  console.log("\n--dry-run passed: build, tests, and pack all succeeded. Nothing was published.");
  process.exit(0);
}

const publishArgs = ["publish"];
if (pkg.name.startsWith("@")) publishArgs.push("--access", "public");
run("npm", publishArgs);

run("git", ["tag", tag]);
run("git", ["push", "origin", "HEAD", tag]);

console.log(`\nPublished ${pkg.name}@${pkg.version} and pushed tag ${tag}.`);
