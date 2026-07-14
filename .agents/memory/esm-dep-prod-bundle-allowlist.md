---
name: Pure-ESM deps must be in build.ts allowlist
description: Why an ESM-only dependency crashes the PRODUCTION boot with "(0, x.default) is not a function" but works fine in dev, and how to fix it.
---

# Pure-ESM dependency crashes prod boot, not dev

**Symptom:** Published app builds OK but fails to START (Promote/healthcheck 500, repeated). Deploy log shows a module-load `TypeError: (0 , <minified>.default) is not a function` inside `dist/index.cjs`. Dev (`npm run dev`) runs perfectly.

**Rule:** Any dependency that is a pure ESM package (`"type": "module"`, ESM-only `exports`) and is imported from server code MUST be added to the `allowlist` in `script/build.ts`. If it is left OUT of the allowlist it is treated as *external*, and esbuild compiles `import x from "pkg"` → `require("pkg")` + `.default`. `require()` of a pure-ESM module in the CJS production bundle yields an object whose `.default` is not the function → crash at module load / boot.

**Why dev hides it:** the dev server runs `tsx server/index.ts` (real ESM loader), so `import`/`await import()` of ESM works natively. Only the production `esbuild → CJS` bundle (`dist/index.cjs`) exercises the broken `require(ESM)` interop. So this class of bug is INVISIBLE in dev and only appears after publish.

**How to apply / diagnose:**
- Reproduce locally without a full `npm run build` (skip slow vite): run esbuild with the *exact* config from `script/build.ts` (platform node, format cjs, `external` = allDeps minus allowlist), output to a file INSIDE the workspace (so `node_modules` resolves), then `node -e "require('./that.cjs')"`. The real (unminified) error names the module: e.g. `import_p_limit.default is not a function` → the culprit is `p-limit`.
- Minified deploy names are unhelpful (`$pa`, `$Xy`); build UNMINIFIED to get the readable module name.
- Fix = add the package name to the `allowlist` array so esbuild INLINES its ESM (same as express-rate-limit, drizzle-orm, etc.). One-line change; no code edits needed.

**Gotcha:** don't chase the wrong module. The minified error can sit textually next to unrelated code (e.g. a SQL string), tempting you to blame a nearby module. Reproduce and read the UNMINIFIED symbol to confirm which import actually fails.
