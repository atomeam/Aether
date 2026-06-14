// URL Shortener API Handler
export async function handleURLShortener(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate short code
    const shortCode = Math.random().toString(36).substring(2, 8);
    const shortUrl = `https://short.a-to-mind.com/${shortCode}`;

    // Store in KV (in production)
    // await env.SHORT_URLS.put(shortCode, url);

    return new Response(JSON.stringify({
      success: true,
      shortUrl,
      shortCode,
      originalUrl: url,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
