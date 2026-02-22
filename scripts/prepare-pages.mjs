import { copyFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const distDir = resolve("dist");
const indexFile = resolve(distDir, "index.html");
const fallbackFile = resolve(distDir, "404.html");
const noJekyllFile = resolve(distDir, ".nojekyll");

if (!existsSync(indexFile)) {
  throw new Error("dist/index.html lipseste. Ruleaza build-ul inainte de pregatirea pentru Pages.");
}

copyFileSync(indexFile, fallbackFile);
writeFileSync(noJekyllFile, "");
