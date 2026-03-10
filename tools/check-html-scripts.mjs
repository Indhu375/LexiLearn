import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

function listHtmlFiles(rootDir) {
  const out = [];
  const stack = [rootDir];
  while (stack.length) {
    const dir = stack.pop();
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name === "node_modules" || ent.name === ".git") continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (ent.isFile() && ent.name.toLowerCase().endsWith(".html")) out.push(full);
    }
  }
  out.sort((a, b) => a.localeCompare(b));
  return out;
}

function extractInlineScripts(html) {
  // Lightweight extraction: skips <script src="..."> and captures inline content.
  // Not a full HTML parser, but good enough for well-formed pages.
  const scripts = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    const attrs = match[1] ?? "";
    const body = match[2] ?? "";
    if (/\bsrc\s*=/.test(attrs)) continue;
    const isModule = /\btype\s*=\s*["']module["']/i.test(attrs);
    scripts.push({ isModule, body });
  }
  return scripts;
}

function nodeCheck(tempFile) {
  const res = spawnSync(process.execPath, ["--check", tempFile], {
    encoding: "utf8",
    windowsHide: true,
  });
  return res;
}

function normalizeVmError(err) {
  const out = {
    name: err?.name || "Error",
    message: String(err?.message || err),
    stack: typeof err?.stack === "string" ? err.stack : "",
    line: null,
    column: null,
  };

  // Common stack snippet: "at <filename>:LINE:COL"
  const m = out.stack.match(/:(\d+):(\d+)\)?\s*$/m);
  if (m) {
    out.line = Number(m[1]);
    out.column = Number(m[2]);
  }
  return out;
}

function main() {
  const root = process.cwd();
  const files = listHtmlFiles(root);

  const tempDir = fs.mkdtempSync(path.join(root, ".tmp-syntax-"));
  let errorCount = 0;

  try {
    for (const file of files) {
      const html = fs.readFileSync(file, "utf8");
      const scripts = extractInlineScripts(html);
      for (let i = 0; i < scripts.length; i++) {
        const { isModule, body } = scripts[i];
        const label = `${path.relative(root, file)}:inline-script#${i + 1}:${isModule ? "module" : "classic"}`;
        const ext = isModule ? ".mjs" : ".js";
        const tempFile = path.join(tempDir, `${path.basename(file)}__${i + 1}${ext}`);
        fs.writeFileSync(tempFile, body, "utf8");

        const res = nodeCheck(tempFile);
        if (res.status === 0) continue;

        // `node --check` emits parse errors to stderr with "file:line" framing.
        const combined = `${res.stdout || ""}\n${res.stderr || ""}`.trim();
        errorCount++;

        let loc = "?:?";
        let msg = combined.replace(/\s+/g, " ").trim();
        const m = combined.match(/:(\d+)\s*\n/m);
        if (m) loc = `${m[1]}:?`;
        process.stdout.write(["JS_SYNTAX_ERROR", label, loc, "Error", msg].join("\t") + "\n");
      }
    }
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Best-effort cleanup.
    }
  }

  if (errorCount > 0) process.exitCode = 2;
}

main();
