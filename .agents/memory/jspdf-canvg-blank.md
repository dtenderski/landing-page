---
name: jspdf/canvg Vite blank screen
description: Dynamic import of jspdf pulls in canvg which imports core-js stubs that don't exist — Vite optimizeDeps crashes and the browser shows a blank page.
---

**Rule:** Always exclude `jspdf` and `canvg` from Vite's dependency optimization in `vite.config.ts`.

```ts
optimizeDeps: {
  exclude: ["jspdf", "canvg"],
}
```

**Why:** `jspdf` depends on `canvg`, which ships an ES module (`index.es.js`) that has `import 'core-js/modules/web.dom-collections.iterator.js'` baked in. These core-js stubs are stripped/absent in this project's node_modules. When Vite pre-bundles dependencies it hits this missing import and throws `Error: Error during dependency optimization`, which causes the entire React app to fail to render — blank white screen, no browser console error visible.

**How to apply:** Any time jspdf is added (even via dynamic `await import("jspdf")`), Vite still tries to pre-bundle it. Add both `jspdf` and `canvg` to `optimizeDeps.exclude`. This makes Vite skip pre-bundling them and use their native ESM form instead, which works fine at runtime.
