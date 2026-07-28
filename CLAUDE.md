# Latchpoint — Build Handoff (for VSCode / Claude Code)

## Context
- Latchpoint is a solo consultancy: AI workflow implementation for small/mid-sized businesses. This repo builds the **consulting site** at `latchpoint.co`.
- Brand, voice, colors, and page structure are already defined in **`design-brief.md`** (this repo). Treat it as the source of truth.
- `latchpoint.co` is secured. Business email + LLC are pending, so use the placeholders below.
- A **separate repo `cckennels`** (Coulee Country Kennels) is unrelated and will be hosted temporarily under a subdomain of latchpoint.co — see Hosting.

## Objective (v1)
Ship a fast, responsive, single-page consulting site from `design-brief.md`, deployed to `latchpoint.co`.

## Stack (recommended default)
- **Astro + Tailwind CSS**, static output. Fast (zero-JS by default), component-based, trivial to deploy to Cloudflare Pages / Netlify, and leaves room to grow into multiple pages + a blog.
- If you'd rather skip a build step for v1: a single `index.html` + Tailwind is fine. Don't over-engineer.
- No backend needed.

## Design tokens (from `design-brief.md` — implement as Tailwind theme / CSS vars)
- **Colors:** primary Slate `#1E3A5F` (dominant), accent Amber `#F5A623` (CTAs/highlights only), support Gray `#6B7280`, bg Off-White `#F8F9FA`, ink `#111827`
- **Fonts:** Inter (headings SemiBold, body Regular); JetBrains Mono for any code/mono bits
- **Rule:** never amber on white for body text — Slate dominates, Amber is the spark.

## Page sections (build in order — copy lives in the brief)
1. **Hero** — connection-gap headline, one-line subhead, single CTA "Book a free systems audit"
2. **Problem** — the gap: the tool got bought, nobody changed how they work
3. **What I do** — short audit → find 2–3 highest-value opportunities → implement at a fixed price
4. **Outcome** — "clients typically save 10+ hours/week within the first month"
5. **About** — founder-led, brief latchpoint story
6. **Footer CTA** — repeat the single CTA + calendar link

## Placeholders (mark clearly with TODO)
- Calendar link: `TODO_CALENDAR_URL` (Cal.com / Calendly)
- Contact email: `caleb@latchpoint.co` (Google Workspace not live yet)
- Logo: text wordmark "latchpoint" for now; intended mark = open square with one corner latching closed (interlocking L). Placeholder SVG is fine; refine later.

## Conventions / guardrails
- Mobile-first, responsive, accessible (semantic HTML, alt text, AA color contrast).
- Copy stays in brand voice: plain over clever, specific over vague, **no exclamation points**.
- One CTA only, repeated — no competing buttons.
- No stock handshakes or glowing-brain AI imagery.
- No secrets committed; no analytics for v1 (add later).
- Keep it a static build so it deploys clean to Pages/Netlify.

## Hosting / deploy
- Connect this repo to **Cloudflare Pages** or **Netlify** → auto-deploy on push to `main`.
- Point apex `latchpoint.co` (+ `www`) at the deploy.
- **CCKennels (separate repo), temporary:** deploy that repo the same way, then either attach `cckennels.latchpoint.co` (subdomain) **or** just use its free preview URL (`*.pages.dev` / `*.netlify.app`) until its real domain is ready.
- Add `noindex` on any temporary/staging subdomain so it isn't indexed under Latchpoint.

## Definition of done (v1)
- All 6 sections built, responsive, on-brand.
- Single CTA wired to `TODO_CALENDAR_URL`.
- Favicon + basic SEO meta (title, description, social preview image).
- `README.md` with dev / build / deploy steps.
- Deploys clean to `latchpoint.co`.

## Later (not now)
- Build the CCKennels site (its own repo).
- Swap placeholders: calendar, email, real logo.
- Analytics, extra pages, blog, case studies.

---
*v1 shipped. See `README.md` for dev, build, and deploy steps.*
