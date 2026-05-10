// Cloudflare Pages Function — proxies to stores-api.zakaz.ua
// Avoids CORS issues since this runs server-side on the edge

const VALID_CHAINS = new Set(['auchan', 'metro', 'novus', 'megamarket']);
const VALID_STORE_ID = /^\d{6,12}$/;

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const q       = url.searchParams.get('q') || '';
  const storeId = url.searchParams.get('storeId') || '';
  const chain   = url.searchParams.get('chain') || '';
  const perPage = Math.min(50, Math.max(1, parseInt(url.searchParams.get('per_page') || '10', 10)));
  const page    = Math.min(99, Math.max(1, parseInt(url.searchParams.get('page') || '1', 10)));

  if (!q.trim() || !storeId || !VALID_STORE_ID.test(storeId) || !VALID_CHAINS.has(chain)) {
    return jsonResponse({ results: [], count: 0 });
  }

  const chainDomain = `${chain}.zakaz.ua`;

  try {
    const apiUrl = `https://stores-api.zakaz.ua/stores/${storeId}/products/search/?q=${encodeURIComponent(q.slice(0, 200))}&page=${page}&per_page=${perPage}&lang=uk`;

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'application/json',
        'Accept-Language': 'uk-UA,uk;q=0.9',
        'Referer': `https://${chainDomain}/`,
      },
    });

    if (!response.ok) {
      throw new Error(`upstream_${response.status}`);
    }

    const data = await response.json();

    const results = (data.results || []).map((p) => ({
      id:    String(p.ean || p.sku || '').slice(0, 30),
      title: String(p.title || '').slice(0, 200),
      price: p.price ? (p.price / 100).toFixed(2) : null,
      image: p.img?.s350x350 || p.img?.s200x200 || p.img?.s150x150 || null,
      unit:  String(p.unit || '').slice(0, 30),
      url:   p.web_url ? p.web_url.replace('/en/', '/uk/') : `https://${chainDomain}/uk/products/${p.slug}--${p.ean}/`,
    }));

    return jsonResponse({ results, count: data.count || 0 }, { 'Cache-Control': 'no-store' });
  } catch {
    return jsonResponse({ results: [], count: 0, error: 'search_failed' });
  }
}

function jsonResponse(body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
}
