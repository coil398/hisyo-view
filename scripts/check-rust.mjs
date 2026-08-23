#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const srcDir = join(root, "src-tauri/src");
const lib = readFileSync(join(srcDir, "lib.rs"), "utf8");

const cmds = [...lib.matchAll(/#\[tauri::command\]\s*(?:async\s+)?fn\s+(\w+)/g)].map((m) => m[1]);
const block = lib.match(/generate_handler!\[([\s\S]*?)\]/);
if (!block) {
  console.error("generate_handler がない");
  process.exit(1);
}
const handler = block[1]
  .split("\n")
  .map((l) => l.replace(/\/\/.*$/, "").trim().replace(/,$/, ""))
  .filter(Boolean);

const missing = handler.filter((h) => !cmds.includes(h));
const extra = cmds.filter((c) => !handler.includes(c));
if (missing.length || extra.length) {
  if (missing.length) console.error("ハンドラにあるのに関数がない:", missing.join(", "));
  if (extra.length) console.error("関数があるのにハンドラにない:", extra.join(", "));
  process.exit(1);
}
console.log(`commands ${cmds.length} = handler ${handler.length}`);

let hasFmt = true;
try {
  execSync("rustfmt --version", { stdio: "ignore" });
} catch {
  hasFmt = false;
  console.log("rustfmt なし。構文はスキップ");
}
if (hasFmt) {
  for (const name of readdirSync(srcDir).filter((f) => f.endsWith(".rs"))) {
    try {
      execSync(`rustfmt --edition 2021 --emit stdout ${join(srcDir, name)}`, {
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (e) {
      const err = `${e.stderr || ""}${e.stdout || ""}`;
      if (err.includes("error:")) {
        console.error(name, err.split("\n").slice(0, 8).join("\n"));
        process.exit(1);
      }
    }
  }
  console.log("rustfmt parse ok");
}

if (process.env.SKIP_CARGO === "1") {
  console.log("SKIP_CARGO");
  process.exit(0);
}

const cargo = (args) => {
  execSync(`cargo ${args}`, { cwd: join(root, "src-tauri"), stdio: "inherit" });
};

try {
  cargo("check");
  cargo("test");
} catch (e) {
  console.error("cargo が落ちた");
  process.exit(e.status || 1);
}
