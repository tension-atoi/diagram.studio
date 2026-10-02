#!/usr/bin/env node
/**
 * Vendor the two interface fonts into `public/fonts/`.
 *
 * The studio is a local app: no request may leave the machine at render time,
 * so the Google Fonts <link> tags are replaced by self-hosted woff2 files and
 * @font-face rules in globals.css. Re-run this script to refresh the files
 * after a family or weight change; it rewrites only the block it owns.
 */
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fontsDir = path.join(root, "public", "fonts");
const globalsPath = path.join(root, "src", "styles", "globals.css");
const BLOCK_START = "/* -- vendored fonts (scripts/vendor-fonts.mjs) -- */";
const BLOCK_END = "/* -- end vendored fonts -- */";

/** Matches what layout.tsx requested, so the swap is drop-in. */
const FAMILIES = [
  { name: "IBM Plex Mono", css: "IBM+Plex+Mono", weights: [400, 500, 600] },
  { name: "Space Grotesk", css: "Space+Grotesk", weights: [400, 500, 600, 700] },
];

/** Latin subset — covers both app languages, English and French. */
const LATIN_RANGE =
  "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, " +
  "U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, " +
  "U+2212, U+2215, U+FEFF, U+FFFD";

const query = FAMILIES.map(
  (family) => `family=${family.css}:wght@${family.weights.join(";")}`,
).join("&");
const stylesheetUrl = `https://fonts.googleapis.com/css2?${query}&display=swap`;

// A current browser UA is what makes Google serve woff2 instead of ttf.
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/131.0.0.0 Safari/537.36";

const response = await fetch(stylesheetUrl, { headers: { "user-agent": UA } });
if (!response.ok) {
  console.error(`vendor-fonts: Google Fonts answered ${response.status}`);
  process.exit(1);
}
const css = await response.text();

// Google prefixes each rule with `/* subset */`.
const blocks = [...css.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)]
  .filter(([, subset]) => subset === "latin")
  .map(([, , body]) => body);

if (blocks.length === 0) {
  console.error("vendor-fonts: no latin @font-face block in the response");
  process.exit(1);
}

// Google hands out a URL per weight even when every weight is the same
// variable file, so the grouping is done on content: a family is written once
// with a font-weight range instead of N byte-identical copies.
const bytesByUrl = new Map();
const familiesByUrl = new Map();
const byContent = new Map();

for (const body of blocks) {
  const family = /font-family:\s*'([^']+)'/.exec(body)?.[1];
  const weight = Number(/font-weight:\s*(\d+)/.exec(body)?.[1]);
  const url = /url\((https:[^)]+\.woff2)\)/.exec(body)?.[1];
  if (!family || !weight || !url) continue;

  let bytes = bytesByUrl.get(url);
  if (!bytes) {
    const asset = await fetch(url);
    if (!asset.ok) {
      console.error(`vendor-fonts: ${url} answered ${asset.status}`);
      process.exit(1);
    }
    bytes = Buffer.from(await asset.arrayBuffer());
    bytesByUrl.set(url, bytes);
  }

  const hash = createHash("sha256").update(bytes).digest("hex");
  const group = byContent.get(hash) ?? { family: familiesByUrl.get(url) ?? family, weights: new Set() };
  group.family = family;
  group.bytes = bytes;
  group.weights.add(weight);
  byContent.set(hash, group);
}

if (byContent.size === 0) {
  console.error("vendor-fonts: no usable woff2 source found in the response");
  process.exit(1);
}

await mkdir(fontsDir, { recursive: true });
// Everything here is generated: a stale file from an earlier family or weight
// would otherwise keep being served.
for (const file of await readdir(fontsDir)) {
  if (file.endsWith(".woff2")) await unlink(path.join(fontsDir, file));
}

const rules = [BLOCK_START];
let files = 0;

for (const { family, bytes, weights } of byContent.values()) {
  const slug = family.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const list = [...weights].sort((a, b) => a - b);
  const variable = list.length > 1;
  const file = variable ? `${slug}-variable.woff2` : `${slug}-${list[0]}.woff2`;

  await writeFile(path.join(fontsDir, file), bytes);
  files += 1;

  const span = variable ? `${list[0]} ${list[list.length - 1]}` : String(list[0]);
  rules.push(
    "@font-face {",
    `  font-family: '${family}';`,
    "  font-style: normal;",
    `  font-weight: ${span};`,
    "  font-display: swap;",
    `  src: url('/fonts/${file}') format('woff2');`,
    `  unicode-range: ${LATIN_RANGE};`,
    "}",
  );
}

rules.push(BLOCK_END);

// Replace only the block this script owns, leaving the rest of globals.css alone.
let globals = "";
try {
  globals = await readFile(globalsPath, "utf8");
} catch {
  console.error(`vendor-fonts: ${globalsPath} not found`);
  process.exit(1);
}
const start = globals.indexOf(BLOCK_START);
const end = globals.indexOf(BLOCK_END);
if (start !== -1 && end !== -1) {
  globals = globals.slice(0, start) + globals.slice(end + BLOCK_END.length + 1);
}
globals = `${globals.replace(/\s*$/, "")}\n\n${rules.join("\n")}\n`;
await writeFile(globalsPath, globals, "utf8");

console.log(`vendor-fonts: ${files} files → public/fonts/, @font-face written`);
