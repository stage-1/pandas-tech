#!/usr/bin/env node
// Reads docs/designsystem/tokens/tokens.panda.w3c.json (source of truth)
// and writes:
//   - docs/designsystem/v1Pandas.json   (alias-resolved, semantic-mapped)
//   - client/src/app/v1Pandas.css       (CSS variables for shadcn :root + .dark)
//
// Re-run after editing the W3C tokens. Auto-runs via predev/prebuild.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");

const SRC = resolve(repoRoot, "docs/designsystem/tokens/tokens.panda.w3c.json");
const OUT_JSON = resolve(repoRoot, "docs/designsystem/v1Pandas.json");
const OUT_CSS = resolve(repoRoot, "client/src/app/v1Pandas.css");
// When `:root`/`.dark` tokens change above, mirror the same hexes into
// `client/src/app/shop-theme-presets.css` under `[data-shop-theme="pandas"]`.

const BANNER_JSON = `"_generated": "DO NOT EDIT — generated from tokens.panda.w3c.json by client/scripts/build-tokens.mjs"`;
const BANNER_CSS = `/*
 * v1Pandas — DO NOT EDIT
 * Generated from docs/designsystem/tokens/tokens.panda.w3c.json
 * by client/scripts/build-tokens.mjs. Re-run via \`npm run build:tokens\`.
 */`;

const raw = JSON.parse(readFileSync(SRC, "utf8"));

// Recursively resolve {dot.path} aliases against the full tree.
const resolveValue = (val, root, seen = new Set()) => {
  if (typeof val !== "string") return val;
  const m = val.match(/^\{([^}]+)\}$/);
  if (!m) return val;
  const path = m[1];
  if (seen.has(path)) throw new Error(`Cyclic alias: ${path}`);
  seen.add(path);
  let node = root;
  for (const key of path.split(".")) {
    if (node == null || typeof node !== "object") return val;
    node = node[key];
  }
  if (node && typeof node === "object" && "$value" in node) {
    return resolveValue(node.$value, root, seen);
  }
  return node ?? val;
};

// Walk a token group and return { leafKey: resolvedValue } for primitive leaves.
const flatten = (group, root) => {
  const out = {};
  for (const [k, v] of Object.entries(group)) {
    if (k.startsWith("$")) continue;
    if (v && typeof v === "object" && "$value" in v) {
      out[k] = resolveValue(v.$value, root);
    } else if (v && typeof v === "object") {
      out[k] = flatten(v, root);
    }
  }
  return out;
};

const tokens = flatten(raw, raw);

// ---- Build v1Pandas semantic structure ----
// Map Panda tokens onto shadcn's semantic names. Light/dark variants come from
// the Mode group plus brand scales.
const C = tokens.color;

const lightShadcn = {
  background: tokens.mode.light.background,            // #F8F6F2 warm page
  foreground: tokens.mode.light.textPrimary,           // #141412
  card: C.surface.default,                             // #FFFFFF
  "card-foreground": C.text.primary,                   // #141412
  popover: C.surface.default,
  "popover-foreground": C.text.primary,
  primary: C.brand.red["600"],                         // #C01E1E Panda Red
  "primary-foreground": C.text.inverted,               // #F8F6F2
  secondary: C.brand.denim["600"],                     // #30597C
  "secondary-foreground": C.text.inverted,
  muted: C.surface.subtle,                             // #F0EDE8
  "muted-foreground": C.text.tertiary,                 // #706D66
  accent: C.brand.denim["50"],                         // #EDF2F8
  "accent-foreground": C.brand.denim["800"],           // #1A3650
  destructive: C.semantic.critical.icon,               // #C01E1E
  border: tokens.mode.light.borderBase,                // #E6E2DB
  input: C.border.default,
  ring: C.border.focus,                                // #E03535
  "chart-1": C.brand.red["600"],
  "chart-2": C.brand.denim["600"],
  "chart-3": C.semantic.medium.icon,                   // amber
  "chart-4": C.semantic.success.icon,                  // green
  "chart-5": C.brand.charcoal["400"],
  sidebar: C.surface.default,
  "sidebar-foreground": C.text.primary,
  "sidebar-primary": C.brand.red["600"],
  "sidebar-primary-foreground": C.text.inverted,
  "sidebar-accent": C.surface.subtle,
  "sidebar-accent-foreground": C.text.primary,
  "sidebar-border": C.border.default,
  "sidebar-ring": C.border.focus,
  radius: tokens.borderRadius.lg,                      // 8px → 0.5rem-ish
};

