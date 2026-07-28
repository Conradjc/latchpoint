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
npx wrangler dev     # serve dist/ the way Workers will, including 404 handling
```

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
| `TODO_CALENDAR_URL` | [`src/components/FooterCta.astro`](src/components/FooterCta.astro) | The CTA is an inert `<button>` until a Cal.com / Calendly link exists. Pass it as `href` to `CtaButton` and it becomes a link. The hero CTA needs no change — it scrolls to `#book`. |
| `TODO_PORTAL_URL` | [`src/components/PortalLink.astro`](src/components/PortalLink.astro) | The header "Project Portal" link renders as muted text marked *(soon)* until a destination exists. Pass `href` to `PortalLink` in [`Header.astro`](src/components/Header.astro) and it becomes a real link. |
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
