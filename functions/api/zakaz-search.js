// Cloudflare Pages Function — proxies to stores-api.zakaz.ua
// Avoids CORS issues since this runs server-side on the edge

// Known Auchan store IDs by city
const AUCHAN_STORES = {
  kyiv:          '48201009',
  kyiv_north:    '48215611',
  dnipro:        '48215836',
  kharkiv:       '48215850',
  odesa:         '48216305',
  lviv:          '48221729',
};

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const q = url.searchParams.get('q') || '';
  const city = url.searchParams.get('city') || 'kyiv';
  const storeId = AUCHAN_STORES[city] || AUCHAN_STORES.kyiv;

  if (!q.trim()) {
    return new Response(JSON.stringify({ results: [] }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const apiUrl = `https://stores-api.zakaz.ua/stores/${storeId}/products/search/?q=${encodeURIComponent(q)}&page=1&per_page=3&lang=uk`;

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'application/json',
        'Accept-Language': 'uk-UA,uk;q=0.9',
        'Referer': 'https://auchan.zakaz.ua/',
      },
    });

    if (!response.ok) {
      throw new Error(`zakaz API returned ${response.status}`);
    }

    const data = await response.json();

    // Normalize response
    const results = (data.results || []).map((p) => ({
      id: p.ean || p.id || '',
      title: p.title || '',
      price: p.price ? (p.price / 100).toFixed(2) : null,
      image: p.img_url || p.image || null,
      unit: p.unit || '',
      url: `https://auchan.zakaz.ua/uk/products/${p.ean || p.id}/`,
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
        status: 200, // Return 200 so UI handles gracefully
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
}
