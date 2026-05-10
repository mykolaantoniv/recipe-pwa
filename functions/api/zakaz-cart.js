// Adds products to zakaz.ua cart using the user's Bearer token.
// Token is extracted once via bookmarklet and stored in the app.

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

  try {
    const res = await fetch(`https://stores-api.zakaz.ua/stores/${storeId}/cart/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Referer': `https://${chainDomain}/`,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        'Accept-Language': 'uk-UA,uk;q=0.9',
        'Origin': `https://${chainDomain}`,
      },
      body: JSON.stringify({
        products: products.map(p => ({ ean: p.ean, quantity: Number(p.quantity) })),
        delivery: { type: 'pickup' },
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
