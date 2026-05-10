// Cloudflare Pages Function — proxies to stores-api.zakaz.ua
// Avoids CORS issues since this runs server-side on the edge

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const q        = url.searchParams.get('q') || '';
  const storeId  = url.searchParams.get('storeId') || '';
  const chain    = url.searchParams.get('chain') || 'auchan';
  const perPage  = url.searchParams.get('per_page') || '10';
  const page     = url.searchParams.get('page') || '1';

  if (!q.trim() || !storeId) {
    return new Response(JSON.stringify({ results: [] }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // Map chain to its zakaz.ua subdomain for the Referer header
  const chainDomain = `${chain}.zakaz.ua`;

  try {
    const apiUrl = `https://stores-api.zakaz.ua/stores/${storeId}/products/search/?q=${encodeURIComponent(q)}&page=${page}&per_page=${perPage}&lang=uk`;

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'application/json',
        'Accept-Language': 'uk-UA,uk;q=0.9',
        'Referer': `https://${chainDomain}/`,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`zakaz API ${response.status}: ${body.slice(0, 300)}`);
    }

    const data = await response.json();

    const results = (data.results || []).map((p) => ({
      id: p.ean || p.sku || '',
      title: p.title || '',
      price: p.price ? (p.price / 100).toFixed(2) : null,
      image: p.img?.s350x350 || p.img?.s200x200 || p.img?.s150x150 || null,
      unit: p.unit || '',
      url: p.web_url ? p.web_url.replace('/en/', '/uk/') : `https://${chainDomain}/uk/products/${p.slug}--${p.ean}/`,
    }));

    return new Response(JSON.stringify({ results, storeId, count: data.count || 0 }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
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
