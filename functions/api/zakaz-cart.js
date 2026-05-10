// Adds products to zakaz.ua cart using the user's Bearer token.
// Token is extracted once via bookmarklet and stored in the app.

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { storeId, token, products, chain } = body;
  if (!storeId || !token || !Array.isArray(products) || products.length === 0) {
    return json({ error: 'Missing storeId, token, or products' }, 400);
  }

  const chainDomain = `${chain || 'auchan'}.zakaz.ua`;

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
        products: products.map(p => ({ ean: p.ean, quantity: p.quantity })),
        delivery: { type: 'pickup' },
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return json({ error: `zakaz cart API ${res.status}`, detail: data }, 200);
    }

    return json({ ok: true, cart: data });
  } catch (err) {
    return json({ error: err.message }, 200);
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
