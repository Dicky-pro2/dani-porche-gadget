// One-time fix for the Vercel Hobby plan limit of 12 serverless functions.
// Every .ts file inside api/ counts as a function, including the helpers in api/lib.
// This moves api/lib to server/ and updates every import and config that points to it.
// Run once from the project root:  node move-api-helpers.mjs
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const from = join(root, "api", "lib");
const to = join(root, "server");

if (!existsSync(from)) {
  console.error(
    "api/lib was not found. Run this from the project root, and only once.",
  );
  process.exit(1);
}

mkdirSync(to, { recursive: true });
for (const name of readdirSync(from))
  renameSync(join(from, name), join(to, name));
rmSync(from, { recursive: true });
console.log("moved api/lib -> server");

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

function rewrite(path, replacements) {
  if (!existsSync(path)) return;
  const original = readFileSync(path, "utf8");
  let updated = original;
  for (const [pattern, value] of replacements)
    updated = updated.replace(pattern, value);
  if (updated !== original) {
    writeFileSync(path, updated);
    console.log("updated", path.slice(root.length + 1).replace(/\\/g, "/"));
  }
}

const apiRoot = join(root, "api");
for (const file of listFiles(apiRoot).filter((name) => name.endsWith(".ts"))) {
  const depth = file.slice(apiRoot.length + 1).split(/[\\/]/).length - 1;
  const prefix = "../".repeat(depth + 1);
  rewrite(file, [[/(['"])(?:\.\.\/|\.\/)lib\//g, `$1${prefix}server/`]]);
}

const testsDir = join(root, "tests");
if (existsSync(testsDir)) {
  for (const file of listFiles(testsDir))
    rewrite(file, [[/\.\.\/api\/lib\//g, "../server/"]]);
}

rewrite(join(root, "tsconfig.node.json"), [
  [/("include":\s*\[[^\]]*"api")(?![^\]]*"server")/, '$1, "server"'],
]);
rewrite(join(root, "eslint.config.js"), [
  [
    /files: \['api\/\*\*\/\*\.ts'\]/,
    "files: ['api/**/*.ts', 'server/**/*.ts']",
  ],
]);

const remaining = listFiles(apiRoot).filter(
  (name) => /\.(ts|js|mjs|cjs)$/.test(name) && !name.endsWith(".d.ts"),
).length;
console.log(
  `Done. Serverless functions in api/: ${remaining} (Hobby limit is 12).`,
);
