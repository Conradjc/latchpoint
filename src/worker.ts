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

/*
  Brand tokens, duplicated from src/styles/global.css as literals. Email cannot
  read CSS custom properties, and Gmail strips <style> blocks entirely, so every
  rule below has to be an inline attribute on the element it styles.
*/
const SLATE = '#1E3A5F';
const AMBER = '#F5A623';
const INK = '#111827';
const SUPPORT = '#6B7280';
const SURFACE = '#F8F9FA';

/**
 * Builds the notification email.
 *
 * The <meta charset> is the point: without it the en dash in a value like
 * "2–10" is decoded as latin-1 and renders as a replacement character. A bare
 * fragment has nowhere to declare encoding.
 *
 * Table-based rather than <dl> because Outlook's word-processor rendering
 * engine ignores <dl> margins, and a table is the one layout primitive every
 * mail client agrees on.
 */
function renderEmail(rows: readonly (readonly [string, string])[]): string {
  const cells = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:14px 0 0;font-family:Inter,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:${SUPPORT};">${escapeHtml(
            label,
          )}</td>
        </tr>
        <tr>
          <td style="padding:4px 0 0;font-family:Inter,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:${INK};">${escapeHtml(
            value,
          ).replace(/\n/g, '<br />')}</td>
        </tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>New systems audit request</title>
</head>
<body style="margin:0;padding:0;background:${SURFACE};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${SURFACE};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:${SLATE};padding:24px 28px;">
              <div style="font-family:Inter,'Segoe UI',Helvetica,Arial,sans-serif;font-size:20px;font-weight:600;color:#ffffff;letter-spacing:-.01em;">latchpoint</div>
              <div style="font-family:Inter,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:${AMBER};padding-top:4px;">New systems audit request</div>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 28px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${cells}</table>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #e5e7eb;padding:16px 28px;font-family:Inter,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;color:${SUPPORT};">
              Reply to this email to answer them directly.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
    const html = renderEmail(rows);

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
