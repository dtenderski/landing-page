---
name: Navigating CTA buttons use Button asChild
description: How to render link/anchor CTAs styled as buttons without nested interactive elements.
---

# CTA buttons that navigate → use `Button asChild`

For a call-to-action that navigates (wouter `<Link>` or `<a href>`), render it as a **single** interactive element using shadcn's `asChild`:

```tsx
<Button asChild size="sm" variant="outline" className="...">
  <Link href="/packs" data-testid="btn-...">Layanan Jasa <ChevronRight/></Link>
</Button>
```

Do NOT nest `<Button>` inside `<Link>`/`<a>` (`<Link><Button/></Link>`).

**Why:** nesting button-inside-anchor is invalid HTML and degrades keyboard/screen-reader behavior; code review flags it. Much of the existing Gustafta selling-page code (produk.tsx enterprise card, credit packs, bottom CTAs) still uses the nested pattern — copy the `asChild` form for new CTAs instead of imitating the old one.

**How to apply:** put `data-testid` on the inner navigation element (the `<a>`/`<Link>`), not the `<Button>`. `Button` already supports `asChild` (Radix `Slot`) in `client/src/components/ui/button.tsx`.
