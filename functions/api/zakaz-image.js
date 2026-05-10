// Proxies zakaz CDN images server-side to bypass hotlink protection.
// img.zakaz.ua blocks requests without a valid zakaz.ua Referer.

const ALLOWED_HOSTS = new Set([
  'img.zakaz.ua',
  'img2.zakaz.ua',
  'img3.zakaz.ua',
  'img4.zakaz.ua',
  'img5.zakaz.ua',
]);

const ALLOWED_CONTENT_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const src = url.searchParams.get('src');

  if (!src) return new Response('bad request', { status: 400 });

  let srcUrl;
  try {
    srcUrl = new URL(src);
  } catch {
    return new Response('bad request', { status: 400 });
  }

  if (srcUrl.protocol !== 'https:' || !ALLOWED_HOSTS.has(srcUrl.hostname)) {
    return new Response('forbidden', { status: 403 });
  }

  try {
    const res = await fetch(srcUrl.toString(), {
      headers: {
        'Referer': 'https://auchan.zakaz.ua/',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      },
    });

    if (!res.ok) {
      return new Response('not found', { status: 404 });
    }

    const contentType = (res.headers.get('content-type') || '').split(';')[0].trim();
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      return new Response('forbidden', { status: 403 });
    }

    return new Response(res.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('error', { status: 502 });
  }
}
