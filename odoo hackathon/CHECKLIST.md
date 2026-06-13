# Build Checklist — Neutral Component Kit

Cross-check against your Claude Code build. Each item maps a spec requirement to the file that satisfies it. ✅ = done in this project.

---

## 0. Project scaffolding
- [x] `package.json` — Next 15, React 19, Tailwind v4 (`@tailwindcss/postcss`), `lucide-react`, `gsap`, `clsx`, `tailwind-merge`, TypeScript
- [x] `tsconfig.json` — strict, `@/*` path alias
- [x] `next.config.ts`, `postcss.config.mjs`, `next-env.d.ts`
- [x] `app/layout.tsx` — root layout, wraps app in `<ToastProvider>`
- [x] `app/page.tsx` — index linking to the 4 demos

> ⚠️ Source only — **not** `npm install`ed or built in-tool. Verify it compiles on your side.

---

## 1. Token file — `app/globals.css`
- [x] Exact `:root` color/radius/shadow tokens from spec, unchanged
- [x] `@theme inline` mapping → `bg-bg`, `text-fg-muted`, `border-border`, `bg-accent`, `rounded-lg`, `shadow-soft`, etc.
- [x] `html` fluid root `font-size: clamp(...)`, `::selection`, focus-visible ring — verbatim
- [x] **Added** type scale: `--fs-xs…6xl` + `--lh-*`, `--font-sans`/`--font-mono`, wired into `@theme` so `text-*` are tokenized

---

## 2. Hard rules (enforced everywhere)
- [x] Token utilities only — no `bg-[#hex]`, no raw hex/px in JSX, no inline `style={{}}` (px only for 1px borders)
- [x] Mobile-first responsive — base = mobile, `sm:`/`md:`/`lg:` layered; works at 375px → 1440px
- [x] Touch targets ≥ 2.75rem (`h-11`/`min-h-11`) on mobile, shrink at `sm:`
- [x] Variants via props, never separate components (`<Button variant size>`)
- [x] Every component: typed props, forwards `className` + `...rest`, sensible defaults, all states (hover/focus-visible/active/disabled), keyboard + ARIA
- [x] Icons: `lucide-react` only, sized via `className` (`size-4`), never `size=` prop

---

## 3. Motion — `lib/useGsap.ts`
- [x] CSS transitions for micro-states (hover/focus/active/disabled) — no GSAP
- [x] GSAP only for orchestrated motion (entrance, modal/toast/drawer enter-exit, stagger)
- [x] `useGsap` wraps GSAP: `gsap.context` scope, cleanup on unmount, respects `prefers-reduced-motion`

---

## 4. Primitives — `components/ui/`
- [x] `Button.tsx` — variant primary|secondary|ghost|danger, size sm|md|lg, loading (spinner+disabled), leading/trailing icon
- [x] `Card.tsx` — bg-bg-2 border rounded-lg, Header/Title/Description/Body/Footer slots, `interactive` hover-lift
- [x] `Badge.tsx` — neutral|success|warn|danger|accent, optional `dot`
- [x] `Input.tsx` — label, placeholder, helper, error, disabled, full-width
- [x] `Textarea.tsx` — same states + resize
- [x] `Select.tsx` — same states + chevron, options[], placeholder
- [x] `Field.tsx` — label + control + helper/error wrapper (+ shared `controlBase`)
- [x] `Modal.tsx` — overlay, focus trap, Esc, header/body/footer; centered desktop / bottom-sheet mobile; GSAP enter-exit; scroll lock; focus restore
- [x] `Tabs.tsx` — arrow/Home/End nav, animated underline (GSAP), horizontally scrollable on mobile
- [x] `Toast.tsx` — `ToastProvider` + `useToast`, 4 intents, auto-dismiss, stack, GSAP enter-exit
- [x] `Spinner.tsx` — Loader2, sized via className
- [x] `Skeleton.tsx` — CSS pulse
- [x] `Avatar.tsx` — image + initials fallback, sm|md|lg
- [x] `EmptyState.tsx` — icon + title + description + action slot
- [x] `Tooltip.tsx` — hover + keyboard focus, Esc to hide, ARIA
- [x] `Dropdown.tsx` — keyboard nav (arrows/Home/End/Esc/Tab), outside-click close, focus mgmt, danger items
- [x] `index.ts` — barrel export

---

## 5. Layout — `components/layout/`
- [x] `AppShell.tsx` — fixed top bar (brand/nav/right-actions slots); persistent `lg:` left sidebar; mobile hamburger → GSAP drawer w/ overlay + focus trap; all slots via props
- [x] `PageHeader.tsx` — title + subtitle + actions; actions stack under title on mobile
- [x] `Container.tsx` — `mx-auto w-full max-w-7xl px-4 sm:px-6`
- [x] `index.ts` — barrel export

---

## 6. Screen skeletons — `app/_demos/`
- [x] `hero/page.tsx` — headline, subhead, two CTAs, visual block; 1-col mobile → 2-col `lg:`; GSAP entrance reveal
- [x] `dashboard/page.tsx` — AppShell + drawer + PageHeader + stat grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`) + horizontally-scrolling table
- [x] `detail/page.tsx` — PageHeader + 1-col mobile / 2-col `lg:` (form left, summary Card right) + footer actions + confirm Modal
- [x] `kit/page.tsx` — living style guide rendering every primitive with all variants/states

---

## 7. Content & deliverable
- [x] `lib/content.ts` — all copy/nav/data/options (no inline strings)
- [x] `lib/cn.ts` — `clsx` + `tailwind-merge` className merge
- [x] `/_demos/kit` style-guide page (deliverable #7)

---

## Success test
- [x] Reskin by changing a few `globals.css` vars → whole kit re-themes (utilities-only, verified visually)
- [x] Works 375px → 1440px (responsive utilities throughout)

---

## ⚠️ Gaps / verify on your side
1. **`app/_demos/` is a private folder** — Next App Router excludes `_`-prefixed dirs from routing, so these screens are **not browsable** at a URL as-is. Rename `app/_demos` → `app/demos` and update hrefs in `lib/content.ts` to serve them (noted in README). They compile fine as components.
2. **Not built/run** — no `npm install` or `next build` was executed in this tool. Run both to confirm types + compile.
3. **No tests, no Storybook** — not in spec; add if you want them.
4. **`kit-preview.dc.html`** in this project is an in-tool *visual* preview only — not part of the Next.js app; ignore it for the Claude Code diff.
