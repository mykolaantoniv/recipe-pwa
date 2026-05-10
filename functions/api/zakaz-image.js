// Proxies zakaz CDN images to bypass hotlink protection.
// img.zakaz.ua blocks requests without a valid zakaz.ua Referer.

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const src = url.searchParams.get('src');

  if (!src || !src.startsWith('https://img')) {
    return new Response('bad request', { status: 400 });
  }

  try {
    const res = await fetch(src, {
      headers: {
        'Referer': 'https://auchan.zakaz.ua/',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      },
    });

    if (!res.ok) {
      return new Response('not found', { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    return new Response(res.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new Response('error', { status: 500 });
  }
}
