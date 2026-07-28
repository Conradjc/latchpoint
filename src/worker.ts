/**
 * Handles the inquiry form. Everything except /api/* is served straight from
 * static assets and never reaches this Worker — see `run_worker_first` in
 * wrangler.jsonc — so this stays small and the site stays a static site.
 */

interface Env {
  ASSETS: Fetcher;
  EMAIL: SendEmail;
  /** Verified recipient. Set with `wrangler secret put INQUIRY_TO`. */
  INQUIRY_TO: string;
  /** Must be on a domain onboarded to Email Sending. */
  INQUIRY_FROM: string;
}

const FIELDS = [
  ['name', 'Name'],
  ['email', 'Email'],
  ['company', 'Company'],
  ['teamSize', 'Team size'],
  ['problem', "What's slowing them down"],
  ['tools', 'Tools in use'],
  ['timeline', 'Timeline'],
] as const;

/** Trim, cap length, and strip control characters before this reaches an email. */
function clean(value: FormDataEntryValue | null, max = 2000): string {
  if (typeof value !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max);
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

/** 303 so refreshing the destination does not repost the form. */
function redirect(path: string, origin: string): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: new URL(path, origin).toString() },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname !== '/api/inquiry') {
      return env.ASSETS.fetch(request);
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: { Allow: 'POST' },
      });
    }

    // Misconfiguration should be loud in the logs, not a silent bounce to the
    // error page that looks like a visitor's fault.
    if (!env.INQUIRY_TO || !env.INQUIRY_FROM) {
      console.error(
        'inquiry misconfigured: INQUIRY_TO and INQUIRY_FROM must both be set',
      );
      return redirect('/sorry/', url.origin);
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return redirect('/sorry/', url.origin);
    }

    /*
      Honeypot. Bots fill every field they find; this input is off-screen and
      aria-hidden, so a value here means it was not a person. Redirect to the
      success page rather than an error — a bot shown a rejection knows to
      retry, one shown success does not.
    */
    if (clean(form.get('website'), 100)) {
      return redirect('/thanks/', url.origin);
    }

    const email = clean(form.get('email'), 320);
    const problem = clean(form.get('problem'));

    // Mirrors the `required` attributes, because HTML validation is trivially
    // bypassed by anything that is not a browser.
    if (!email || !email.includes('@') || !problem) {
      return redirect('/sorry/', url.origin);
    }

    const rows = FIELDS.map(
      ([key, label]) => [label, clean(form.get(key))] as const,
    ).filter(([, v]) => v !== '');

    const company = rows.find(([l]) => l === 'Company')?.[1];

    const text = rows.map(([label, value]) => `${label}: ${value}`).join('\n\n');
    const html =
      '<h2>New systems audit request</h2><dl>' +
      rows
        .map(
          ([l, v]) =>
            `<dt><strong>${escapeHtml(l)}</strong></dt><dd>${escapeHtml(v)}</dd>`,
        )
        .join('') +
      '</dl>';

    try {
      await env.EMAIL.send({
        to: env.INQUIRY_TO,
        from: { email: env.INQUIRY_FROM, name: 'Latchpoint site' },
        // Lets you hit reply and reach them directly, while From stays on an
        // authenticated domain so the message is not spoofing the sender.
        replyTo: email,
        subject: company ? `Audit request — ${company}` : 'Audit request',
        text,
        html,
      });
    } catch (err) {
      console.error('inquiry send failed', err);
      return redirect('/sorry/', url.origin);
    }

    return redirect('/thanks/', url.origin);
  },
} satisfies ExportedHandler<Env>;
