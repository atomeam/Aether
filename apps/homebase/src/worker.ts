/**
 * Homebase Worker - Static Dashboard
 * 
 * Serves as the landing page for the Aether workspace.
 * Shows workspace status and links to其他 workers.
 */

const VERSION = '0.1.0';
const SERVICE = 'homebase';

// HTML Dashboard Template
function renderDashboard(status: any): string {
  const workers = `
    <div class="worker-card">
      <h3>🟢 aether</h3>
      <p class="role">Dispatcher</p>
      <p>Dispatches jobs to curator queue</p>
    </div>
    <div class="worker-card">
      <h3>🟢 aether-bridge</h3>
      <p class="role">Executor</p>
      <p>Consumes and executes queued jobs</p>
    </div>
    <div class="worker-card current">
      <h3>🏠 homebase</h3>
      <p class="role">Dashboard</p>
      <p>Static landing page (this worker)</p>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aether Workspace</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      color: #fff;
      padding: 2rem;
    }
    .container { max-width: 900px; margin: 0 auto; }
    header { text-align: center; margin-bottom: 3rem; }
    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .subtitle { opacity: 0.7; font-size: 1.1rem; }
    .workers { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }
    .worker-card {
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid rgba(255,255,255,0.1);
      transition: transform 0.2s;
    }
    .worker-card:hover { transform: translateY(-4px); }
    .worker-card.current { border-color: #4ade80; }
    .worker-card h3 { font-size: 1.2rem; margin-bottom: 0.5rem; }
    .role { 
      color: #4ade80; 
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }
    .worker-card p { opacity: 0.7; font-size: 0.9rem; }
    footer { text-align: center; margin-top: 3rem; opacity: 0.5; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🏛️ Aether Workspace</h1>
      <p class="subtitle">Connected multi-worker system</p>
      <p style="margin-top: 1rem; opacity: 0.5;">Version: ${VERSION}</p>
    </header>
    
    <div class="workers">
      ${workers}
    </div>
    
    <footer>
      <p>Aether Workspace &copy; ${new Date().getFullYear()}</p>
    </footer>
  </div>
</body>
</html>`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      });
    }

    // GET / - Dashboard
    if (path === '/' || path === '') {
      return new Response(renderDashboard({}), {
        headers: {
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // GET /health - Health check
    if (path === '/health') {
      return new Response(JSON.stringify({
        ok: true,
        service: SERVICE,
        version: VERSION,
        role: 'dashboard',
        ts: new Date().toISOString(),
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 404
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  },
};

interface Env {
  STATE: KVNamespace;
  _LOGS: R2Bucket;
}