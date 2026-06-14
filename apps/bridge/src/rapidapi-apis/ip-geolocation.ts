/**
 * IP Geolocation API for RapidAPI
 * Single-purpose: Get geolocation data from IP address
 * Free tier: 100 requests/day
 * Pro tier: $5/month, 1,000 requests
 */

export interface IPGeolocationRequest {
  ip?: string;
}

export interface IPGeolocationResponse {
  ip: string;
  country: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export async function handleIPGeolocation(request: Request, cf: any): Promise<Response> {
  try {
    const { ip } = await request.json() as IPGeolocationRequest;
    
    // Use Cloudflare's built-in geolocation from request headers
    const clientIP = ip || cf?.cf?.colo || 'unknown';
    const country = cf?.cf?.country || 'Unknown';
    const city = cf?.cf?.city || 'Unknown';
    const region = cf?.cf?.region || 'Unknown';
    const latitude = cf?.cf?.latitude || 0;
    const longitude = cf?.cf?.longitude || 0;
    const timezone = cf?.cf?.timezone || 'UTC';
    
    const response: IPGeolocationResponse = {
      ip: clientIP,
      country,
      city,
      region,
      latitude,
      longitude,
      timezone,
    };
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  }
}
