// Adds products to zakaz.ua cart using the user's session token.
// Token is obtained via phone+password login and stored in the app.

const VALID_CHAINS  = new Set(['auchan', 'metro', 'novus', 'megamarket']);
const VALID_STORE   = /^\d{6,12}$/;
const VALID_EAN     = /^\d{8,14}$/;
const MAX_PRODUCTS  = 100;

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(context) });
  }
  if (context.request.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400, context);
  }

  const { storeId, token, products, chain } = body || {};

  // Input validation
  if (typeof storeId !== 'string' || !VALID_STORE.test(storeId)) {
    return json({ error: 'invalid_store' }, 400, context);
  }
  if (typeof chain !== 'string' || !VALID_CHAINS.has(chain)) {
    return json({ error: 'invalid_chain' }, 400, context);
  }
  if (typeof token !== 'string' || token.length < 20 || token.length > 4096) {
    return json({ error: 'invalid_token' }, 400, context);
  }
  if (!Array.isArray(products) || products.length === 0 || products.length > MAX_PRODUCTS) {
    return json({ error: 'invalid_products' }, 400, context);
  }
  for (const p of products) {
    if (typeof p?.ean !== 'string' || !VALID_EAN.test(p.ean)) {
      return json({ error: 'invalid_ean' }, 400, context);
    }
    const qty = Number(p?.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 999) {
      return json({ error: 'invalid_quantity' }, 400, context);
    }
  }

  const chainDomain = `${chain}.zakaz.ua`;
  const cookieHeader = token.startsWith('cookie:')
    ? token.slice(7)
    : `__Host-zakaz-sid=${token}`;

  try {
    const res = await fetch(`https://stores-api.zakaz.ua/cart/items/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-chain': chain,
        'x-version': '65',
        'Cookie': cookieHeader,
        'Referer': `https://${chainDomain}/`,
        'Origin': `https://${chainDomain}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        items: products.map(p => ({ ean: p.ean, amount: Number(p.quantity), operation: 'add' })),
      }),
    });

    let data = {};
    try { data = await res.json(); } catch { /* non-JSON response */ }

    if (!res.ok) {
      // Return generic error — don't expose upstream details
      return json({ error: 'cart_error', code: res.status }, 200, context);
    }

    return json({ ok: true, cart: data }, 200, context);
  } catch {
    return json({ error: 'network_error' }, 200, context);
  }
}

function corsHeaders(context) {
  const origin = context.request.headers.get('Origin') || '';
  const allowed = origin === 'https://reciply.pages.dev' || origin.startsWith('http://localhost');
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://reciply.pages.dev',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(body, status, context) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      ...corsHeaders(context),
    },
  });
}