const darkShadcn = {
  background: tokens.mode.dark.background,             // #141412
  foreground: tokens.mode.dark.textPrimary,            // #F8F6F2
  card: tokens.mode.dark.surface,                      // #1C1B19
  "card-foreground": tokens.mode.dark.textPrimary,
  popover: tokens.mode.dark.surface,
  "popover-foreground": tokens.mode.dark.textPrimary,
  primary: C.brand.red["400"],                         // #E03535 brighter on dark
  "primary-foreground": C.brand.charcoal["900"],       // #141412
  secondary: C.brand.denim["400"],                     // #4E7FAD
  "secondary-foreground": C.brand.charcoal["900"],
  muted: C.brand.charcoal["800"],                      // #222120
  "muted-foreground": tokens.mode.dark.textMuted,      // #9A9790
  accent: C.brand.denim["800"],                        // #1A3650
  "accent-foreground": C.brand.denim["100"],           // #C7D8EC
  destructive: C.brand.red["400"],
  border: tokens.mode.dark.borderBase,                 // #35332F
  input: tokens.mode.dark.borderBase,
  ring: C.brand.red["400"],
  "chart-1": C.brand.red["400"],
  "chart-2": C.brand.denim["400"],
  "chart-3": C.semantic.medium.border,
  "chart-4": C.semantic.success.border,
  "chart-5": C.brand.charcoal["200"],
  sidebar: tokens.mode.dark.surface,
  "sidebar-foreground": tokens.mode.dark.textPrimary,
  "sidebar-primary": C.brand.red["400"],
  "sidebar-primary-foreground": C.brand.charcoal["900"],
  "sidebar-accent": C.brand.charcoal["800"],
  "sidebar-accent-foreground": tokens.mode.dark.textPrimary,
  "sidebar-border": tokens.mode.dark.borderBase,
  "sidebar-ring": C.brand.red["400"],
  radius: tokens.borderRadius.lg,
};

// ---- Write v1Pandas.json ----
const v1 = {
  _generated: "DO NOT EDIT — generated from tokens.panda.w3c.json by client/scripts/build-tokens.mjs",
  version: 1,
  source: "docs/designsystem/tokens/tokens.panda.w3c.json",
  modes: { light: lightShadcn, dark: darkShadcn },
  typography: tokens.typography,
  spacing: tokens.spacing,
  borderRadius: tokens.borderRadius,
  shadow: tokens.shadow,
  raw: tokens, // full resolved tree, in case other tools want it
};
mkdirSync(dirname(OUT_JSON), { recursive: true });
writeFileSync(OUT_JSON, JSON.stringify(v1, null, 2));

// ---- Write v1Pandas.css ----
const cssBlock = (selector, vars) => {
  const lines = Object.entries(vars).map(([k, v]) => `  --${k}: ${v};`);
  return `${selector} {\n${lines.join("\n")}\n}`;
};

const css = `${BANNER_CSS}\n\n${cssBlock(":root", lightShadcn)}\n\n${cssBlock(".dark", darkShadcn)}\n`;
mkdirSync(dirname(OUT_CSS), { recursive: true });
writeFileSync(OUT_CSS, css);

console.log(`✓ wrote ${OUT_JSON.replace(repoRoot, ".")}`);
console.log(`✓ wrote ${OUT_CSS.replace(repoRoot, ".")}`);
