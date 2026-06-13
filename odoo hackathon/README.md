# Neutral Kit

A responsive, reskinnable React component kit — **Next.js (App Router) + Tailwind v4 + TypeScript**, with `lucide-react` icons and GSAP for orchestrated motion.

> The whole kit is driven by CSS variables. Change a handful of tokens in `app/globals.css` and the entire system — color, type, radius, shadow — follows. One component tree, made responsive with Tailwind's `sm:` / `md:` / `lg:` utilities (no separate mobile/desktop components).

## Run it

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Reskin it

Open `app/globals.css` and edit the `:root` variables. Everything downstream re-themes automatically:

```css
:root {
  --accent: #6b8afd;   /* try #e0794b, #34d399, … */
  --radius: 0.5rem;    /* sharpen or round the whole kit */
  --bg: #0f1115;       /* or a light theme */

  --font-sans: "Inter", system-ui, sans-serif;  /* swap the typeface */
  --fs-base: 1.0625rem;                          /* nudge the whole scale up */
}
```

The `@theme inline` block maps those vars to Tailwind utilities (`bg-bg`, `text-fg-muted`, `border-border`, `bg-accent`, `rounded-lg`, `shadow-soft`, `text-sm`/`text-2xl`/…). Components only use those utilities — never raw hex or px (except 1px borders) — so a token swap is the only edit needed.

### Typography

Type is tokenized too. Each step in the scale is a size + line-height pair wired into Tailwind's `text-*` utilities, so the components inherit the scale automatically:

| Utility | `--fs-*` | line-height | typical use |
|---|---|---|---|
| `text-xs` | 0.75rem | 1.5 | captions, overlines |
| `text-sm` | 0.875rem | 1.5 | default UI text, labels |
| `text-base` | 1rem | 1.6 | body / prose |
| `text-lg` | 1.125rem | 1.55 | large body |
| `text-xl` | 1.25rem | 1.45 | card titles, lead |
| `text-2xl` | 1.5rem | 1.3 | section headings (PageHeader) |
| `text-3xl` | 1.875rem | 1.2 | page titles |
| `text-4xl` | 2.25rem | 1.15 | hero (mobile) |
| `text-5xl` / `text-6xl` | 3rem / 3.75rem | 1.05 / 1.0 | hero (desktop), display |

Sizes are in `rem`, so they ride the fluid root `font-size` on `html` (`clamp(0.9rem … 1.05rem)`) — the scale gently shrinks on small viewports and grows on large ones, no per-component media queries needed. Change `--font-sans` to swap the typeface, or any `--fs-*` / `--lh-*` to retune the scale. Weights use Tailwind defaults (`font-medium` 500, `font-semibold` 600).

## Structure

```
app/
  globals.css            # the design tokens (source of truth)
  layout.tsx             # wraps the app in <ToastProvider>
  page.tsx               # index → links to the demos
  _demos/
    hero/        page.tsx # marketing hero, GSAP entrance reveal
    dashboard/   page.tsx # AppShell + stat grid + responsive table
    detail/      page.tsx # two-column form + summary + footer actions
    kit/         page.tsx # living style guide — every primitive & state
components/
  ui/                    # Button, Card, Badge, Input, Textarea, Select, Field,
                         # Modal, Tabs, Toast, Spinner, Skeleton, Avatar,
                         # EmptyState, Tooltip, Dropdown  (+ index.ts barrel)
  layout/                # AppShell, PageHeader, Container
lib/
  cn.ts                  # className merge (clsx + tailwind-merge)
  useGsap.ts             # scoped GSAP hook (cleanup + prefers-reduced-motion)
  content.ts             # all demo copy / nav / data — no inline strings
```

## Conventions

- **Variants are props**, never separate components: `<Button variant="danger" size="lg" />`.
- **Icons** come from `lucide-react`, sized with a `className` utility (`size-4`) — never a `size=` prop.
- Every component forwards `className` + `...rest`, has typed props and sensible defaults, and covers hover / focus-visible / active / disabled states.
- Touch targets are ≥ `2.75rem` on mobile and may shrink at `sm:` and up.

## Motion split

- **CSS transitions** (Tailwind `transition-*`) handle micro-states: hover, focus, active, disabled.
- **GSAP** handles orchestrated motion only: hero entrance, modal / toast / drawer enter-exit, list stagger. All of it goes through `lib/useGsap.ts`, which scopes animations with `gsap.context` (auto-cleanup on unmount) and **respects `prefers-reduced-motion`** by skipping the animation entirely.

## A note on the `_demos` folder

Next.js App Router treats folders prefixed with `_` as **private** (excluded from routing). The demos live in `app/_demos/` per the kit spec as reference compositions. To make them directly browsable at `/demos/*`, rename the folder to `app/demos` and update the `href`s in `lib/content.ts`. They are otherwise complete, working screens built only from the primitives above.

## Preview

`kit-preview.dc.html` in this project is a static visual preview of the style guide (the components rendered with the same tokens) so you can eyeball the look without running the dev server.
```
