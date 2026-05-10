// Cloudflare Pages Function — proxies to stores-api.zakaz.ua
// Avoids CORS issues since this runs server-side on the edge

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const q        = url.searchParams.get('q') || '';
  const storeId  = url.searchParams.get('storeId') || '';
  const chain    = url.searchParams.get('chain') || 'auchan';
  const perPage  = url.searchParams.get('per_page') || '6';

  if (!q.trim() || !storeId) {
    return new Response(JSON.stringify({ results: [] }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // Map chain to its zakaz.ua subdomain for the Referer header
  const chainDomain = `${chain}.zakaz.ua`;

  try {
    const apiUrl = `https://stores-api.zakaz.ua/stores/${storeId}/products/search/?q=${encodeURIComponent(q)}&page=1&per_page=${perPage}&lang=uk`;

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'application/json',
        'Accept-Language': 'uk-UA,uk;q=0.9',
        'Referer': `https://${chainDomain}/`,
      },
    });

    if (!response.ok) {
      throw new Error(`zakaz API returned ${response.status}`);
    }

    const data = await response.json();

    const results = (data.results || []).map((p) => ({
      id: p.ean || p.id || '',
      title: p.title || '',
      price: p.price ? (p.price / 100).toFixed(2) : null,
      image: p.img_url || p.image || null,
      unit: p.unit || '',
      url: `https://${chainDomain}/uk/products/${p.ean || p.id}/`,
    }));

    return new Response(JSON.stringify({ results, storeId }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ results: [], error: err.message }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
}
