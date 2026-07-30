# Latchpoint

The consulting site for Latchpoint LLC — [latchpoint.co](https://latchpoint.co).

A single static page. Brand, voice and section order come from
[`design-brief.md`](design-brief.md); build constraints come from
[`CLAUDE.md`](CLAUDE.md). Both are the source of truth — change them first, then
the code.

## Stack

- **Astro 7** — static output, zero JavaScript shipped to the browser
- **Tailwind CSS 4** — via `@tailwindcss/vite`, tokens declared as CSS variables
  in [`src/styles/global.css`](src/styles/global.css)
- **Fontsource** — Inter and JetBrains Mono self-hosted and bundled, so the page
  makes no third-party requests
- **Cloudflare Workers** static assets — no Worker script, no backend

## Develop

```bash
npm install
npm run dev          # http://localhost:4321
```

```bash
npm run build        # → dist/
npm run preview      # serve dist/ with Astro's preview server
npx wrangler dev     # runs the Worker too — needed to exercise the form
```

To test the form locally, create `.dev.vars` (gitignored) with
`INQUIRY_TO=you@example.com`. Under `wrangler dev` the email is not actually
sent — it is written to `.wrangler/tmp/email/` and the path is printed, so you
can read exactly what would have gone out.

## The inquiry form

The CTA is a questionnaire, not a calendar booking. It is a native form POST to
`/api/inquiry` handled by [`src/worker.ts`](src/worker.ts), so the page still
ships zero JavaScript. Submissions redirect to `/thanks/`, failures to
`/sorry/` — two static pages rather than one page branching on a query string,
because a prerendered build evaluates `Astro.url.searchParams` at build time
and cannot vary per request.

`run_worker_first` is scoped to `/api/*`, so every page and asset is served
straight from the asset store and never invokes the Worker.

**Email setup is a prerequisite and has a sharp edge — read the Inquiry form
section of [`CLAUDE.md`](CLAUDE.md) before touching Cloudflare email settings.**
Short version: onboard the domain to Email *Sending*; never enable Email
*Routing*, which would break the existing Google Workspace mail.

## Deploy

Deployment targets Cloudflare Workers static assets. Config lives in
[`wrangler.jsonc`](wrangler.jsonc).

### First time

```bash
npx wrangler whoami      # check auth; run `npx wrangler login` if needed
npm run deploy:check     # builds, then validates with --dry-run
npm run deploy           # builds and publishes
```

### Continuous deploys

In the Cloudflare dashboard, connect the `Conradjc/latchpoint` repo to the
Worker (Workers & Pages → the `latchpoint` Worker → Settings → Build). Use build
command `npm run build` and deploy command `npx wrangler deploy`. Pushes to
`main` then deploy automatically.

`.node-version` pins Node 24 for those builds. Astro 7 requires Node ≥ 22.12,
and a stale default build image is the most common cause of a first build
failing.

### Custom domain

Attach `latchpoint.co` and `www.latchpoint.co` to the Worker under Settings →
Domains & Routes. The domain's nameservers are already on Cloudflare, so DNS
records and certificates are provisioned automatically. Optionally add a
redirect rule sending `www` to the apex.

## Placeholders still to swap

| What | Where | Notes |
|---|---|---|
| `INQUIRY_TO` secret | Cloudflare | The form's destination inbox. Set with `npx wrangler secret put INQUIRY_TO`. Until it exists — and until `latchpoint.co` is onboarded to Email Sending — submissions land on `/sorry/`. See [`CLAUDE.md`](CLAUDE.md). |
| ~~`TODO_PORTAL_URL`~~ | — | **Done.** The header links to `https://projects.latchpoint.co`, which is live and gated by Cloudflare Access. Built in the separate `latchpoint-portal` repo. |
| `caleb@latchpoint.co` | not yet on the page | Waiting on Google Workspace. |
| Logo | [`src/components/Logo.astro`](src/components/Logo.astro), [`public/favicon.svg`](public/favicon.svg) | Placeholder mark — an open square latched shut at one corner. Refine later. |

## Notes

- **One CTA, repeated.** The brief allows exactly one call to action. Adding a
  second competing button is a regression, not a feature.
- **Never amber on white.** `#F5A623` on the light background is 1.9:1 and fails
  AA. Amber appears only on slate, where it is 5.7:1.
- The OG image at `public/og.png` is generated once by
  [`scripts/make-og.mjs`](scripts/make-og.mjs) and committed. Re-run
  `node scripts/make-og.mjs` only if the mark or tagline changes.
- **CCKennels** is a separate repo, temporarily destined for a subdomain here.
  Deploy it the same way and add `noindex` on any staging subdomain so it is not
  indexed under Latchpoint. `BaseLayout` already accepts a `noindex` prop.
