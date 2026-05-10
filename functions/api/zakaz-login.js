const VALID_CHAINS = new Set(['auchan', 'metro', 'novus', 'megamarket']);

export async function onRequestPost({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const { chain, phone, password } = body || {};

  if (typeof chain !== 'string' || !VALID_CHAINS.has(chain)) {
    return Response.json({ ok: false, error: 'invalid_chain' }, { status: 400 });
  }
  if (typeof phone !== 'string' || phone.length < 5 || phone.length > 100) {
    return Response.json({ ok: false, error: 'invalid_phone' }, { status: 400 });
  }
  if (typeof password !== 'string' || password.length < 1 || password.length > 256) {
    return Response.json({ ok: false, error: 'invalid_password' }, { status: 400 });
  }

  const normalized = phone.replace(/\D/g, '').replace(/^0/, '380');

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-chain': chain,
    'x-version': '65',
    'Origin': `https://${chain}.zakaz.ua`,
    'Referer': `https://${chain}.zakaz.ua/`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  // API requires `login` field (not `phone`). Try normalized and raw forms.
  const attempts = [
    { login: normalized, password },
    { login: phone.trim(), password },
  ];

  for (const credentials of attempts) {
    let res;
    try {
      res = await fetch('https://stores-api.zakaz.ua/user/login', {
        method: 'POST',
        headers,
        body: JSON.stringify(credentials),
      });
    } catch {
      continue;
    }

    if (!res.ok) continue;

    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch { /* not json */ }

    // Token in response body
    const bodyToken = data?.token || data?.access_token || data?.sessionid || data?.key;
    if (bodyToken) return Response.json({ ok: true, token: String(bodyToken) });

    // Read ALL Set-Cookie values — Cloudflare Workers may return them combined
    const rawCookie = res.headers.get('set-cookie');
    if (rawCookie) {
      // Try to extract zakaz session cookie
      const sidMatch = rawCookie.match(/(?:__Host-)?zakaz[_-]?sid=([^;,\s]+)/i);
      if (sidMatch?.[1]) return Response.json({ ok: true, token: sidMatch[1] });
      // Return entire cookie string as token — zakaz-cart.js knows how to use it
      return Response.json({ ok: true, token: `cookie:${rawCookie}` });
    }

    // Login succeeded but no token found — return whatever user_id we got for debugging
    if (data?.user_id) {
      return Response.json({ ok: false, error: 'no_token', hint: 'login_ok_no_cookie' }, { status: 401 });
    }

    // Unknown success format — continue to next attempt
  }

  return Response.json({ ok: false, error: 'auth_failed' }, { status: 401 });
}
