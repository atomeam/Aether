// Currency Converter API Handler
export async function handleCurrencyConverter(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { amount, from, to } = body;

    if (!amount || !from || !to) {
      return new Response(JSON.stringify({ error: 'amount, from, and to are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Use a free currency API
    const currencyApiUrl = `https://api.exchangerate-api.com/v4/latest/${from}`;

    const response = await fetch(currencyApiUrl);
    
    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch exchange rates' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const rate = data.rates[to];

    if (!rate) {
      return new Response(JSON.stringify({ error: 'Invalid currency code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const convertedAmount = amount * rate;

    return new Response(JSON.stringify({
      success: true,
      amount: parseFloat(amount),
      from,
      to,
      rate,
      convertedAmount: parseFloat(convertedAmount.toFixed(2)),
      date: data.date,
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
