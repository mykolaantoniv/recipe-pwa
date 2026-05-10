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

  // Try multiple credential field names — zakaz.ua accepts both `phone` and `login`,
  // and some accounts use email. Mirror the BalanceBite approach.
  const attempts = [
    { phone: normalized, password },
    { login: normalized, password },
    { phone: phone.trim(), password },      // as entered, un-normalized
    { login: phone.trim(), password },
  ];

  for (const credentials of attempts) {
    try {
      const res = await fetch('https://stores-api.zakaz.ua/user/login', {
        method: 'POST',
        headers,
        body: JSON.stringify(credentials),
      });

      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch { /* not json */ }

      if (!res.ok) continue;

      // Token in response body
      const token = data?.token || data?.access_token || data?.sessionid || data?.key;
      if (token) return Response.json({ ok: true, token: String(token) });

      // Cookie-based session
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) {
        const sidMatch = setCookie.match(/(?:__Host-)?zakaz[_-]?sid=([^;,\s]+)/i);
        if (sidMatch?.[1]) return Response.json({ ok: true, token: sidMatch[1] });
        return Response.json({ ok: true, token: `cookie:${setCookie}` });
      }
    } catch { /* network error on this attempt, try next */ }
  }

  return Response.json({ ok: false, error: 'auth_failed' }, { status: 401 });
}
