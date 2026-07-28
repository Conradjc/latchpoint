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
- This repo deploys to **Cloudflare Workers static assets** (`wrangler.jsonc`, no Worker script) → auto-deploy on push to `main` via Workers Builds.
- Point apex `latchpoint.co` (+ `www`) at the deploy.
- **CCKennels (separate repo), temporary:** deploy that repo the same way, then either attach `cckennels.latchpoint.co` (subdomain) **or** just use its free preview URL until its real domain is ready.
- Add `noindex` on any temporary/staging subdomain so it isn't indexed under Latchpoint.

## Subdomain map — keep these distinct
| Host | What it is |
|---|---|
| `latchpoint.co` | This repo. The marketing site. |
| `projects.latchpoint.co` | **Client portal** (own repo, not yet built). Per-project pages: content, resources, updates. Linked from the header of this site. |
| `cckennels.latchpoint.co` | The **actual Coulee Country Kennels website**, temporarily hosted. Their site, not a page about the work. |

`cckennels.latchpoint.co` and `projects.latchpoint.co/cckennels` are two different
things for the same client — the site itself versus the project page about it.
Do not collapse them.

## Definition of done (v1)
- All 6 sections built, responsive, on-brand.
- Single CTA wired to `TODO_CALENDAR_URL`.
- Favicon + basic SEO meta (title, description, social preview image).
- `README.md` with dev / build / deploy steps.
- Deploys clean to `latchpoint.co`.

## Later (not now)
- Build the CCKennels site (its own repo).
- Build the client portal at `projects.latchpoint.co` — see below.
- Swap placeholders: calendar, portal, email, real logo.
- Analytics, extra pages, blog, case studies.

## Inquiry form — email setup

The CTA is a questionnaire that emails the submission, not a calendar booking.
Form posts to `/api/inquiry`, handled by `src/worker.ts`.

**Use Email SENDING. Never enable Email ROUTING on this domain.** The MX records
point at `smtp.google.com` — Google Workspace runs `caleb@latchpoint.co` and
`hello@latchpoint.co`. Email Routing replaces the apex MX records and, per
Cloudflare's own docs, "cannot be used with external mail servers." Turning it
on would take down business email immediately.

Email Sending is safe by comparison: it puts MX, SPF and DKIM on the
`cf-bounce.latchpoint.co` subdomain and uses the `cf-bounce._domainkey`
selector, which does not collide with `google._domainkey`. The one record it
touches on the apex is **DMARC** — check for an existing `_dmarc` record before
onboarding and merge rather than overwrite.

Setup, once:
1. Dashboard → **Compute & AI → Email Service → Email Sending → Onboard Domain**
   → `latchpoint.co`. (The `wrangler email sending` CLI commands return
   `Unauthorized [2036]` on a token from plain `wrangler login`.)
2. `npx wrangler secret put INQUIRY_TO` → the destination inbox. Kept out of the
   repo so it is not scraped from a public GitHub mirror.

**Free vs paid.** Sending to *arbitrary* recipients requires the Workers Paid
plan. Sending to a **verified destination address** in the account is free on
every plan. For the free path, verify the recipient with
`npx wrangler email routing addresses create <address>` and restrict the
binding in `wrangler.jsonc`:
`"send_email": [{ "name": "EMAIL", "destination_address": "<address>" }]`.
As of this writing the account has **no** verified destination addresses.

Spam control is a honeypot field only. If it starts leaking through, add
Turnstile — but note that costs the site its zero-JavaScript property.

## Client portal — decided, not yet built
Own repo, own Worker, own deploy. Kept separate from this site so a bad deploy
on one cannot take down the other, and so client content is never coupled to
marketing releases.

**Access is per project, not per site.** Some project pages are gated, others
are public-but-noindex — decided per client. Cloudflare Access supports this
with path-scoped applications on the free Zero Trust tier (up to 50 users),
with gated clients signing in via an emailed one-time code.

Two traps to avoid when configuring it:
- **Never create an Access application at the root of `projects.latchpoint.co`.**
  Paths with no explicit rule inherit their parent's, so a root policy silently
  locks every project, including the ones meant to be public.
- **`/client/*` does not match the bare `/client`.** Scope each gated project so
  the un-suffixed path is covered too, or that URL is served with no
  authentication at all. Verify by requesting the bare path in a private window
  before handing the link to a client.

Public-but-noindex pages need `noindex` in the markup — `robots.txt` asks
crawlers not to visit but does not stop a page that gets linked from being
indexed. `BaseLayout` in this repo already takes a `noindex` prop; mirror it.

---
*v1 shipped. See `README.md` for dev, build, and deploy steps.*
