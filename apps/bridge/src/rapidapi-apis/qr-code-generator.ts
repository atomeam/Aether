// QR Code Generator API Handler
export async function handleQRCodeGenerator(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { text, size = 200, color = '000000', backgroundColor = 'ffffff' } = body;

    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate QR code using a free API
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=${color}&bgcolor=${backgroundColor}`;

    // Fetch the QR code image
    const qrResponse = await fetch(qrApiUrl);
    
    if (!qrResponse.ok) {
      return new Response(JSON.stringify({ error: 'Failed to generate QR code' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const qrImage = await qrResponse.arrayBuffer();

    return new Response(qrImage, {
      headers: { 'Content-Type': 'image/png' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
