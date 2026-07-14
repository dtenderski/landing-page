---
name: Lucide Map icon naming conflict
description: Using `Map` from lucide-react without import alias crashes production with "Constructor Map requires 'new'"
---

## Rule
Always import the Lucide `Map` icon as `Map as MapIcon` (or any alias). Never use bare `{ Map }` from lucide-react.

**Why:** In esbuild production builds, if a JSX element uses `Map` without a proper local import binding, it resolves to the global built-in `Map` constructor. React then calls `Map(props)` without `new` → `TypeError: Constructor Map requires 'new'`. This crashes the ENTIRE app (blank screen in production), not just the component, because it happens during the initial React render tree.

**How to apply:** Any time `Map` from lucide-react is imported, alias it: `import { Map as MapIcon } from "lucide-react"`. This applies to ALL files. Files fixed: dashboard.tsx, App.tsx, iso-claw-14001.tsx, smap-claw.tsx, template-dialog.tsx.

**Dev vs Prod:** Vite dev server doesn't trigger this because it uses native ES modules without tree-shaking/minification. Production bundle (esbuild) does.
