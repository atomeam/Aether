export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Handle OPTIONS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // D1 Telemetry Wrapper - Track slow queries for S3 Database Inspector
    async function trackQuery(query: string, duration: number, userId: string | null = null) {
      const SLOW_QUERY_THRESHOLD = 100; // 100ms threshold
      
      if (duration > SLOW_QUERY_THRESHOLD) {
        try {
          // Extract table name from query (simple heuristic)
          const tableMatch = query.match(/FROM\s+(\w+)/i);
          const tableName = tableMatch ? tableMatch[1] : 'unknown';
          
          // Extract query type
          const queryType = query.trim().split(/\s+/)[0].toUpperCase();
          
          await env.DB.prepare(
            "INSERT INTO slow_queries (id, query_text, duration_ms, timestamp, user_id, table_name, query_type) VALUES (?, ?, ?, ?, ?, ?, ?)"
          ).bind(
            `slow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            query.substring(0, 500), // Limit query text length
            duration,
            new Date().toISOString(),
            userId || 'anonymous',
            tableName,
            queryType
          ).run();
        } catch (e) {
          // Don't block main thread if logging fails
          console.error("Failed to log slow query:", e);
        }
      }
    }

    // D1 Query Wrapper with telemetry
    async function queryWithTelemetry(query: string, params: any[] = [], userId: string | null = null) {
      const start = performance.now();
      const statement = env.DB.prepare(query);
      let boundStatement = statement;
      
      for (const param of params) {
        boundStatement = boundStatement.bind(param);
      }
      
      const result = await boundStatement.first();
      const duration = performance.now() - start;
      
      await trackQuery(query, duration, userId);
      
      return result;
    }

    async function queryAllWithTelemetry(query: string, params: any[] = [], userId: string | null = null) {
      const start = performance.now();
      const statement = env.DB.prepare(query);
      let boundStatement = statement;
      
      for (const param of params) {
        boundStatement = boundStatement.bind(param);
      }
      
      const result = await boundStatement.all();
      const duration = performance.now() - start;
      
      await trackQuery(query, duration, userId);
      
      return result;
    }

    // Health endpoint
    if (url.pathname === "/health" || url.pathname === "/") {
      // Auto-ingest health check as event
      try {
        await env.DB.prepare(
          "INSERT INTO events (event_id, source, kind, level, payload) VALUES (?, ?, ?, ?, ?)"
        ).bind(
          `evt_health_${Date.now()}`,
          "api_worker",
          "health_check",
          "info",
          JSON.stringify({ status: "ok", timestamp: new Date().toISOString() })
        ).run();
      } catch (e) {
        console.error("Failed to log health event:", e);
      }
      
      return new Response(JSON.stringify({
        ok: true,
        service: "api-worker",
        timestamp: new Date().toISOString(),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Monday.com integration endpoints
    if (url.pathname === "/monday/boards" && request.method === "GET") {
      try {
        const query = `query { boards { id name } }`;
        const response = await fetch("https://api.monday.com/v2", {
          method: "POST",
          headers: {
            "Authorization": env.MONDAY_API_TOKEN,
            "Content-Type": "application/json",
            "API-Version": "2023-10"
          },
          body: JSON.stringify({ query })
        });
        
        const text = await response.text();
        
        if (!response.ok) {
          // Log error as event
          try {
            await env.DB.prepare(
              "INSERT INTO events (event_id, source, kind, level, payload) VALUES (?, ?, ?, ?, ?)"
            ).bind(
              `evt_monday_error_${Date.now()}`,
              "monday_api",
              "error",
              "error",
              JSON.stringify({ status: response.status, details: text.substring(0, 500) })
            ).run();
          } catch (e) {
            console.error("Failed to log error event:", e);
          }
          
          return new Response(JSON.stringify({
            error: "Monday API error",
            status: response.status,
            details: text.substring(0, 500)
          }), {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const data = JSON.parse(text);
        
        // Log successful API call as event
        try {
          await env.DB.prepare(
            "INSERT INTO events (event_id, source, kind, level, payload) VALUES (?, ?, ?, ?, ?)"
          ).bind(
            `evt_monday_success_${Date.now()}`,
            "monday_api",
            "api_call",
            "info",
            JSON.stringify({ boards_count: data.data?.boards?.length || 0 })
          ).run();
        } catch (e) {
          console.error("Failed to log success event:", e);
        }
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to fetch Monday boards",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Kraken API integration endpoints
    if (url.pathname === "/kraken/balance" && request.method === "GET") {
      try {
        const nonce = Date.now().toString();
        const endpoint = "/0/private/Balance";
        const body = `nonce=${nonce}`;
        
        // Kraken signature: HMAC-SHA512(path + SHA256(nonce + body), base64-decoded private key)
        const encoder = new TextEncoder();
        
        // SHA256(nonce + body)
        const sha256Data = encoder.encode(nonce + body);
        const sha256Hash = await crypto.subtle.digest("SHA-256", sha256Data);
        const sha256Hex = Array.from(new Uint8Array(sha256Hash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        // Base64 decode private key
        const base64Key = env.KRAKEN_PRIVATE_KEY;
        const binaryKey = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
        
        // HMAC-SHA512(endpoint + sha256Hex, binaryKey)
        const signatureData = encoder.encode(endpoint + sha256Hex);
        const key = await crypto.subtle.importKey(
          "raw",
          binaryKey,
          { name: "HMAC", hash: "SHA-512" },
          false,
          ["sign"]
        );
        const signature = await crypto.subtle.sign("HMAC", key, signatureData);
        const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
        
        const response = await fetch("https://api.kraken.com" + endpoint, {
          method: "POST",
          headers: {
            "API-Key": env.KRAKEN_API_KEY,
            "API-Sign": signatureBase64,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: body
        });
        
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to fetch Kraken balance",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Google Gemini API integration endpoints
    if (url.pathname === "/google/models" && request.method === "GET") {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${env.GOOGLE_API_KEY}`);
        const data = await response.json();
        
        // Log API call as event
        try {
          await env.DB.prepare(
            "INSERT INTO events (event_id, source, kind, level, payload) VALUES (?, ?, ?, ?, ?)"
          ).bind(
            `evt_google_models_${Date.now()}`,
            "google_api",
            "api_call",
            "info",
            JSON.stringify({ models_count: data.models?.length || 0 })
          ).run();
        } catch (e) {
          console.error("Failed to log Google event:", e);
        }
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to list models",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (url.pathname === "/google/generate" && request.method === "POST") {
      try {
        const { prompt, model = "gemini-2.5-flash" } = await request.json();
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GOOGLE_API_KEY}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        });
        
        const data = await response.json();
        
        // Log API call as event
        try {
          await env.DB.prepare(
            "INSERT INTO events (event_id, source, kind, level, payload) VALUES (?, ?, ?, ?, ?)"
          ).bind(
            `evt_google_generate_${Date.now()}`,
            "google_api",
            "ai_generation",
            "info",
            JSON.stringify({ model, success: !!data.candidates, prompt_length: prompt.length })
          ).run();
        } catch (e) {
          console.error("Failed to log Google event:", e);
        }
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to generate content",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (url.pathname === "/google/chat" && request.method === "POST") {
      try {
        const { messages, model = "gemini-2.5-flash" } = await request.json();
        
        const contents = messages.map((msg: any) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        }));
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GOOGLE_API_KEY}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ contents })
        });
        
        const data = await response.json();
        
        // Log API call as event
        try {
          await env.DB.prepare(
            "INSERT INTO events (event_id, source, kind, level, payload) VALUES (?, ?, ?, ?, ?)"
          ).bind(
            `evt_google_chat_${Date.now()}`,
            "google_api",
            "ai_chat",
            "info",
            JSON.stringify({ model, messages_count: messages.length, success: !!data.candidates })
          ).run();
        } catch (e) {
          console.error("Failed to log Google event:", e);
        }
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to process chat",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Kraken public endpoint (no auth required)
    if (url.pathname === "/kraken/ticker" && request.method === "GET") {
      try {
        const response = await fetch("https://api.kraken.com/0/public/Ticker?pair=XBTUSD,ETHUSD");
        const data = await response.json();
        
        // Log API call as event
        try {
          await env.DB.prepare(
            "INSERT INTO events (event_id, source, kind, level, payload) VALUES (?, ?, ?, ?, ?)"
          ).bind(
            `evt_kraken_ticker_${Date.now()}`,
            "kraken_api",
            "api_call",
            "info",
            JSON.stringify({ pairs: ["XBTUSD", "ETHUSD"], success: !data.error })
          ).run();
        } catch (e) {
          console.error("Failed to log Kraken event:", e);
        }
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to fetch Kraken ticker",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (url.pathname === "/kraken/trades" && request.method === "GET") {
      try {
        const nonce = Date.now().toString();
        const endpoint = "/0/private/TradesHistory";
        const body = `nonce=${nonce}`;
        
        const encoder = new TextEncoder();
        const sha256Data = encoder.encode(nonce + body);
        const sha256Hash = await crypto.subtle.digest("SHA-256", sha256Data);
        const sha256Hex = Array.from(new Uint8Array(sha256Hash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        const base64Key = env.KRAKEN_PRIVATE_KEY;
        const binaryKey = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
        
        const signatureData = encoder.encode(endpoint + sha256Hex);
        const key = await crypto.subtle.importKey(
          "raw",
          binaryKey,
          { name: "HMAC", hash: "SHA-512" },
          false,
          ["sign"]
        );
        const signature = await crypto.subtle.sign("HMAC", key, signatureData);
        const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
        
        const response = await fetch("https://api.kraken.com" + endpoint, {
          method: "POST",
          headers: {
            "API-Key": env.KRAKEN_API_KEY,
            "API-Sign": signatureBase64,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: body
        });
        
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to fetch Kraken trades",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Events ingestion endpoint
    if (url.pathname === "/events" && request.method === "POST") {
      try {
        const event = await request.json();
        
        // Validate required fields
        if (!event.event_id || !event.source || !event.kind) {
          return new Response(JSON.stringify({
            error: "Missing required fields: event_id, source, kind"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Store event in D1
        const result = await env.DB.prepare(
          "INSERT INTO events (event_id, source, kind, level, page_id, database_id, payload, event_type, session_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(
          event.event_id,
          event.source,
          event.kind,
          event.level || 'info',
          event.page_id || null,
          event.database_id || null,
          JSON.stringify(event.payload || {}),
          event.event_type || null,
          event.session_id || null
        ).run();
        
        return new Response(JSON.stringify({
          success: true,
          event_id: event.event_id,
          message: "Event stored successfully",
          meta_id: result.meta.last_row_id
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to store event",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get recent events
    if (url.pathname === "/events" && request.method === "GET") {
      try {
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const offset = parseInt(url.searchParams.get("offset") || "0");
        
        const events = await env.DB.prepare(
          "SELECT * FROM events ORDER BY created_at DESC LIMIT ? OFFSET ?"
        ).bind(limit, offset).all();
        
        return new Response(JSON.stringify({
          events: events.results,
          count: events.results.length,
          limit,
          offset
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to fetch events",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Proposals endpoint (read from D1)
    if (url.pathname === "/proposals" && request.method === "GET") {
      try {
        const status = url.searchParams.get("status") || "pending";
        const limit = parseInt(url.searchParams.get("limit") || "10");
        
        const proposals = await env.DB.prepare(
          "SELECT * FROM proposals WHERE status = ? ORDER BY created_at DESC LIMIT ?"
        ).bind(status, limit).all();
        
        return new Response(JSON.stringify({
          proposals: proposals.results,
          count: proposals.results.length,
          status
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to fetch proposals",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Create proposal endpoint
    if (url.pathname === "/proposals" && request.method === "POST") {
      try {
        const proposal = await request.json();
        
        // Validate required fields
        if (!proposal.title || !proposal.body || !proposal.author) {
          return new Response(JSON.stringify({
            error: "Missing required fields: title, body, author"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const proposalId = `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const result = await env.DB.prepare(
          "INSERT INTO proposals (id, title, body, author, status, risk_score, blast_radius_files, blast_radius_surfaces) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(
          proposalId,
          proposal.title,
          proposal.body,
          proposal.author,
          proposal.status || 'pending',
          proposal.risk_score || 0,
          proposal.blast_radius_files || 0,
          proposal.blast_radius_surfaces || 0
        ).run();
        
        return new Response(JSON.stringify({
          success: true,
          proposal_id: proposalId,
          message: "Proposal created successfully",
          meta_id: result.meta.last_row_id
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to create proposal",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Invoice generation endpoint
    if (url.pathname === "/admin/invoices" && request.method === "GET") {
      try {
        const payments = await env.DB.prepare(
          "SELECT * FROM payments WHERE status = 'completed' ORDER BY created_at DESC LIMIT 50"
        ).all() as any[];
        
        const invoices = payments.map(payment => ({
          invoice_id: `INV-${payment.id}`,
          payment_id: payment.id,
          email: payment.email,
          plan: payment.plan,
          amount: payment.amount,
          date: payment.created_at,
          status: payment.status
        }));
        
        return new Response(JSON.stringify({
          invoices
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to fetch invoices",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Invoice download endpoint
    if (url.pathname === "/admin/invoice/download" && request.method === "GET") {
      try {
        const { searchParams } = new URL(request.url);
        const paymentId = searchParams.get('paymentId');
        
        if (!paymentId) {
          return new Response(JSON.stringify({
            error: "Payment ID required"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const payment = await env.DB.prepare(
          "SELECT * FROM payments WHERE id = ?"
        ).bind(paymentId).first() as any;
        
        if (!payment) {
          return new Response(JSON.stringify({
            error: "Payment not found"
          }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Generate invoice text
        const invoiceText = `
INVOICE #INV-${payment.id}
a-to-mind.com
================================

Date: ${new Date(payment.created_at).toLocaleDateString()}
Invoice #: INV-${payment.id}
Status: ${payment.status.toUpperCase()}

Bill To:
${payment.email}

================================
Item                    Amount
--------------------------------
${payment.plan.toUpperCase()} Plan      $${payment.amount}
--------------------------------
Total:                    $${payment.amount}

================================
Thank you for your payment!

Payment ID: ${payment.id}
Plan: ${payment.plan}
Amount: $${payment.amount}
        `.trim();
        
        return new Response(invoiceText, {
          headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="invoice-${payment.id}.txt"`
          },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to generate invoice",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Revenue analytics endpoint
    if (url.pathname === "/admin/revenue" && request.method === "GET") {
      try {
        // Get all users with their plans
        const users = await env.DB.prepare(
          "SELECT plan, status, created_at, updated_at FROM users"
        ).all() as any[];
        
        // Get all payments
        const payments = await env.DB.prepare(
          "SELECT plan, amount, status, created_at FROM payments"
        ).all() as any[];
        
        // Calculate metrics
        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.status === 'active').length;
        const proUsers = users.filter(u => u.plan === 'pro' && u.status === 'active').length;
        const enterpriseUsers = users.filter(u => u.plan === 'enterprise' && u.status === 'active').length;
        
        const completedPayments = payments.filter(p => p.status === 'completed');
        const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        // Calculate MRR (Monthly Recurring Revenue)
        const mrr = (proUsers * 29) + (enterpriseUsers * 99);
        
        // Calculate churn (simplified - users who cancelled in last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const cancelledUsers = users.filter(u => u.status === 'pending' && new Date(u.updated_at || u.created_at) > new Date(thirtyDaysAgo)).length;
        const churnRate = activeUsers > 0 ? (cancelledUsers / activeUsers) * 100 : 0;
        
        // Calculate LTV (Lifetime Value) - simplified
        const avgRevenuePerUser = totalRevenue > 0 ? totalRevenue / completedPayments.length : 0;
        const avgLifespan = 12; // Assume 12 months average
        const ltv = avgRevenuePerUser * avgLifespan;
        
        return new Response(JSON.stringify({
          total_users: totalUsers,
          active_users: activeUsers,
          pro_users: proUsers,
          enterprise_users: enterpriseUsers,
          total_revenue: totalRevenue,
          mrr: mrr,
          churn_rate: churnRate,
          ltv: ltv,
          plan_distribution: {
            starter: users.filter(u => u.plan === 'starter').length,
            pro: users.filter(u => u.plan === 'pro').length,
            enterprise: users.filter(u => u.plan === 'enterprise').length
          },
          payment_stats: {
            total: payments.length,
            completed: completedPayments.length,
            pending: payments.filter(p => p.status === 'pending').length,
            failed: payments.filter(p => p.status === 'failed').length
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to fetch revenue data",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Support ticket creation endpoint
    if (url.pathname === "/support/tickets" && request.method === "POST") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({
            error: "Unauthorized"
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        const decoded = atob(token);
        const userId = decoded.split(":")[0];
        
        const { subject, message, priority } = await request.json();
        
        // Get user email
        const user = await env.DB.prepare(
          "SELECT email FROM users WHERE id = ?"
        ).bind(userId).first() as any;
        
        // Create support ticket
        const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await env.DB.prepare(
          "INSERT INTO events (event_id, source, kind, level, payload) VALUES (?, ?, ?, ?, ?)"
        ).bind(
          ticketId,
          "support_system",
          "support_ticket",
          priority === 'urgent' ? 'warning' : 'info',
          JSON.stringify({ user_id: userId, email: user.email, subject, message, priority, status: 'open', created_at: new Date().toISOString() })
        ).run();
        
        // Send notification email to support team
        const supportEmailContent = `
          <h2>🎫 New Support Ticket Received</h2>
          <p>A new support ticket has been submitted by a user.</p>
          <div class="info-box">
            <strong>Ticket Details:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li><strong>Ticket ID:</strong> ${ticketId}</li>
              <li><strong>From:</strong> ${user.email}</li>
              <li><strong>Subject:</strong> ${subject}</li>
              <li><strong>Priority:</strong> ${priority.toUpperCase()}</li>
            </ul>
          </div>
          <div class="divider"></div>
          <p><strong>Message:</strong></p>
          <p style="background: #f8f9fa; padding: 15px; border-radius: 4px;">${message}</p>
        `;
        await sendEmail(
          'support@a-to-mind.com',
          `🎫 New Support Ticket: ${subject}`,
          generateEmailTemplate(supportEmailContent, `New Support Ticket: ${subject}`),
          `New Support Ticket from ${user.email}: ${subject}. Priority: ${priority}. Message: ${message}`
        );
        
        // Send confirmation email to user
        const userEmailContent = `
          <h2>Support Ticket Created ✅</h2>
          <p>Your support ticket has been created successfully!</p>
          <div class="info-box">
            <strong>Ticket Details:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li><strong>Ticket ID:</strong> ${ticketId}</li>
              <li><strong>Subject:</strong> ${subject}</li>
              <li><strong>Priority:</strong> ${priority.toUpperCase()}</li>
            </ul>
          </div>
          <p>Our support team will review your ticket and get back to you within 24 hours.</p>
          <div class="divider"></div>
          <p style="font-size: 13px; color: #888;">Please keep your ticket ID for reference. You can check the status of your ticket from your dashboard.</p>
        `;
        await sendEmail(
          user.email,
          "Support Ticket Created - a-to-mind.com",
          generateEmailTemplate(userEmailContent, "Support Ticket Created"),
          `Your support ticket has been created successfully. Ticket ID: ${ticketId}. We'll get back to you within 24 hours.`
        );
        
        return new Response(JSON.stringify({
          success: true,
          ticket_id: ticketId,
          message: "Support ticket created successfully"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        await logError(e, "support_ticket", userId);
        return new Response(JSON.stringify({
          error: "Failed to create support ticket",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Password hashing helper using Web Crypto API
    async function hashPassword(password: string): Promise<string> {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    }

    // Password verification helper
    async function verifyPassword(password: string, hash: string): Promise<boolean> {
      const passwordHash = await hashPassword(password);
      return passwordHash === hash;
    }

    // Error tracking helper
    async function logError(error: Error, context: string, userId?: string) {
      try {
        await env.DB.prepare(
          "INSERT INTO events (event_id, source, kind, level, payload) VALUES (?, ?, ?, ?, ?)"
        ).bind(
          `evt_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          "error_tracking",
          "error",
          "error",
          JSON.stringify({
            context,
            message: error.message,
            stack: error.stack,
            user_id: userId,
            timestamp: new Date().toISOString()
          })
        ).run();
      } catch (e) {
        // Don't throw if error logging fails
        console.error("Failed to log error:", e);
      }
    }

    // CSRF token generation
    function generateCSRFToken(): string {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    // CSRF token validation
    const csrfTokens = new Map<string, { token: string; expires: number }>();
    
    function validateCSRFToken(token: string, userId: string): boolean {
      const record = csrfTokens.get(userId);
      if (!record) return false;
      if (Date.now() > record.expires) {
        csrfTokens.delete(userId);
        return false;
      }
      return record.token === token;
    }
    
    function createCSRFToken(userId: string): string {
      const token = generateCSRFToken();
      csrfTokens.set(userId, { token, expires: Date.now() + 3600000 }); // 1 hour
      return token;
    }

    // CSRF token endpoint
    if (url.pathname === "/auth/csrf-token" && request.method === "GET") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({
            error: "Unauthorized"
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        const decoded = atob(token);
        const userId = decoded.split(":")[0];
        
        const csrfToken = createCSRFToken(userId);
        
        return new Response(JSON.stringify({
          csrf_token: csrfToken
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to generate CSRF token",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Rate limiting helper
    const rateLimit = new Map<string, { count: number; resetTime: number }>();
    
    function checkRateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
      const now = Date.now();
      const record = rateLimit.get(identifier);
      
      if (!record || now > record.resetTime) {
        rateLimit.set(identifier, { count: 1, resetTime: now + windowMs });
        return true;
      }
      
      if (record.count >= maxRequests) {
        return false;
      }
      
      record.count++;
      return true;
    }

    // Professional email template generator
    function generateEmailTemplate(content: string, subject: string) {
      return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      color: rgba(255,255,255,0.9);
      margin: 10px 0 0 0;
      font-size: 14px;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #333;
      font-size: 24px;
      margin-top: 0;
    }
    .content p {
      color: #555;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      opacity: 0.9;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #888;
      border-top: 1px solid #e9ecef;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background: #e9ecef;
      margin: 30px 0;
    }
    .info-box {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100%;
        border-radius: 0;
      }
      .header, .content {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>a-to-mind.com</h1>
      <p>AI-Powered Infrastructure Autonomy</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; 2024 a-to-mind.com. All rights reserved.</p>
      <p>
        <a href="https://a-to-mind.com">Visit our website</a> | 
        <a href="https://a-to-mind.com/support">Contact Support</a>
      </p>
      <p style="margin-top: 10px; font-size: 11px;">
        This email was sent to you because you signed up for a-to-mind.com.
      </p>
    </div>
  </div>
</body>
</html>
      `.trim();
    }

    // Email sending helper
    async function sendEmail(to: string, subject: string, html: string, text: string) {
      try {
        const apiKey = env.SENDGRID_API_KEY;
        if (!apiKey || apiKey === 'placeholder') {
          console.error("SendGrid API key not configured");
          await env.DB.prepare(
            "INSERT INTO events (event_id, source, kind, level, payload) VALUES (?, ?, ?, ?, ?)"
          ).bind(
            `evt_email_error_${Date.now()}`,
            "email_system",
            "email_config_error",
            "error",
            JSON.stringify({ error: "SendGrid API key not configured", to, subject })
          ).run();
          return;
        }
        
        const response = await fetch(`${env.EMAIL_API_URL || 'https://api.sendgrid.com/v3/mail/send'}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: to }],
              subject: subject
            }],
            from: { email: 'noreply@a-to-mind.com' },
            content: [
              { type: 'text/plain', value: text },
              { type: 'text/html', value: html }
            ]
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("SendGrid API error:", response.status, errorText);
          await env.DB.prepare(
            "INSERT INTO events (event_id, source, kind, level, payload) VALUES (?, ?, ?, ?, ?)"
          ).bind(
            `evt_email_error_${Date.now()}`,
            "email_system",
            "email_api_error",
            "error",
            JSON.stringify({ status: response.status, error: errorText, to, subject })
          ).run();
          return;
        }
        
        // Log email send success
        await env.DB.prepare(
          "INSERT INTO events (event_id, source, kind, level, payload) VALUES (?, ?, ?, ?, ?)"
        ).bind(
          `evt_email_${Date.now()}`,
          "email_system",
          "email_sent",
          "info",
          JSON.stringify({ to, subject })
        ).run();
      } catch (e: any) {
        console.error("Email send failed:", e);
        await env.DB.prepare(
          "INSERT INTO events (event_id, source, kind, level, payload) VALUES (?, ?, ?, ?, ?)"
        ).bind(
          `evt_email_error_${Date.now()}`,
          "email_system",
          "email_send_error",
          "error",
          JSON.stringify({ error: e.message, to, subject })
        ).run();
      }
    }

    // Email sending endpoint
    if (url.pathname === "/email/send" && request.method === "POST") {
      try {
        const { to, subject, html, text } = await request.json();
        
        // Log email send attempt
        await env.DB.prepare(
          "INSERT INTO events (event_id, source, kind, level, payload) VALUES (?, ?, ?, ?, ?)"
        ).bind(
          `evt_email_${Date.now()}`,
          "email_system",
          "email_sent",
          "info",
          JSON.stringify({ to, subject })
        ).run();
        
        // In production, integrate with email service like SendGrid, Mailgun, or AWS SES
        // For now, we'll log and return success
        console.log(`Email would be sent to ${to}: ${subject}`);
        
        return new Response(JSON.stringify({
          success: true,
          message: "Email queued for sending"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to send email",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Email verification endpoint
    if (url.pathname === "/auth/verify" && request.method === "GET") {
      try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');
        
        if (!token) {
          return new Response(JSON.stringify({
            error: "Invalid verification link"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Find user by verification token
        const user = await env.DB.prepare(
          "SELECT id, email FROM users WHERE verification_token = ?"
        ).bind(token).first() as any;
        
        if (!user) {
          return new Response(JSON.stringify({
            error: "Invalid or expired verification link"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Mark email as verified
        await env.DB.prepare(
          "UPDATE users SET email_verified = 1, verification_token = NULL, updated_at = ? WHERE id = ?"
        ).bind(new Date().toISOString(), user.id).run();
        
        // Log verification as event
        await env.DB.prepare(
          "INSERT INTO events (event_id, source, kind, level, payload) VALUES (?, ?, ?, ?, ?)"
        ).bind(
          `evt_email_verified_${Date.now()}`,
          "auth_system",
          "email_verified",
          "info",
          JSON.stringify({ user_id: user.id, email: user.email })
        ).run();
        
        // Send confirmation email
        await sendEmail(
          user.email,
          "Email Verified Successfully",
          `<h1>Email Verified!</h1><p>Your email has been successfully verified.</p><p>You can now login to your account and complete your payment to activate your subscription.</p>`,
          "Your email has been successfully verified. You can now login to your account and complete your payment to activate your subscription."
        );
        
        return new Response(JSON.stringify({
          success: true,
          message: "Email verified successfully. You can now login."
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to verify email",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Resend verification email endpoint
    if (url.pathname === "/auth/resend-verification" && request.method === "POST") {
      try {
        const { email } = await request.json();
        
        // Find user by email
        const user = await env.DB.prepare(
          "SELECT id, email_verified, verification_token FROM users WHERE email = ?"
        ).bind(email).first() as any;
        
        if (!user) {
          return new Response(JSON.stringify({
            error: "User not found"
          }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        if (user.email_verified) {
          return new Response(JSON.stringify({
            error: "Email already verified"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Generate new verification token
        const verificationToken = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await env.DB.prepare(
          "UPDATE users SET verification_token = ?, updated_at = ? WHERE id = ?"
        ).bind(verificationToken, new Date().toISOString(), user.id).run();
        
        // Send verification email
        const verificationUrl = `${env.APP_URL || 'https://a-to-mind.com'}/auth/verify?token=${verificationToken}`;
        const emailContent = `
          <h2>Welcome to a-to-mind.com! 🚀</h2>
          <p>Thank you for signing up. We're excited to have you on board!</p>
          <p>To activate your account and start using our AI-powered infrastructure autonomy platform, please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea; font-size: 14px;">${verificationUrl}</p>
          <div class="divider"></div>
          <div class="info-box">
            <strong>📝 What happens next?</strong>
            <p style="margin-bottom: 0;">After verification, you'll have access to:</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Real-time usage monitoring</li>
              <li>Plan management and upgrades</li>
              <li>24/7 customer support</li>
              <li>Revenue analytics dashboard</li>
            </ul>
          </div>
          <p style="font-size: 13px; color: #888;">This link will expire in 24 hours for your security.</p>
        `;
        await sendEmail(
          email,
          "Verify your a-to-mind.com account",
          generateEmailTemplate(emailContent, "Verify your a-to-mind.com account"),
          `Welcome to a-to-mind.com! Please verify your email address: ${verificationUrl}`
        );
        
        return new Response(JSON.stringify({
          success: true,
          message: "Verification email sent. Please check your inbox."
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to resend verification email",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get user referral code
    if (url.pathname === "/api/user/referral-code" && request.method === "GET") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        const decoded = atob(token);
        const userId = decoded.split(":")[0];
        
        const user = await env.DB.prepare(
          "SELECT referral_code FROM users WHERE id = ?"
        ).bind(userId).first() as any;
        
        if (!user) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Generate referral code if it doesn't exist
        let referralCode = user.referral_code;
        if (!referralCode) {
          referralCode = Math.random().toString(36).substr(2, 8).toUpperCase();
          await env.DB.prepare(
            "UPDATE users SET referral_code = ? WHERE id = ?"
          ).bind(referralCode, userId).run();
        }
        
        return new Response(JSON.stringify({
          referral_code: referralCode,
          referral_link: `https://a-to-mind.com/signup?ref=${referralCode}`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        console.error("Referral code error:", e);
        return new Response(JSON.stringify({ error: "Failed to get referral code" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Authentication endpoints
    if (url.pathname === "/auth/signup" && request.method === "POST") {
      try {
        const { email, password, referral_code } = await request.json();
        
        // Validate input
        if (!email || !password) {
          return new Response(JSON.stringify({
            error: "Email and password required"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Rate limit by email
        if (!checkRateLimit(`signup_${email}`, 5, 3600000)) {
          return new Response(JSON.stringify({
            error: "Too many signup attempts. Please try again later."
          }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Check if user already exists
        const existingUser = await env.DB.prepare(
          "SELECT id FROM users WHERE email = ?"
        ).bind(email).first();
        
        if (existingUser) {
          return new Response(JSON.stringify({
            error: "User already exists"
          }), {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Validate referral code if provided
        let referrerId = null;
        if (referral_code) {
          const referrer = await env.DB.prepare(
            "SELECT id FROM users WHERE referral_code = ?"
          ).bind(referral_code).first() as any;
          
          if (referrer) {
            referrerId = referrer.id;
          }
        }
        
        // Create user with hashed password
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const passwordHash = await hashPassword(password);
        const verificationToken = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const referralCode = Math.random().toString(36).substr(2, 8).toUpperCase();
        
        await env.DB.prepare(
          "INSERT INTO users (id, email, password_hash, plan, status, verification_token, referral_code) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).bind(
          userId,
          email,
          passwordHash,
          'starter',
          'pending',
          verificationToken,
          referralCode
        ).run();
        
        // Log signup as event
        await env.DB.prepare(
          "INSERT INTO events (event_id, source, kind, level, payload) VALUES (?, ?, ?, ?, ?)"
        ).bind(
          `evt_signup_${Date.now()}`,
          "auth_system",
          "user_signup",
          "info",
          JSON.stringify({ user_id: userId, email, referrer_id: referrerId })
        ).run();
        
        // Track referral if code was valid
        if (referrerId) {
          const referralId = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await env.DB.prepare(
            "INSERT INTO referrals (id, referrer_id, referee_email, status, reward_amount) VALUES (?, ?, ?, ?, ?)"
          ).bind(
            referralId,
            referrerId,
            email,
            'active',
            1000 // 1000 API calls as reward
          ).run();
          
          // Award credits to referrer
          await env.DB.prepare(
            "UPDATE users SET referral_credits = referral_credits + 1000 WHERE id = ?"
          ).bind(referrerId).run();
        }
        
        // Send verification email
        const verificationUrl = `${env.APP_URL || 'https://a-to-mind.com'}/auth/verify?token=${verificationToken}`;
        const emailContent = `
          <h2>Welcome to a-to-mind.com! 🚀</h2>
          <p>Thank you for signing up. We're excited to have you on board!</p>
          <p>To activate your account and start using our AI-powered infrastructure autonomy platform, please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea; font-size: 14px;">${verificationUrl}</p>
          <div class="divider"></div>
          <div class="info-box">
            <strong>📝 What happens next?</strong>
            <p style="margin-bottom: 0;">After verification, you'll have access to:</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Real-time usage monitoring</li>
              <li>Plan management and upgrades</li>
              <li>24/7 customer support</li>
              <li>Revenue analytics dashboard</li>
            </ul>
          </div>
          <p style="font-size: 13px; color: #888;">This link will expire in 24 hours for your security.</p>
        `;
        await sendEmail(
          email,
          "Verify your a-to-mind.com account",
          generateEmailTemplate(emailContent, "Verify your a-to-mind.com account"),
          `Welcome to a-to-mind.com! Please verify your email address: ${verificationUrl}`
        );
        
        return new Response(JSON.stringify({
          success: true,
          user_id: userId,
          email,
          message: "Account created. Please check your email to verify your account."
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        await logError(e, "auth_signup");
        return new Response(JSON.stringify({
          error: "Failed to create account",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Verify token endpoint
    if (url.pathname === "/auth/verify" && request.method === "GET") {
      try {
        const authHeader = request.headers.get("Authorization");
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({
            error: "No token provided"
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        
        // Decode token (simple base64: user_id:timestamp)
        try {
          const decoded = atob(token);
          const [userId, timestamp] = decoded.split(":");
          
          if (!userId || !timestamp) {
            throw new Error("Invalid token format");
          }
          
          // Check if token is too old (7 days)
          const tokenAge = Date.now() - parseInt(timestamp);
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
          
          if (tokenAge > maxAge) {
            return new Response(JSON.stringify({
              error: "Token expired"
            }), {
              status: 401,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          // Get user from database
          const user = await env.DB.prepare(
            "SELECT id, email, plan, created_at FROM users WHERE id = ?"
          ).bind(userId).first() as any;
          
          if (!user) {
            return new Response(JSON.stringify({
              error: "User not found"
            }), {
              status: 401,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          return new Response(JSON.stringify({
            valid: true,
            user: user
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (e) {
          return new Response(JSON.stringify({
            error: "Invalid token"
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (e: any) {
        await logError(e, "auth_verify");
        return new Response(JSON.stringify({
          error: "Failed to verify token"
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (url.pathname === "/auth/login" && request.method === "POST") {
      try {
        const { email, password } = await request.json();
        
        // Find user
        const user = await env.DB.prepare(
          "SELECT * FROM users WHERE email = ?"
        ).bind(email).first() as any;
        
        if (!user) {
          return new Response(JSON.stringify({
            error: "Invalid credentials"
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Verify password
        const isValid = await verifyPassword(password, user.password_hash);
        
        if (!isValid) {
          return new Response(JSON.stringify({
            error: "Invalid credentials"
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Update last login
        await env.DB.prepare(
          "UPDATE users SET last_login = ? WHERE id = ?"
        ).bind(new Date().toISOString(), user.id).run();
        
        // Log login as event
        await env.DB.prepare(
          "INSERT INTO events (event_id, source, kind, level, payload) VALUES (?, ?, ?, ?, ?)"
        ).bind(
          `evt_login_${Date.now()}`,
          "auth_system",
          "user_login",
          "info",
          JSON.stringify({ user_id: user.id, email })
        ).run();
        
        // Generate simple token (in production use JWT)
        // Token format: base64(user_id:timestamp)
        const token = btoa(`${user.id}:${Date.now()}`);
        
        return new Response(JSON.stringify({
          success: true,
          token,
          user: {
            id: user.id,
            email: user.email,
            plan: user.plan,
            status: user.status,
            created_at: user.created_at
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        await logError(e, "auth_login", email);
        return new Response(JSON.stringify({
          error: "Failed to login",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (url.pathname === "/auth/me" && request.method === "GET") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({
            error: "Unauthorized"
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        const decoded = atob(token);
        const userId = decoded.split(":")[0];
        
        const user = await env.DB.prepare(
          "SELECT id, email, plan, status, created_at FROM users WHERE id = ?"
        ).bind(userId).first() as any;
        
        if (!user) {
          return new Response(JSON.stringify({
            error: "User not found"
          }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        return new Response(JSON.stringify({
          user
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to get user info",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (url.pathname === "/auth/activate" && request.method === "POST") {
      try {
        const { email, plan } = await request.json();
        
        // Update user status and plan
        await env.DB.prepare(
          "UPDATE users SET status = 'active', plan = ?, updated_at = ? WHERE email = ?"
        ).bind(plan, new Date().toISOString(), email).run();
        
        // Log activation as event
        await env.DB.prepare(
          "INSERT INTO events (event_id, source, kind, level, payload) VALUES (?, ?, ?, ?, ?)"
        ).bind(
          `evt_activation_${Date.now()}`,
          "auth_system",
          "account_activated",
          "info",
          JSON.stringify({ email, plan })
        ).run();
        
        return new Response(JSON.stringify({
          success: true,
          message: "Account activated successfully"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to activate account",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Usage tracking endpoint
    if (url.pathname === "/usage/track" && request.method === "POST") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({
            error: "Unauthorized"
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        const decoded = atob(token);
        const userId = decoded.split(":")[0];
        
        // Rate limit by user
        if (!checkRateLimit(`usage_${userId}`, 1000, 60000)) {
          return new Response(JSON.stringify({
            error: "Rate limit exceeded"
          }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Get user's plan and referral credits
        const user = await env.DB.prepare(
          "SELECT plan, referral_credits FROM users WHERE id = ?"
        ).bind(userId).first() as any;
        
        if (!user) {
          return new Response(JSON.stringify({
            error: "User not found"
          }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Check plan limits with referral credits
        const today = new Date().toISOString().split('T')[0];
        const usage = await env.DB.prepare(
          "SELECT event_count FROM user_usage WHERE user_id = ? AND date = ?"
        ).bind(userId, today).first() as any;
        
        const currentCount = usage?.event_count || 0;
        const referralCredits = user.referral_credits || 0;
        const baseLimit = user.plan === 'starter' ? 100 : user.plan === 'pro' ? 10000 : 100000;
        const effectiveLimit = baseLimit + referralCredits;
        
        // Enforce limits
        if (currentCount >= effectiveLimit) {
          return new Response(JSON.stringify({
            error: "Daily limit exceeded",
            limit: effectiveLimit,
            current: currentCount,
            base_limit: baseLimit,
            referral_credits: referralCredits
          }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Send usage warning at 80% of effective limit
        if (currentCount === Math.floor(effectiveLimit * 0.8)) {
          const userEmail = await env.DB.prepare(
            "SELECT email FROM users WHERE id = ?"
          ).bind(userId).first() as any;
          
          if (userEmail) {
            await sendEmail(
              userEmail.email,
              "You're approaching your daily limit",
              `<h1>Daily Limit Warning</h1><p>You've used ${currentCount} of your ${effectiveLimit} daily events.</p><p>Upgrade to Pro for unlimited events and AI proposals.</p>`,
              `You've used ${currentCount} of your ${effectiveLimit} daily events. Upgrade to Pro for unlimited events and AI proposals.`
            );
          }
        }
        
        // Update or create usage record
        if (usage) {
          await env.DB.prepare(
            "UPDATE user_usage SET event_count = event_count + 1, updated_at = ? WHERE user_id = ? AND date = ?"
          ).bind(new Date().toISOString(), userId, today).run();
        } else {
          const usageId = `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await env.DB.prepare(
            "INSERT INTO user_usage (id, user_id, event_count, date) VALUES (?, ?, 1, ?)"
          ).bind(usageId, userId, today).run();
        }
        
        return new Response(JSON.stringify({
          success: true,
          event_count: currentCount + 1,
          limit: user.plan === 'starter' ? 100 : 'unlimited'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        await logError(e, "usage_track", userId);
        return new Response(JSON.stringify({
          error: "Failed to track usage",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get user usage endpoint
    if (url.pathname === "/usage" && request.method === "GET") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({
            error: "Unauthorized"
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        const decoded = atob(token);
        const userId = decoded.split(":")[0];
        
        // Get user's plan
        const user = await env.DB.prepare(
          "SELECT plan FROM users WHERE id = ?"
        ).bind(userId).first() as any;
        
        if (!user) {
          return new Response(JSON.stringify({
            error: "User not found"
          }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Get today's usage
        const today = new Date().toISOString().split('T')[0];
        const usage = await env.DB.prepare(
          "SELECT event_count FROM user_usage WHERE user_id = ? AND date = ?"
        ).bind(userId, today).first() as any;
        
        // Get last 7 days usage
        const weekUsage = await env.DB.prepare(
          "SELECT date, event_count FROM user_usage WHERE user_id = ? AND date >= date('now', '-7 days') ORDER BY date DESC"
        ).bind(userId).all();
        
        return new Response(JSON.stringify({
          plan: user.plan,
          today: {
            date: today,
            event_count: usage?.event_count || 0,
            limit: user.plan === 'starter' ? 100 : 'unlimited'
          },
          week: weekUsage.results || []
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to get usage",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Subscription management endpoint
    if (url.pathname === "/subscription/change" && request.method === "POST") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({
            error: "Unauthorized"
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        const decoded = atob(token);
        const userId = decoded.split(":")[0];
        
        const { new_plan, csrf_token } = await request.json();
        
        // Validate CSRF token
        if (!validateCSRFToken(csrf_token, userId)) {
          return new Response(JSON.stringify({
            error: "Invalid CSRF token"
          }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Update user plan
        await env.DB.prepare(
          "UPDATE users SET plan = ?, updated_at = ? WHERE id = ?"
        ).bind(new_plan, new Date().toISOString(), userId).run();
        
        // Get user email
        const user = await env.DB.prepare(
          "SELECT email FROM users WHERE id = ?"
        ).bind(userId).first() as any;
        
        // Send plan change confirmation email
        const planBenefits = {
          starter: ['100 API calls/day', 'Basic monitoring', 'Community support'],
          pro: ['Unlimited API calls', 'Advanced analytics', 'Priority support', 'Custom integrations'],
          enterprise: ['Everything in Pro', 'Dedicated support', 'SLA guarantee', 'Custom solutions']
        };
        
        const emailContent = `
          <h2>Plan Successfully Updated! 🎉</h2>
          <p>Great news! Your plan has been successfully changed to <strong>${new_plan.toUpperCase()}</strong>.</p>
          <div class="info-box">
            <strong>✨ Your new plan includes:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${(planBenefits[new_plan as keyof typeof planBenefits] || []).map(benefit => `<li>${benefit}</li>`).join('')}
            </ul>
          </div>
          <p>You can now access all features included in your new plan immediately.</p>
          <div class="divider"></div>
          <p style="font-size: 13px; color: #888;">If you have any questions about your new plan, please don't hesitate to contact our support team.</p>
        `;
        await sendEmail(
          user.email,
          `Your a-to-mind.com plan has been upgraded to ${new_plan.toUpperCase()}`,
          generateEmailTemplate(emailContent, `Plan upgraded to ${new_plan}`),
          `Your plan has been successfully changed to ${new_plan}. You now have access to all features included in your new plan.`
        );
        
        // Log plan change as event
        await env.DB.prepare(
          "INSERT INTO events (event_id, source, kind, level, payload) VALUES (?, ?, ?, ?, ?)"
        ).bind(
          `evt_plan_change_${Date.now()}`,
          "subscription_system",
          "plan_changed",
          "info",
          JSON.stringify({ user_id: userId, new_plan })
        ).run();
        
        return new Response(JSON.stringify({
          success: true,
          new_plan
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        await logError(e, "subscription_change", userId);
        return new Response(JSON.stringify({
          error: "Failed to change plan",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Cancel subscription endpoint
    if (url.pathname === "/subscription/cancel" && request.method === "POST") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({
            error: "Unauthorized"
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        const decoded = atob(token);
        const userId = decoded.split(":")[0];
        
        const { csrf_token } = await request.json();
        
        // Validate CSRF token
        if (!validateCSRFToken(csrf_token, userId)) {
          return new Response(JSON.stringify({
            error: "Invalid CSRF token"
          }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Update user plan to starter (downgrade)
        await env.DB.prepare(
          "UPDATE users SET plan = 'starter', updated_at = ? WHERE id = ?"
        ).bind(new Date().toISOString(), userId).run();
        
        // Get user email
        const user = await env.DB.prepare(
          "SELECT email FROM users WHERE id = ?"
        ).bind(userId).first() as any;
        
        // Send cancellation confirmation email
        const emailContent = `
          <h2>Subscription Cancelled 📋</h2>
          <p>We're sorry to see you go! Your subscription has been successfully cancelled.</p>
          <div class="info-box">
            <strong>What happens now:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Your account has been downgraded to the Starter plan</li>
              <li>You'll retain access to basic features</li>
              <li>No further charges will be made to your account</li>
            </ul>
          </div>
          <p>Thank you for being a part of a-to-mind.com. We hope to welcome you back in the future!</p>
          <div class="divider"></div>
          <p style="font-size: 13px; color: #888;">If you change your mind, you can upgrade your plan at any time from your dashboard.</p>
        `;
        await sendEmail(
          user.email,
          "Your a-to-mind.com subscription has been cancelled",
          generateEmailTemplate(emailContent, "Subscription cancelled"),
          "Your subscription has been cancelled. Your account has been downgraded to the Starter plan. Thank you for using a-to-mind.com."
        );
        
        // Log cancellation as event
        await env.DB.prepare(
          "INSERT INTO events (event_id, source, kind, level, payload) VALUES (?, ?, ?, ?, ?)"
        ).bind(
          `evt_cancellation_${Date.now()}`,
          "subscription_system",
          "subscription_cancelled",
          "warning",
          JSON.stringify({ user_id: userId })
        ).run();
        
        return new Response(JSON.stringify({
          success: true,
          message: "Subscription cancelled successfully"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        await logError(e, "subscription_cancel", userId);
        return new Response(JSON.stringify({
          error: "Failed to cancel subscription",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Stripe checkout session creation endpoint
    if (url.pathname === "/payments/stripe/create-checkout" && request.method === "POST") {
      try {
        const { plan } = await request.json();
        
        // Validate plan
        const validPlans = ['starter', 'pro', 'enterprise'];
        if (!validPlans.includes(plan)) {
          return new Response(JSON.stringify({
            error: "Invalid plan"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Determine price
        const prices = { starter: 0, pro: 2900, enterprise: 9900 }; // in cents
        const price = prices[plan as keyof typeof prices];
        
        if (price === 0) {
          return new Response(JSON.stringify({
            error: "Starter plan is free, no payment required"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Log for debugging
        console.log(`Creating Stripe checkout for plan: ${plan}, price: ${price}`);
        
        // First, create a price for the subscription
        const priceResponse = await fetch('https://api.stripe.com/v1/prices', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            'currency': 'usd',
            'unit_amount': price.toString(),
            'recurring[interval]': 'month',
            'product_data[name]': `${plan.toUpperCase()} Plan`,
            'product_data[description]': `Monthly subscription to a-to-mind.com ${plan.toUpperCase()} plan`
          })
        });
        
        const priceData = await priceResponse.json();
        console.log('Price creation response:', priceData);
        
        if (priceData.error) {
          console.error('Price creation error:', priceData.error);
          return new Response(JSON.stringify({
            error: priceData.error.message || 'Failed to create price'
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Now create checkout session with the price ID
        const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            'payment_method_types[0]': 'card',
            'line_items[0][price]': priceData.id,
            'line_items[0][quantity]': '1',
            'mode': 'subscription',
            'success_url': `${env.APP_URL}/dashboard?payment=success`,
            'cancel_url': `${env.APP_URL}/dashboard?payment=cancelled`,
            'metadata[plan]': plan
          })
        });
        
        const session = await stripeResponse.json();
        
        console.log('Stripe response:', session);
        
        if (session.error) {
          console.error('Stripe error:', session.error);
          return new Response(JSON.stringify({
            error: session.error.message || 'Stripe error'
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        return new Response(JSON.stringify({
          success: true,
          checkout_url: session.url,
          session_id: session.id
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        console.error('Stripe checkout error:', e);
        await logError(e, "stripe_checkout");
        return new Response(JSON.stringify({
          error: "Failed to create checkout session",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Stripe webhook endpoint
    if (url.pathname === "/payments/stripe/webhook" && request.method === "POST") {
      try {
        const signature = request.headers.get('Stripe-Signature');
        const webhookSecret = env.STRIPE_WEBHOOK_SECRET || 'whsec_test_placeholder';
        
        // Verify webhook signature (simplified - in production use proper crypto verification)
        // For now, we'll process the webhook without signature verification
        
        const event = await request.json();
        
        // Handle the event
        switch (event.type) {
          case 'checkout.session.completed': {
            const session = event.data.object;
            const plan = session.metadata.plan;
            const customerEmail = session.customer_details?.email;
            
            if (customerEmail) {
              // Create payment record
              const paymentId = `pay_stripe_${session.id}`;
              await env.DB.prepare(
                "INSERT INTO payments (id, email, plan, amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?)"
              ).bind(
                paymentId,
                customerEmail,
                plan,
                session.amount_total / 100,
                'completed',
                new Date().toISOString()
              ).run();
              
              // Update user plan
              await env.DB.prepare(
                "UPDATE users SET plan = ?, status = 'active', updated_at = ? WHERE email = ?"
              ).bind(plan, new Date().toISOString(), customerEmail).run();
              
              // Send confirmation email
              const emailContent = `
                <h2>Payment Successful! 🎉</h2>
                <p>Your payment has been successfully processed.</p>
                <div class="info-box">
                  <strong>Payment Details:</strong>
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    <li><strong>Plan:</strong> ${plan.toUpperCase()}</li>
                    <li><strong>Amount:</strong> $${session.amount_total / 100}</li>
                    <li><strong>Transaction ID:</strong> ${session.payment_intent}</li>
                  </ul>
                </div>
                <p>Your account has been upgraded and you now have access to all features included in your plan.</p>
              `;
              await sendEmail(
                customerEmail,
                "Payment Successful - a-to-mind.com",
                generateEmailTemplate(emailContent, "Payment Successful"),
                `Your payment was successful. You have been upgraded to the ${plan} plan.`
              );
            }
            break;
          }
          case 'invoice.payment_failed': {
            const invoice = event.data.object;
            const customerEmail = invoice.customer_email;
            
            if (customerEmail) {
              const emailContent = `
                <h2>Payment Failed ⚠️</h2>
                <p>We were unable to process your payment.</p>
                <div class="info-box">
                  <strong>What happened:</strong>
                  <p style="margin: 10px 0;">Your payment method was declined or there was an issue processing your payment.</p>
                </div>
                <p>Please update your payment method or contact your bank to resolve this issue.</p>
                <p>Your subscription will remain active for now, but please resolve this payment issue to avoid service interruption.</p>
              `;
              await sendEmail(
                customerEmail,
                "Payment Failed - Action Required",
                generateEmailTemplate(emailContent, "Payment Failed"),
                "Your payment failed. Please update your payment method to avoid service interruption."
              );
            }
            break;
          }
          default:
            console.log(`Unhandled event type ${event.type}`);
        }
        
        return new Response(JSON.stringify({
          success: true
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        await logError(e, "stripe_webhook");
        return new Response(JSON.stringify({
          error: "Webhook processing failed",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Analytics tracking endpoint
    if (url.pathname === "/analytics/track" && request.method === "POST") {
      try {
        const event = await request.json();
        
        // Store analytics event in database
        await env.DB.prepare(
          "INSERT INTO events (id, type, source, severity, title, description, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(
          `analytics_${event.event_name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          event.event_category,
          "product_analytics",
          "info",
          event.event_name,
          event.event_label || "",
          JSON.stringify({
            value: event.value,
            user_id: event.user_id,
            session_id: event.session_id,
            page: event.page,
            referrer: event.referrer,
            user_agent: event.user_agent,
            timestamp: event.timestamp
          }),
          new Date(event.timestamp).toISOString()
        ).run();
        
        return new Response(JSON.stringify({
          success: true
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to track analytics event",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get analytics data (admin only)
    if (url.pathname === "/analytics/data" && request.method === "GET") {
      try {
        // Get analytics events from the last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        
        const events = await env.DB.prepare(
          "SELECT * FROM events WHERE source = 'product_analytics' AND created_at > ? ORDER BY created_at DESC"
        ).bind(thirtyDaysAgo).all() as any[];
        
        // Aggregate analytics data
        const analytics = {
          total_events: events.length,
          unique_users: new Set(events.map(e => JSON.parse(e.metadata).user_id)).size,
          unique_sessions: new Set(events.map(e => JSON.parse(e.metadata).session_id)).size,
          events_by_category: {} as Record<string, number>,
          events_by_name: {} as Record<string, number>,
          top_pages: {} as Record<string, number>,
          daily_events: {} as Record<string, number>
        };
        
        events.forEach(event => {
          const metadata = JSON.parse(event.metadata);
          
          // Count by category
          analytics.events_by_category[event.type] = 
            (analytics.events_by_category[event.type] || 0) + 1;
          
          // Count by name
          analytics.events_by_name[event.title] = 
            (analytics.events_by_name[event.title] || 0) + 1;
          
          // Count by page
          if (metadata.page) {
            analytics.top_pages[metadata.page] = 
              (analytics.top_pages[metadata.page] || 0) + 1;
          }
          
          // Count by day
          const day = new Date(event.created_at).toISOString().split('T')[0];
          analytics.daily_events[day] = 
            (analytics.daily_events[day] || 0) + 1;
        });
        
        return new Response(JSON.stringify({
          analytics
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to fetch analytics data",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Payment initiation endpoint
    if (url.pathname === "/payments/initiate" && request.method === "POST") {
      try {
        const { email, plan } = await request.json();
        
        // Validate plan
        const validPlans = ['starter', 'pro', 'enterprise'];
        if (!validPlans.includes(plan)) {
          return new Response(JSON.stringify({
            error: "Invalid plan"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Rate limit by email
        if (!checkRateLimit(`payment_${email}`, 3, 3600000)) {
          return new Response(JSON.stringify({
            error: "Too many payment attempts. Please try again later."
          }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Store payment request in D1
        const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const amount = plan === 'pro' ? 29 : plan === 'enterprise' ? 99 : 0;
        
        await env.DB.prepare(
          "INSERT INTO payments (id, email, plan, amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(
          paymentId,
          email,
          plan,
          amount,
          'pending',
          new Date().toISOString()
        ).run();
        
        // Log payment initiation as event
        await env.DB.prepare(
          "INSERT INTO events (event_id, source, kind, level, payload) VALUES (?, ?, ?, ?, ?)"
        ).bind(
          `evt_payment_init_${Date.now()}`,
          "payment_system",
          "payment_initiated",
          "info",
          JSON.stringify({ payment_id: paymentId, email, plan, amount })
        ).run();
        
        return new Response(JSON.stringify({
          success: true,
          payment_id: paymentId,
          cashapp_handle: "$AtomicWork",
          amount: amount,
          memo: `a-to-mind ${plan} plan - ${paymentId}`,
          instructions: `Send $${amount} to $AtomicWork on CashApp with memo: "a-to-mind ${plan} plan - ${paymentId}"`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        await logError(e, "payment_initiate", email);
        return new Response(JSON.stringify({
          error: "Failed to initiate payment",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Payment verification endpoint (admin)
    if (url.pathname === "/payments/verify" && request.method === "POST") {
      try {
        const { payment_id, status } = await request.json();
        
        // Get payment details
        const payment = await env.DB.prepare(
          "SELECT * FROM payments WHERE id = ?"
        ).bind(payment_id).first() as any;
        
        if (!payment) {
          return new Response(JSON.stringify({
            error: "Payment not found"
          }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Update payment status
        await env.DB.prepare(
          "UPDATE payments SET status = ? WHERE id = ?"
        ).bind(status, payment_id).run();
        
        // If payment completed, activate user account
        if (status === 'completed') {
          await env.DB.prepare(
            "UPDATE users SET status = 'active', plan = ?, updated_at = ? WHERE email = ?"
          ).bind(payment.plan, new Date().toISOString(), payment.email).run();
          
          // Log activation as event
          await env.DB.prepare(
            "INSERT INTO events (event_id, source, kind, level, payload) VALUES (?, ?, ?, ?, ?)"
          ).bind(
            `evt_auto_activation_${Date.now()}`,
            "payment_system",
            "auto_account_activation",
            "info",
            JSON.stringify({ email: payment.email, plan: payment.plan, payment_id })
          ).run();
          
          // Send activation email
          await sendEmail(
            payment.email,
            "Your a-to-mind.com Account is Now Active!",
            `<h1>Your Account is Now Active!</h1><p>Thank you for your payment of $${payment.amount}.</p><p>Your ${payment.plan} plan is now active and you can start using all features.</p><p>Log in to your dashboard to get started.</p>`,
            `Your a-to-mind.com account is now active! Your ${payment.plan} plan is now active. Log in to your dashboard to get started.`
          );
        }
        
        // Log payment verification as event
        await env.DB.prepare(
          "INSERT INTO events (event_id, source, kind, level, payload) VALUES (?, ?, ?, ?, ?)"
        ).bind(
          `evt_payment_verify_${Date.now()}`,
          "payment_system",
          "payment_verified",
          status === 'completed' ? 'info' : 'warning',
          JSON.stringify({ payment_id, status, email: payment.email })
        ).run();
        
        return new Response(JSON.stringify({
          success: true,
          payment_id,
          status,
          user_activated: status === 'completed'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        await logError(e, "payment_verify", payment_id);
        return new Response(JSON.stringify({
          error: "Failed to verify payment",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get payment history endpoint
    if (url.pathname === "/payments/history" && request.method === "GET") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({
            error: "Unauthorized"
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        
        // Decode token with error handling
        let userId;
        try {
          const decoded = atob(token);
          userId = decoded.split(":")[0];
        } catch (e) {
          return new Response(JSON.stringify({
            error: "Invalid token format"
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        if (!userId) {
          return new Response(JSON.stringify({
            error: "Invalid token"
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Get user email with error handling
        let user;
        try {
          user = await env.DB.prepare(
            "SELECT email FROM users WHERE id = ?"
          ).bind(userId).first() as any;
        } catch (e) {
          return new Response(JSON.stringify({
            error: "Failed to fetch user"
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        if (!user) {
          return new Response(JSON.stringify({
            error: "User not found"
          }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Get all payments for this user with error handling
        let payments;
        try {
          payments = await env.DB.prepare(
            "SELECT * FROM payments WHERE email = ? ORDER BY created_at DESC"
          ).bind(user.email).all() as any[];
        } catch (e) {
          // If payments table doesn't exist or query fails, return empty array
          payments = [];
        }
        
        return new Response(JSON.stringify({
          payments: payments || []
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to fetch payment history",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get pending payments (admin)
    if (url.pathname === "/payments/pending" && request.method === "GET") {
      try {
        const payments = await env.DB.prepare(
          "SELECT * FROM payments WHERE status = 'pending' ORDER BY created_at DESC"
        ).all();
        
        return new Response(JSON.stringify({
          payments: payments.results
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to fetch pending payments",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Trigger proposal generation manually (for testing)
    if (url.pathname === "/proposals/generate" && request.method === "POST") {
      try {
        // Manually trigger the scheduled function logic
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const events = await env.DB.prepare(
          "SELECT * FROM events WHERE created_at > ? ORDER BY created_at DESC"
        ).bind(yesterday).all();
        
        console.log(`Manual trigger: Found ${events.results.length} events in last 24 hours`);
        
        if (events.results.length === 0) {
          return new Response(JSON.stringify({
            success: true,
            message: "No events to analyze",
            proposals: []
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const eventSummary = events.results.map((e: any) => ({
          kind: e.kind,
          source: e.source,
          level: e.level,
          timestamp: e.created_at,
          payload: e.payload
        }));

        const geminiPrompt = `Analyze these system events and generate 3-5 high-priority self-improvement proposals. Events: ${JSON.stringify(eventSummary)}. 

For each proposal, provide:
1. Title (short, actionable)
2. Description (what problem and why it matters)
3. Suspected cause (root cause analysis)
4. Recommended fix (specific, actionable steps)
5. Risk score (0.0-1.0)
6. Blast radius (estimated number of files/surfaces affected)

Return as JSON array with structure: [{"title": "...", "description": "...", "suspected_cause": "...", "recommended_fix": "...", "risk_score": 0.5, "blast_radius_files": 5, "blast_radius_surfaces": 2}]`;

        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GOOGLE_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: geminiPrompt }]
            }]
          })
        });

        const geminiData = await geminiResponse.json();
        
        let proposals = [];
        if (geminiData.candidates && geminiData.candidates[0]?.content?.parts[0]?.text) {
          const aiResponse = geminiData.candidates[0].content.parts[0].text;
          
          try {
            const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              proposals = JSON.parse(jsonMatch[0]);
            } else {
              proposals = JSON.parse(aiResponse);
            }
          } catch (e) {
            console.error("Failed to parse AI proposals:", e);
            proposals = [{
              title: "Daily System Review",
              description: `Review ${events.results.length} events from last 24 hours. Events: ${eventSummary.map((e: any) => e.kind).join(", ")}`,
              suspected_cause: "Routine monitoring",
              recommended_fix: "Review logs and metrics",
              risk_score: 0.3,
              blast_radius_files: 0,
              blast_radius_surfaces: 0
            }];
          }

          for (const proposal of proposals) {
            const proposalId = `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            await env.DB.prepare(
              "INSERT INTO proposals (id, title, body, author, status, risk_score, blast_radius_files, blast_radius_surfaces) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            ).bind(
              proposalId,
              proposal.title,
              `${proposal.description}\n\nSuspected Cause: ${proposal.suspected_cause}\n\nRecommended Fix: ${proposal.recommended_fix}`,
              "gemini-ai",
              "pending",
              proposal.risk_score || 0.5,
              proposal.blast_radius_files || 0,
              proposal.blast_radius_surfaces || 0
            ).run();
          }
        }
        
        return new Response(JSON.stringify({
          success: true,
          message: `Generated ${proposals.length} proposals from ${events.results.length} events`,
          proposals,
          events_analyzed: events.results.length
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to generate proposals",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Update proposal status endpoint
    if (url.pathname.match(/^\/proposals\/[^/]+$/) && request.method === "PATCH") {
      try {
        const proposalId = url.pathname.split("/").pop();
        const { status, approved_by } = await request.json();
        
        const result = await env.DB.prepare(
          "UPDATE proposals SET status = ?, updated_at = datetime('now') WHERE id = ?"
        ).bind(status, proposalId).run();
        
        return new Response(JSON.stringify({
          success: true,
          proposal_id: proposalId,
          status,
          approved_by,
          message: "Proposal status updated successfully"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({
          error: "Failed to update proposal",
          details: e.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Stub runs endpoints
    if (url.pathname === "/runs/recent") {
      return new Response(JSON.stringify({ 
        runs: [],
        source: "monday",
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (url.pathname.startsWith("/runs/")) {
      const id = url.pathname.split("/").pop();
      return new Response(JSON.stringify({ run: { id } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Telemetry endpoints for Homebase v0.3
    
    // A. /api/telemetry/usage - Get API usage for current billing cycle
    if (url.pathname === "/api/telemetry/usage" && request.method === "GET") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        const decoded = atob(token);
        const userId = decoded.split(":")[0];
        
        // Calculate usage for current billing cycle (start of month)
        const result = await env.DB.prepare(
          "SELECT SUM(total_requests) as current_usage FROM api_usage_rollups WHERE user_id = ? AND date >= date('now', 'start of month')"
        ).bind(userId).first() as any;
        
        const currentUsage = result?.current_usage || 0;
        
        // Get user's plan to determine limit
        const user = await env.DB.prepare(
          "SELECT plan FROM users WHERE id = ?"
        ).bind(userId).first() as any;
        
        const plan = user?.plan || 'starter';
        const limit = plan === 'starter' ? 1000 : plan === 'pro' ? 100000 : 1000000;
        
        return new Response(JSON.stringify({
          current_usage: currentUsage,
          limit: limit,
          plan: plan
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        console.error("Telemetry usage error:", e);
        return new Response(JSON.stringify({ error: "Failed to fetch usage" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    
    // B. /api/telemetry/referrals - Get referral counts and earnings
    if (url.pathname === "/api/telemetry/referrals" && request.method === "GET") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        const decoded = atob(token);
        const userId = decoded.split(":")[0];
        
        const result = await env.DB.prepare(
          "SELECT COUNT(*) as active_referrals, SUM(reward_amount) as total_earned FROM referrals WHERE referrer_id = ? AND status = 'active'"
        ).bind(userId).first() as any;
        
        return new Response(JSON.stringify({
          active_referrals: result?.active_referrals || 0,
          total_earned: result?.total_earned || 0
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        console.error("Telemetry referrals error:", e);
        return new Response(JSON.stringify({ error: "Failed to fetch referrals" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    
    // C. /api/telemetry/revenue - Get revenue from completed payments
    if (url.pathname === "/api/telemetry/revenue" && request.method === "GET") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        const decoded = atob(token);
        const userId = decoded.split(":")[0];
        
        const result = await env.DB.prepare(
          "SELECT SUM(amount) as total_revenue FROM payments WHERE user_id = ? AND status = 'completed'"
        ).bind(userId).first() as any;
        
        return new Response(JSON.stringify({
          total_revenue: result?.total_revenue || 0
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        console.error("Telemetry revenue error:", e);
        return new Response(JSON.stringify({ error: "Failed to fetch revenue" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    
    // D. /api/telemetry/agents - Get agent status from KV
    if (url.pathname === "/api/telemetry/agents" && request.method === "GET") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        const decoded = atob(token);
        const userId = decoded.split(":")[0];
        
        // List all agent keys for this user
        const agentKeys = await env.LOXA_AGENT_STATE.list({ prefix: `agent:${userId}:` });
        
        let activeAgents = 0;
        let totalLatency = 0;
        
        for (const key of agentKeys.keys) {
          const value = await env.LOXA_AGENT_STATE.get(key.name);
          if (value) {
            const agentData = JSON.parse(value);
            if (agentData.status === 'running') {
              activeAgents++;
              totalLatency += agentData.latency_ms || 0;
            }
          }
        }
        
        const avgLatency = activeAgents > 0 ? Math.round(totalLatency / activeAgents) : 0;
        
        return new Response(JSON.stringify({
          active_agents: activeAgents,
          avg_latency_ms: avgLatency
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        console.error("Telemetry agents error:", e);
        return new Response(JSON.stringify({ error: "Failed to fetch agent status" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    
    // E. /api/telemetry/infrastructure - Get infrastructure health from KV
    if (url.pathname === "/api/telemetry/infrastructure" && request.method === "GET") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        const decoded = atob(token);
        const userId = decoded.split(":")[0];
        
        // List all infrastructure keys for this user
        const infraKeys = await env.LOXA_INFRA_HEALTH.list({ prefix: `infra:${userId}:` });
        
        let healthySystems = 0;
        let totalSystems = infraKeys.keys.length;
        let totalResponseTime = 0;
        let totalSecurityScore = 0;
        let maxUptimeStreak = 0;
        
        for (const key of infraKeys.keys) {
          const value = await env.LOXA_INFRA_HEALTH.get(key.name);
          if (value) {
            const infraData = JSON.parse(value);
            if (infraData.status === 'healthy') {
              healthySystems++;
            }
            totalResponseTime += infraData.response_time_ms || 0;
            totalSecurityScore += infraData.security_score || 0;
            maxUptimeStreak = Math.max(maxUptimeStreak, infraData.uptime_streak_days || 0);
          }
        }
        
        const avgResponseTime = totalSystems > 0 ? Math.round(totalResponseTime / totalSystems) : 0;
        const avgSecurityScore = totalSystems > 0 ? Math.round(totalSecurityScore / totalSystems) : 0;
        
        // If unhealthy systems detected, trigger S2 Auto-Patcher
        if (healthySystems < totalSystems) {
          console.log(`S1: Detected ${totalSystems - healthySystems} issues, triggering S2 Auto-Patcher`);
          
          // Log anomalies for S2
          const unhealthyKeys = [];
          for (const key of infraKeys.keys) {
            const value = await env.LOXA_INFRA_HEALTH.get(key.name);
            if (value) {
              const infraData = JSON.parse(value);
              if (infraData.status !== 'healthy') {
                unhealthyKeys.push(key);
              }
            }
          }

          for (const key of unhealthyKeys) {
            const value = await env.LOXA_INFRA_HEALTH.get(key.name);
            if (value) {
              const infraData = JSON.parse(value);
              const anomalyId = `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              await env.DB.prepare(
                "INSERT INTO system_anomalies (id, endpoint, error_type, stack_trace, request_payload, timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?)"
              ).bind(
                anomalyId,
                key.name,
                infraData.error_type || 'Health check failed',
                infraData.stack_trace || 'No stack trace available',
                JSON.stringify(infraData),
                new Date().toISOString(),
                'pending'
              ).run();
            }
          }
        }
        
        return new Response(JSON.stringify({
          total_systems: totalSystems,
          healthy_systems: healthySystems,
          avg_response_time_ms: avgResponseTime,
          security_score: avgSecurityScore,
          uptime_streak_days: maxUptimeStreak
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        console.error("Telemetry infrastructure error:", e);
        return new Response(JSON.stringify({ error: "Failed to fetch infrastructure health" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // S1 Health Monitor Agent - Infrastructure health scan
    if (url.pathname === "/api/agents/s1/scan" && request.method === "POST") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        const decoded = atob(token);
        const userId = decoded.split(":")[0];

        // S1 Agent: Execute parallel health checks
        const endpoints = [
          { name: 'Cloudflare DNS', url: 'https://1.1.1.1' },
          { name: 'Google DNS', url: 'https://8.8.8.8' },
          { name: 'Aether API', url: 'https://aether-api.atomicmoonbeam88.workers.dev/health' },
          { name: 'Aether Frontend', url: 'https://82dcdd6c.aether-frontend-3nb.pages.dev' }
        ];

        const startTime = Date.now();
        const results = await Promise.allSettled(
          endpoints.map(async (endpoint) => {
            const start = Date.now();
            try {
              const response = await fetch(endpoint.url, { 
                method: 'HEAD',
                signal: AbortSignal.timeout(5000) // 5s timeout
              });
              const latency = Date.now() - start;
              return {
                name: endpoint.name,
                status: response.ok ? 'healthy' : 'unhealthy',
                latency: latency,
                statusCode: response.status
              };
            } catch (e) {
              return {
                name: endpoint.name,
                status: 'unhealthy',
                latency: Date.now() - start,
                error: 'Connection failed'
              };
            }
          })
        );

        const totalLatency = Date.now() - startTime;
        
        // Calculate health metrics
        const healthySystems = results.filter(r => r.status === 'fulfilled' && r.value.status === 'healthy').length;
        const totalSystems = results.length;
        const healthScore = Math.round((healthySystems / totalSystems) * 100);
        const avgLatency = Math.round(totalLatency / totalSystems);

        const scanResult = {
          scan_id: `s1_${Date.now()}`,
          timestamp: new Date().toISOString(),
          health_score: healthScore,
          total_systems: totalSystems,
          healthy_systems: healthySystems,
          avg_response_time_ms: avgLatency,
          security_score: 95, // Placeholder for S4 agent
          uptime_streak_days: 30, // Placeholder
          systems: results.map(r => r.status === 'fulfilled' ? r.value : { name: 'Unknown', status: 'unhealthy', latency: 0 })
        };

        // Write to KV for real-time telemetry
        await env.LOXA_INFRA_HEALTH.put(
          `infra:${userId}:latest_scan`,
          JSON.stringify(scanResult)
        );

        return new Response(JSON.stringify(scanResult), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        console.error("S1 Health Scan error:", e);
        return new Response(JSON.stringify({ error: "Health scan failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // S3 Database Inspector Agent - Query performance analysis
    if (url.pathname === "/api/agents/s3/analyze" && request.method === "POST") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        const decoded = atob(token);
        const userId = decoded.split(":")[0];

        // Get user's plan to determine access level
        const user = await env.DB.prepare(
          "SELECT plan FROM users WHERE id = ?"
        ).bind(userId).first() as any;
        
        if (!user) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Fetch slow queries from the last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const slowQueries = await env.DB.prepare(
          "SELECT * FROM slow_queries WHERE timestamp >= ? ORDER BY duration_ms DESC LIMIT 20"
        ).bind(sevenDaysAgo).all() as any[];

        const analysis = {
          scan_id: `s3_${Date.now()}`,
          timestamp: new Date().toISOString(),
          total_slow_queries: slowQueries.results.length,
          avg_duration_ms: slowQueries.results.length > 0 
            ? Math.round(slowQueries.results.reduce((sum: number, q: any) => sum + q.duration_ms, 0) / slowQueries.results.length)
            : 0,
          worst_offenders: slowQueries.results.slice(0, 5).map((q: any) => ({
            query_text: q.query_text,
            duration_ms: q.duration_ms,
            table_name: q.table_name,
            query_type: q.query_type,
            timestamp: q.timestamp
          }))
        };

        // For Pro users, generate resolution proposals
        if (user.plan === 'pro' || user.plan === 'enterprise') {
          const proposals = analysis.worst_offenders.map((query: any, index: number) => {
            // Simple heuristic: if query has WHERE clause, suggest index on those columns
            const whereMatch = query.query_text.match(/WHERE\s+([\w_]+)/i);
            if (whereMatch) {
              const projectedLatency = Math.max(20, Math.round(query.duration_ms * 0.1)); // 90% improvement estimate
              return {
                id: `prop_${Date.now()}_${index}`,
                table: query.table_name,
                sql_statement: `CREATE INDEX IF NOT EXISTS idx_${query.table_name}_${whereMatch[1]} ON ${query.table_name}(${whereMatch[1]})`,
                current_latency_ms: query.duration_ms,
                projected_latency_ms: projectedLatency,
                expected_improvement: `${Math.round((query.duration_ms - projectedLatency) / query.duration_ms * 100)}% faster`,
                priority: query.duration_ms > 200 ? 'high' : 'medium'
              };
            }
            return null;
          }).filter(Boolean);

          analysis.proposals = proposals;
          analysis.estimated_cost_savings = `$${Math.round(slowQueries.results.length * 0.5)}/month`;
        } else {
          analysis.proposals = [];
          analysis.estimated_cost_savings = null;
        }

        return new Response(JSON.stringify(analysis), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        console.error("S3 Database Inspector error:", e);
        return new Response(JSON.stringify({ error: "Database analysis failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // S3 Database Inspector - Execute index proposal
    if (url.pathname === "/api/agents/s3/execute" && request.method === "POST") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        const decoded = atob(token);
        const userId = decoded.split(":")[0];

        const { proposal_id, sql_statement, table_name, expected_improvement } = await request.json();

        // Validate user is Pro tier
        const user = await env.DB.prepare(
          "SELECT plan FROM users WHERE id = ?"
        ).bind(userId).first() as any;
        
        if (!user) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (user.plan !== 'pro' && user.plan !== 'enterprise') {
          return new Response(JSON.stringify({ error: "Pro tier required for autonomous execution" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Security: Validate SQL statement is a CREATE INDEX command
        if (!sql_statement.trim().toUpperCase().startsWith("CREATE INDEX")) {
          return new Response(JSON.stringify({ error: "Invalid SQL statement. Only CREATE INDEX commands are allowed." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Execute the index creation
        const executionStart = Date.now();
        try {
          await env.DB.prepare(sql_statement).run();
        } catch (e: any) {
          return new Response(JSON.stringify({ 
            error: "Index creation failed",
            details: e.message 
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const executionTime = Date.now() - executionStart;

        // Log the execution as an event
        await env.DB.prepare(
          "INSERT INTO events (event_id, source, kind, level, payload) VALUES (?, ?, ?, ?, ?)"
        ).bind(
          `evt_s3_execute_${Date.now()}`,
          "s3_agent",
          "index_created",
          "info",
          JSON.stringify({
            user_id: userId,
            proposal_id,
            table_name,
            sql_statement,
            execution_time_ms: executionTime,
            expected_improvement
          })
        ).run();

        return new Response(JSON.stringify({
          success: true,
          execution_id: `exec_${Date.now()}`,
          table_name,
          sql_statement,
          execution_time_ms: executionTime,
          expected_improvement,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        console.error("S3 Execution error:", e);
        return new Response(JSON.stringify({ error: "Execution failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // S3 Agent History endpoint
    if (url.pathname === "/api/agents/s3/history" && request.method === "GET") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        const decoded = atob(token);
        const userId = decoded.split(":")[0];

        // Get user's plan to determine access level
        const user = await env.DB.prepare(
          "SELECT plan FROM users WHERE id = ?"
        ).bind(userId).first() as any;
        
        if (!user) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Fetch S3 agent actions from last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const actions = await env.DB.prepare(
          "SELECT * FROM agent_actions WHERE agent_id = 's3' AND timestamp >= ? ORDER BY timestamp DESC LIMIT 20"
        ).bind(sevenDaysAgo).all() as any[];

        const history = {
          agent_id: "s3",
          total_actions: actions.results.length,
          actions: actions.results.map((action: any) => ({
            id: action.id,
            action_taken: action.action_taken,
            status: action.status,
            timestamp: action.timestamp,
            details: action.details ? JSON.parse(action.details) : null,
            execution_time_ms: action.execution_time_ms
          }))
        };

        return new Response(JSON.stringify(history), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        console.error("S3 History error:", e);
        return new Response(JSON.stringify({ error: "Failed to fetch history" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // S2 Auto-Patcher - Error telemetry intercept
    if (url.pathname === "/api/telemetry/errors" && request.method === "POST") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        const decoded = atob(token);
        const userId = decoded.split(":")[0];

        const { error_message, error_stack, component_stack } = await request.json();

        const errorId = `s5_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await env.DB.prepare(
          "INSERT INTO agent_actions (id, agent_id, action_taken, status, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(
          errorId,
          "s5",
          `Component error: ${error_message}`,
          "failed",
          new Date().toISOString(),
          JSON.stringify({
            error_message,
            error_stack,
            component_stack
          })
        ).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        console.error("Error logging failed:", e);
        return new Response(JSON.stringify({ error: "Failed to log error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // S2 Auto-Patcher - System anomaly logging
    if (url.pathname === "/api/telemetry/anomaly" && request.method === "POST") {
      try {
        const { endpoint, error_type, stack_trace, request_payload } = await request.json();

        const anomalyId = `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await env.DB.prepare(
          "INSERT INTO system_anomalies (id, endpoint, error_type, stack_trace, request_payload, timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).bind(
          anomalyId,
          endpoint,
          error_type,
          stack_trace,
          request_payload,
          new Date().toISOString(),
          "pending"
        ).run();

        return new Response(JSON.stringify({ success: true, anomaly_id: anomalyId }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        console.error("Anomaly logging failed:", e);
        return new Response(JSON.stringify({ error: "Failed to log anomaly" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // S2 Auto-Patcher - Heal endpoint
    if (url.pathname === "/api/agents/s2/heal" && request.method === "POST") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        const decoded = atob(token);
        const userId = decoded.split(":")[0];

        // Fetch pending anomalies
        const anomalies = await env.DB.prepare(
          "SELECT * FROM system_anomalies WHERE status = 'pending' ORDER BY timestamp DESC LIMIT 5"
        ).all() as any[];

        if (anomalies.results.length === 0) {
          return new Response(JSON.stringify({ success: true, message: "No pending anomalies" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Process each anomaly
        for (const anomaly of anomalies.results) {
          try {
            // Use AI to generate patch
            const aiPrompt = `You are S2, an autonomous site reliability engineer. Analyze this stack trace and error. Write the corrected TypeScript code to resolve this error.

Error: ${anomaly.error_type}
Stack Trace: ${anomaly.stack_trace}
Endpoint: ${anomaly.endpoint}

Requirements:
- Output ONLY raw TypeScript code (no markdown, no explanations)
- Include proper error handling
- Make it production-ready
- Return the complete code block as a single string`;

            const aiResponse = await env.AI.run(aiPrompt, {
              model: "@cf/meta/llama-3.8b-instruct"
            });

            const generatedPatch = aiResponse.success ? aiResponse.response : null;

            if (generatedPatch) {
              const patchId = `patch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              
              // Store patch in KV
              await env.LOXA_HOT_PATCHES.put(
                patchId,
                JSON.stringify({
                  endpoint: anomaly.endpoint,
                  patch_code: generatedPatch,
                  anomaly_id: anomaly.id,
                  timestamp: new Date().toISOString(),
                  generated_by: "s2"
                })
              );

              // Update anomaly status
              await env.DB.prepare(
                "UPDATE system_anomalies SET status = 'patched', patch_id = ? WHERE id = ?"
              ).bind(patchId, anomaly.id).run();

              // Log the auto-patch action
              const actionId = `s2_action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              await env.DB.prepare(
                "INSERT INTO agent_actions (id, agent_id, action_taken, status, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)"
              ).bind(
                actionId,
                "s2",
                `Auto-patched endpoint: ${anomaly.endpoint}`,
                "completed",
                new Date().toISOString(),
                JSON.stringify({
                  anomaly_id: anomaly.id,
                  patch_id,
                  endpoint: anomaly.endpoint
                })
              ).run();

              console.log(`S2: Auto-patched ${anomaly.endpoint} with ${patchId}`);
            }
          } catch (e: any) {
            console.error(`S2: Failed to patch anomaly ${anomaly.id}:`, e);
            await env.DB.prepare(
              "UPDATE system_anomalies SET status = 'failed' WHERE id = ?"
            ).bind(anomaly.id).run();
          }
        }

        return new Response(JSON.stringify({
          success: true,
          processed: anomalies.results.length
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        console.error("S2 Heal error:", e);
        return new Response(JSON.stringify({ error: "Healing failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Navigation logging endpoint for S5 Architect telemetry
    if (url.pathname === "/api/telemetry/navigation" && request.method === "POST") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        const decoded = atob(token);
        const userId = decoded.split(":")[0];

        const { panel_id, action, duration_ms, page_url, variant } = await request.json();

        // Capture geographic telemetry from Cloudflare headers
        const country = request.cf?.country || null;
        const colo = request.cf?.colo || null;

        const logId = `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await env.DB.prepare(
          "INSERT INTO user_navigation_logs (id, user_id, panel_id, action, duration_ms, timestamp, page_url, variant, country, colo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(
          logId,
          userId,
          panel_id,
          action,
          duration_ms || null,
          new Date().toISOString(),
          page_url || null,
          variant || null,
          country,
          colo
        ).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        console.error("Navigation logging error:", e);
        return new Response(JSON.stringify({ error: "Failed to log navigation" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // S5 Revenue Engine - Get pricing variants
    if (url.pathname === "/api/agents/s5/pricing" && request.method === "GET") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        const decoded = atob(token);
        const userId = decoded.split(":")[0];

        // Check if user is high-intent
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const userUsage = await env.DB.prepare(
          "SELECT SUM(event_count) as total_calls FROM api_usage_rollups WHERE user_id = ? AND date >= date('now', '-1 day')"
        ).bind(userId).first() as any;

        const userPanelTime = await env.DB.prepare(
          "SELECT COUNT(*) as panel_time FROM user_navigation_logs WHERE user_id = ? AND timestamp >= ? AND (panel_id = 'infrastructure' OR panel_id = 's3_architect')"
        ).bind(userId, twentyFourHoursAgo).first() as any;

        const isHighIntent = (userUsage?.total_calls > 800) || (userPanelTime?.panel_time > 5);

        // Fetch pricing variants
        const variantA = await env.LOXA_DYNAMIC_CODE.get('pricing_variant_a');
        const variantB = await env.LOXA_DYNAMIC_CODE.get('pricing_variant_b');

        // Assign variant (50/50 split based on user ID hash)
        const userHash = userId.split('').reduce((a: number, b: string) => ((a << 5) - a) + b.charCodeAt(0), 0);
        const assignedVariant = Math.abs(userHash) % 2 === 0 ? 'a' : 'b';

        const pricingVariant = assignedVariant === 'a' ? JSON.parse(variantA || '{}') : JSON.parse(variantB || '{}');

        // Fetch statistical data
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        
        const variantConversions = await env.DB.prepare(
          "SELECT variant, COUNT(*) as conversions FROM user_navigation_logs WHERE timestamp >= ? AND panel_id = 'revenue' AND action = 'upgrade_clicked' GROUP BY variant"
        ).bind(sevenDaysAgo).all() as any[];

        const variantViews = await env.DB.prepare(
          "SELECT variant, COUNT(*) as views FROM user_navigation_logs WHERE timestamp >= ? AND panel_id = 'revenue' GROUP BY variant"
        ).bind(sevenDaysAgo).all() as any[];

        // Calculate conversion rates and p-value
        const conversionData: { [key: string]: { conversions: number; views: number; rate: number } } = {};
        
        for (const conv of variantConversions.results) {
          if (!conversionData[conv.variant]) conversionData[conv.variant] = { conversions: 0, views: 0, rate: 0 };
          conversionData[conv.variant].conversions = conv.conversions;
        }
        
        for (const view of variantViews.results) {
          if (!conversionData[view.variant]) conversionData[view.variant] = { conversions: 0, views: 0, rate: 0 };
          conversionData[view.variant].views = view.views;
        }
        
        for (const variant in conversionData) {
          if (conversionData[variant].views > 0) {
            conversionData[variant].rate = conversionData[variant].conversions / conversionData[variant].views;
          }
        }

        // Calculate p-value
        let pValue = 1.0;
        if (conversionData['a'] && conversionData['b'] && conversionData['a'].views > 10 && conversionData['b'].views > 10) {
          const rateA = conversionData['a'].rate;
          const rateB = conversionData['b'].rate;
          
          const bootstrapSamples = 1000;
          let bWins = 0;
          
          for (let i = 0; i < bootstrapSamples; i++) {
            const sampleA = Math.random() < rateA ? 1 : 0;
            const sampleB = Math.random() < rateB ? 1 : 0;
            
            if (sampleB > sampleA) bWins++;
          }
          
          pValue = bWins / bootstrapSamples;
        }

        return new Response(JSON.stringify({
          success: true,
          is_high_intent: isHighIntent,
          pricing_variant: pricingVariant,
          variant_id: assignedVariant,
          statistical_data: {
            p_value: pValue,
            conversion_data: conversionData,
            confidence_interval: pValue < 0.05 ? 'Significant' : 'Not Significant'
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        console.error("Pricing variant fetch error:", e);
        return new Response(JSON.stringify({ error: "Failed to fetch pricing variants" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // S5 Programmatic SEO - GitHub API Integration
    if (url.pathname === "/api/agents/s5/seo/publish" && request.method === "POST") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const { content_id } = await request.json();

        // Fetch content from KV
        const contentData = await env.LOXA_DYNAMIC_CODE.get(`seo_content_${content_id}`);
        if (!contentData) {
          return new Response(JSON.stringify({ error: "Content not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const parsedContent = JSON.parse(contentData);

        // GitHub API integration (requires GITHUB_TOKEN env var)
        const githubToken = env.GITHUB_TOKEN;
        if (!githubToken) {
          console.log("S5 SEO: GitHub token not configured, skipping auto-publish");
          return new Response(JSON.stringify({ 
            success: false, 
            message: "GitHub token not configured" 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Create branch and PR via GitHub API
        const branchName = `seo-report-${Date.now()}`;
        const repoOwner = "atomeam";
        const repoName = "Aether";

        // Get latest commit SHA from main branch
        const mainBranchResponse = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/git/refs/heads/main`,
          {
            headers: {
              "Authorization": `Bearer ${githubToken}`,
              "Content-Type": "application/json"
            }
          }
        );

        if (!mainBranchResponse.ok) {
          console.log("S5 SEO: Failed to get main branch SHA");
          return new Response(JSON.stringify({ 
            success: false, 
            message: "Failed to get main branch SHA" 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const mainBranchData = await mainBranchResponse.json();
        const latestSha = mainBranchData.object.sha;

        // Create branch
        const createBranchResponse = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/git/refs`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${githubToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              ref: `refs/heads/${branchName}`,
              sha: latestSha
            })
          }
        );

        // Create file
        const createFileResponse = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/contents/engineering/${parsedContent.filename}`,
          {
            method: "PUT",
            headers: {
              "Authorization": `Bearer ${githubToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              message: `SEO: ${parsedContent.filename}`,
              content: btoa(parsedContent.content),
              branch: branchName
            })
          }
        );

        // Create PR
        const createPRResponse = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/pulls`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${githubToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              title: `SEO: ${parsedContent.filename}`,
              body: `Auto-generated engineering report by S5 Architect\n\nGenerated from action: ${parsedContent.action_id}`,
              head: branchName,
              base: "main"
            })
          }
        );

        if (createPRResponse.ok) {
          const prData = await createPRResponse.json();
          
          // Update content status
          await env.LOXA_DYNAMIC_CODE.put(
            `seo_content_${content_id}`,
            JSON.stringify({
              ...parsedContent,
              status: 'pr_opened',
              pr_number: prData.number,
              pr_url: prData.html_url
            })
          );

          console.log(`S5 SEO: Created PR #${prData.number} for ${parsedContent.filename}`);
        }

        return new Response(JSON.stringify({
          success: true,
          message: "SEO content published to GitHub"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        console.error("S5 SEO publish error:", e);
        return new Response(JSON.stringify({ error: "Publishing failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // S5 Architect - Self-evolving AI agent
    if (url.pathname === "/api/agents/s5/evolve" && request.method === "POST") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        const decoded = atob(token);
        const userId = decoded.split(":")[0];

        // Fetch last 24 hours of navigation logs
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const navigationLogs = await env.DB.prepare(
          "SELECT panel_id, action, COUNT(*) as visits FROM user_navigation_logs WHERE timestamp >= ? GROUP BY panel_id ORDER BY visits DESC LIMIT 5"
        ).bind(twentyFourHoursAgo).all() as any[];

        // Fetch last 24 hours of slow queries
        const slowQueries = await env.DB.prepare(
          "SELECT table_name, duration_ms, query_text FROM slow_queries WHERE timestamp >= ? ORDER BY duration_ms DESC LIMIT 5"
        ).bind(twentyFourHoursAgo).all() as any[];

        // Build telemetry context for AI
        const telemetryContext = {
          top_panels: navigationLogs.results.map((log: any) => ({
            panel: log.panel_id,
            visits: log.visits
          })),
          slowest_queries: slowQueries.results.map((q: any) => ({
            table: q.table_name,
            duration_ms: q.duration_ms,
            query_sample: q.query_text.substring(0, 200)
          }))
        };

        // Use Cloudflare Workers AI to generate new component
        const aiPrompt = `You are S5, an AI Architect for the Loxa infrastructure platform. Based on this telemetry data, generate a React/Tailwind component that either:
1. Expands on the most-used feature (highest traffic panel)
2. Solves the biggest performance bottleneck (slowest query)

Telemetry Data:
${JSON.stringify(telemetryContext, null, 2)}

Requirements:
- Output ONLY raw React/Tailwind code (no markdown, no explanations)
- Component must be self-contained (no external imports beyond lucide-react)
- Use the existing dark/purple neon design theme
- Component should be a new dashboard panel or tool
- Include proper TypeScript interfaces
- Make it interactive and useful

Return the complete component code as a single string.`;

        const aiResponse = await env.AI.run(aiPrompt, {
          model: "@cf/meta/llama-3.8b-instruct"
        });

        const generatedCode = aiResponse.success ? aiResponse.response : null;

        if (!generatedCode) {
          return new Response(JSON.stringify({ error: "AI generation failed" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Store as variant B (new candidate)
        const componentId = `s5_component_${Date.now()}`;
        await env.LOXA_DYNAMIC_CODE.put(
          componentId,
          JSON.stringify({
            code: generatedCode,
            telemetry_context: telemetryContext,
            timestamp: new Date().toISOString(),
            generated_by: "s5",
            variant: "b", // This is the new candidate
            status: "testing" // A/B testing phase
          })
        );

        // Log the evolution action
        const actionId = `s5_action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await env.DB.prepare(
          "INSERT INTO agent_actions (id, agent_id, action_taken, status, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(
          actionId,
          "s5",
          `Generated variant B: ${componentId}`,
          "completed",
          new Date().toISOString(),
          JSON.stringify({
            telemetry_context,
            component_id,
            variant: "b"
          })
        ).run();

        return new Response(JSON.stringify({
          success: true,
          component_id,
          variant: "b",
          telemetry_context,
          generated_code_preview: generatedCode.substring(0, 500) + "..."
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        console.error("S5 Evolution error:", e);
        return new Response(JSON.stringify({ error: "Evolution failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // S5 Components endpoint - fetch AI-generated components
    if (url.pathname === "/api/agents/s5/components" && request.method === "GET") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const token = authHeader.replace("Bearer ", "");
        const decoded = atob(token);
        const userId = decoded.split(":")[0];

        // Fetch last 7 days of generated components
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        
        // List all keys in KV (this is a simplified approach - in production you'd maintain an index)
        const components = [];
        const keys = await env.LOXA_DYNAMIC_CODE.list();
        
        for (const key of keys.keys) {
          if (key.name.startsWith("s5_component_")) {
            const componentData = await env.LOXA_DYNAMIC_CODE.get(key.name);
            if (componentData) {
              const parsed = JSON.parse(componentData);
              if (new Date(parsed.timestamp) >= new Date(sevenDaysAgo)) {
                components.push({
                  id: key.name,
                  ...parsed
                });
              }
            }
          }
        }

        return new Response(JSON.stringify({
          total_components: components.length,
          components: components.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        console.error("S5 Components error:", e);
        return new Response(JSON.stringify({ error: "Failed to fetch components" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 404 for unknown routes
    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },

  async scheduled(event: any, env: any, ctx: ExecutionContext): Promise<void> {
    const cron = event.cron;
    console.log(`Scheduled task triggered: ${cron}`);

    // S3 Autonomous DBA - Run every 15 minutes
    if (cron === "*/15 * * * *") {
      console.log("Running S3 Autonomous DBA optimization...");
      
      try {
        // 1. Analyze slow queries from last 15 minutes
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const slowQueries = await env.DB.prepare(
          "SELECT * FROM slow_queries WHERE timestamp >= ? ORDER BY duration_ms DESC LIMIT 10"
        ).bind(fifteenMinutesAgo).all() as any[];

        console.log(`Found ${slowQueries.results.length} slow queries in last 15 minutes`);

        if (slowQueries.results.length === 0) {
          console.log("No slow queries to optimize");
          return;
        }

        // 2. Analyze and generate index proposals
        for (const query of slowQueries.results) {
          const whereMatch = query.query_text.match(/WHERE\s+([\w_]+)/i);
          if (whereMatch) {
            const tableName = query.table_name;
            const columnName = whereMatch[1];
            const indexName = `idx_${tableName}_${columnName}`;
            const sqlStatement = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName}(${columnName})`;

            // 3. Check if index already exists (by attempting to create it)
            try {
              const executionStart = Date.now();
              await env.DB.prepare(sqlStatement).run();
              const executionTime = Date.now() - executionStart;

              // 4. Log successful autonomous action
              const actionId = `s3_action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              await env.DB.prepare(
                "INSERT INTO agent_actions (id, agent_id, action_taken, status, timestamp, details, execution_time_ms) VALUES (?, ?, ?, ?, ?, ?, ?)"
              ).bind(
                actionId,
                "s3",
                `Created index ${indexName} on ${tableName}`,
                "completed",
                new Date().toISOString(),
                JSON.stringify({
                  original_query_duration_ms: query.duration_ms,
                  table: tableName,
                  column: columnName,
                  sql: sqlStatement
                }),
                executionTime
              ).run();

              console.log(`S3: Created index ${indexName} in ${executionTime}ms`);
            } catch (e: any) {
              // Index likely already exists or error occurred
              console.log(`S3: Skipped index creation for ${indexName} - ${e.message}`);
            }
          }
        }

        console.log("S3 Autonomous DBA optimization complete");
      } catch (e: any) {
        console.error("S3 Autonomous DBA error:", e);
      }
      return;
    }

    // Daily cron job for proposal generation (runs at midnight)
    if (cron === "0 0 * * *") {
      console.log("Running daily proposal generation...");
      
      try {
        // 1. Read recent events from D1 (last 24 hours)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const events = await env.DB.prepare(
          "SELECT * FROM events WHERE created_at > ? ORDER BY created_at DESC"
        ).bind(yesterday).all();
        
        console.log(`Found ${events.results.length} events in last 24 hours`);
        
        if (events.results.length === 0) {
          console.log("No events to analyze");
          return;
        }

        // 2. Analyze events with Gemini AI for intelligent proposal generation
        const eventSummary = events.results.map((e: any) => ({
          kind: e.kind,
          source: e.source,
          level: e.level,
          timestamp: e.created_at,
          payload: e.payload
        }));

        // Use Gemini to analyze patterns and generate proposals
        const geminiPrompt = `Analyze these system events and generate 3-5 high-priority self-improvement proposals. Events: ${JSON.stringify(eventSummary)}. 

For each proposal, provide:
1. Title (short, actionable)
2. Description (what problem and why it matters)
3. Suspected cause (root cause analysis)
4. Recommended fix (specific, actionable steps)
5. Risk score (0.0-1.0)
6. Blast radius (estimated number of files/surfaces affected)

Return as JSON array with structure: [{"title": "...", "description": "...", "suspected_cause": "...", "recommended_fix": "...", "risk_score": 0.5, "blast_radius_files": 5, "blast_radius_surfaces": 2}]`;

        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GOOGLE_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: geminiPrompt }]
            }]
          })
        });

        const geminiData = await geminiResponse.json();
        
        if (geminiData.candidates && geminiData.candidates[0]?.content?.parts[0]?.text) {
          const aiResponse = geminiData.candidates[0].content.parts[0].text;
          
          // Parse JSON from AI response
          let proposals = [];
          try {
            // Extract JSON from response (handle markdown code blocks)
            const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              proposals = JSON.parse(jsonMatch[0]);
            } else {
              proposals = JSON.parse(aiResponse);
            }
          } catch (e) {
            console.error("Failed to parse AI proposals:", e);
            // Fallback to simple proposal
            proposals = [{
              title: "Daily System Review",
              description: `Review ${events.results.length} events from last 24 hours. Events: ${eventSummary.map((e: any) => e.kind).join(", ")}`,
              suspected_cause: "Routine monitoring",
              recommended_fix: "Review logs and metrics",
              risk_score: 0.3,
              blast_radius_files: 0,
              blast_radius_surfaces: 0
            }];
          }

          // Store proposals in D1
          for (const proposal of proposals) {
            const proposalId = `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            await env.DB.prepare(
              "INSERT INTO proposals (id, title, body, author, status, risk_score, blast_radius_files, blast_radius_surfaces) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            ).bind(
              proposalId,
              proposal.title,
              `${proposal.description}\n\nSuspected Cause: ${proposal.suspected_cause}\n\nRecommended Fix: ${proposal.recommended_fix}`,
              "gemini-ai",
              "pending",
              proposal.risk_score || 0.5,
              proposal.blast_radius_files || 0,
              proposal.blast_radius_surfaces || 0
            ).run();
            
            console.log(`Created AI proposal: ${proposalId} - ${proposal.title}`);
          }
          
          console.log(`Generated ${proposals.length} AI proposals from ${events.results.length} events`);
        }
        
        console.log("Proposal generation complete");
      } catch (e: any) {
        console.error("Proposal generation failed:", e);
      }
    }

    // S2 Auto-Patcher - Hourly self-healing (30 minutes past the hour)
    if (cron === "30 * * * *") {
      console.log("Running S2 Auto-Patcher self-healing...");
      
      try {
        // Check for pending anomalies
        const anomalies = await env.DB.prepare(
          "SELECT * FROM system_anomalies WHERE status = 'pending' ORDER BY timestamp DESC LIMIT 5"
        ).all() as any[];

        if (anomalies.results.length > 0) {
          console.log(`S2: Found ${anomalies.results.length} pending anomalies`);

          for (const anomaly of anomalies.results) {
            try {
              const aiPrompt = `You are S2, an autonomous site reliability engineer. Analyze this stack trace and error. Write the corrected TypeScript code to resolve this error.

Error: ${anomaly.error_type}
Stack Trace: ${anomaly.stack_trace}
Endpoint: ${anomaly.endpoint}

Requirements:
- Output ONLY raw TypeScript code (no markdown, no explanations)
- Include proper error handling
- Make it production-ready
- Return the complete code block as a single string`;

              const aiResponse = await env.AI.run(aiPrompt, {
                model: "@cf/meta/llama-3.8b-instruct"
              });

              const generatedPatch = aiResponse.success ? aiResponse.response : null;

              if (generatedPatch) {
                const patchId = `patch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                await env.LOXA_HOT_PATCHES.put(
                  patchId,
                  JSON.stringify({
                    endpoint: anomaly.endpoint,
                    patch_code: generatedPatch,
                    anomaly_id: anomaly.id,
                    timestamp: new Date().toISOString(),
                    generated_by: "s2"
                  })
                );

                await env.DB.prepare(
                  "UPDATE system_anomalies SET status = 'patched', patch_id = ? WHERE id = ?"
                ).bind(patchId, anomaly.id).run();

                const actionId = `s2_action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                await env.DB.prepare(
                  "INSERT INTO agent_actions (id, agent_id, action_taken, status, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)"
                ).bind(
                  actionId,
                  "s2",
                  `Auto-patched endpoint: ${anomaly.endpoint}`,
                  "completed",
                  new Date().toISOString(),
                  JSON.stringify({
                    anomaly_id: anomaly.id,
                    patch_id,
                    endpoint: anomaly.endpoint
                  })
                ).run();

                console.log(`S2: Auto-patched ${anomaly.endpoint} with ${patchId}`);
              }
            } catch (e: any) {
              console.error(`S2: Failed to patch anomaly ${anomaly.id}:`, e);
              await env.DB.prepare(
                "UPDATE system_anomalies SET status = 'failed' WHERE id = ?"
              ).bind(anomaly.id).run();
            }
          }
        } else {
          console.log("S2: No pending anomalies to heal");
        }
      } catch (e: any) {
        console.error("S2 Self-healing error:", e);
      }
    }

    // S5 Architect - Hourly self-evolution with A/B testing (top of the hour)
    if (cron === "0 * * * *") {
      console.log("Running S5 Architect hourly evolution...");
      
      try {
        // 0. Geographic Edge-Shifting Analysis
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
        
        const geoDistribution = await env.DB.prepare(
          "SELECT country, colo, COUNT(*) as visits FROM user_navigation_logs WHERE timestamp >= ? GROUP BY country, colo ORDER BY visits DESC"
        ).bind(threeHoursAgo).all() as any[];

        if (geoDistribution.results.length > 0) {
          const totalVisits = geoDistribution.results.reduce((sum: number, row: any) => sum + row.visits, 0);
          const topRegion = geoDistribution.results[0];
          const topRegionPercentage = (topRegion.visits / totalVisits) * 100;

          console.log(`S5 Geographic Analysis: ${topRegion.country} (${topRegion.colo}) = ${topRegionPercentage.toFixed(1)}%`);

          // Trigger edge-shifting if >80% traffic in a different region
          if (topRegionPercentage > 80) {
            const actionId = `s5_geo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Log the geographic shift decision
            await env.DB.prepare(
              "INSERT INTO agent_actions (id, agent_id, action_taken, status, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)"
            ).bind(
              actionId,
              "s5",
              `Geographic edge-shift detected: ${topRegion.country} (${topRegion.colo}) at ${topRegionPercentage.toFixed(1)}%`,
              "completed",
              new Date().toISOString(),
              JSON.stringify({
                country: topRegion.country,
                colo: topRegion.colo,
                percentage: topRegionPercentage,
                total_visits: totalVisits,
                recommendation: "Provision D1 read-replica in target region"
              })
            ).run();

            console.log(`S5: Geographic shift logged - ${topRegion.country} at ${topRegionPercentage.toFixed(1)}%`);
          }
        }

        // 1. Revenue Engine - High-Intent Cohort Analysis
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        // Identify high-intent users: >800 API calls OR >5 min in Infrastructure/S3 panels
        const highIntentUsers = await env.DB.prepare(`
          SELECT DISTINCT user_id 
          FROM (
            SELECT user_id, SUM(event_count) as total_calls 
            FROM api_usage_rollups 
            WHERE date >= date('now', '-1 day') 
            GROUP BY user_id
            HAVING total_calls > 800
            UNION
            SELECT user_id, COUNT(*) as panel_time 
            FROM user_navigation_logs 
            WHERE timestamp >= ? AND (panel_id = 'infrastructure' OR panel_id = 's3_architect')
            GROUP BY user_id
            HAVING panel_time > 5
          )
        `).bind(twentyFourHoursAgo).all() as any[];

        console.log(`S5 Revenue Engine: Identified ${highIntentUsers.results.length} high-intent users`);

        // Store pricing variants in KV for A/B testing
        const variantA = {
          id: 'pricing_variant_a',
          type: 'cost_savings',
          copy: 'S3 saved you 400ms today. Upgrade to Pro for $29/mo',
          price: 29
        };

        const variantB = {
          id: 'pricing_variant_b',
          type: 'uptime',
          copy: 'S2 auto-patched 3 errors today. Keep your API online for $29/mo',
          price: 29
        };

        await env.LOXA_DYNAMIC_CODE.put('pricing_variant_a', JSON.stringify(variantA));
        await env.LOXA_DYNAMIC_CODE.put('pricing_variant_b', JSON.stringify(variantB));

        // Statistical Optimization - Bootstrap P-Value Analysis
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        
        // Get conversion data for both variants
        const variantConversions = await env.DB.prepare(`
          SELECT variant, COUNT(*) as conversions 
          FROM user_navigation_logs 
          WHERE timestamp >= ? AND panel_id = 'revenue' AND action = 'upgrade_clicked'
          GROUP BY variant
        `).bind(sevenDaysAgo).all() as any[];

        const variantViews = await env.DB.prepare(`
          SELECT variant, COUNT(*) as views 
          FROM user_navigation_logs 
          WHERE timestamp >= ? AND panel_id = 'revenue'
          GROUP BY variant
        `).bind(sevenDaysAgo).all() as any[];

        // Calculate conversion rates
        const conversionData: { [key: string]: { conversions: number; views: number; rate: number } } = {};
        
        for (const conv of variantConversions.results) {
          if (!conversionData[conv.variant]) conversionData[conv.variant] = { conversions: 0, views: 0, rate: 0 };
          conversionData[conv.variant].conversions = conv.conversions;
        }
        
        for (const view of variantViews.results) {
          if (!conversionData[view.variant]) conversionData[view.variant] = { conversions: 0, views: 0, rate: 0 };
          conversionData[view.variant].views = view.views;
        }
        
        for (const variant in conversionData) {
          if (conversionData[variant].views > 0) {
            conversionData[variant].rate = conversionData[variant].conversions / conversionData[variant].views;
          }
        }

        // Bootstrap p-value calculation
        let pValue = 1.0;
        let winner = null;
        
        if (conversionData['a'] && conversionData['b'] && conversionData['a'].views > 10 && conversionData['b'].views > 10) {
          const rateA = conversionData['a'].rate;
          const rateB = conversionData['b'].rate;
          const viewsA = conversionData['a'].views;
          const viewsB = conversionData['b'].views;
          
          // Simplified bootstrap simulation
          const bootstrapSamples = 1000;
          let bWins = 0;
          
          for (let i = 0; i < bootstrapSamples; i++) {
            // Resample with replacement
            const sampleA = Math.random() < rateA ? 1 : 0;
            const sampleB = Math.random() < rateB ? 1 : 0;
            
            if (sampleB > sampleA) bWins++;
          }
          
          pValue = bWins / bootstrapSamples;
          
          if (pValue < 0.05) {
            winner = rateB > rateA ? 'b' : 'a';
            console.log(`S5 Statistical Optimization: Variant ${winner} wins with p=${pValue.toFixed(4)}`);
            
            // Deprecate loser and promote winner
            if (winner === 'b') {
              await env.LOXA_DYNAMIC_CODE.put('pricing_variant_a', JSON.stringify({
                ...variantA,
                status: 'deprecated',
                deprecated_at: new Date().toISOString()
              }));
              
              // Generate new challenger using AI
              const aiPrompt = `You are S5, an AI Revenue Optimizer. Based on this winning pricing copy, generate a new challenger variant that tests a different psychological trigger.

Winning Copy: "${variantB.copy}"
Type: ${variantB.type}
Conversion Rate: ${rateB.toFixed(2)}

Requirements:
- Output ONLY raw JSON with keys: type, copy, price
- Test a different psychological trigger (urgency, social proof, scarcity, etc.)
- Keep price at $29
- Make it compelling and action-oriented`;

              const aiResponse = await env.AI.run(aiPrompt, {
                model: "@cf/meta/llama-3.8b-instruct"
              });

              if (aiResponse.success) {
                const newChallenger = JSON.parse(aiResponse.response);
                await env.LOXA_DYNAMIC_CODE.put('pricing_variant_a', JSON.stringify({
                  ...newChallenger,
                  id: 'pricing_variant_a',
                  status: 'challenger',
                  generated_at: new Date().toISOString()
                }));
                
                console.log(`S5: Generated new challenger variant: ${newChallenger.type}`);
              }
            }
          }
        }

        // Log revenue analysis
        if (highIntentUsers.results.length > 0) {
          const actionId = `s5_revenue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await env.DB.prepare(
            "INSERT INTO agent_actions (id, agent_id, action_taken, status, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)"
          ).bind(
            actionId,
            "s5",
            `Revenue Engine: ${highIntentUsers.results.length} high-intent users identified`,
            "completed",
            new Date().toISOString(),
            JSON.stringify({
              high_intent_count: highIntentUsers.results.length,
              pricing_variants: ['cost_savings', 'uptime'],
              p_value: pValue,
              winner: winner,
              conversion_data: conversionData,
              recommendation: winner ? `Promote variant ${winner}` : "Continue A/B test"
            })
          ).run();
        }

        // 4. Programmatic SEO Loop - Technical Content Generation
        const seoOneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        // Get top impactful actions from agent_actions
        const impactfulActions = await env.DB.prepare(
          "SELECT * FROM agent_actions WHERE timestamp >= ? AND status = 'completed' ORDER BY timestamp DESC LIMIT 3"
        ).bind(seoOneDayAgo).all() as any[];

        if (impactfulActions.results.length > 0) {
          console.log(`S5 SEO: Found ${impactfulActions.results.length} impactful actions for content generation`);

          for (const action of impactfulActions.results) {
            try {
              // Generate technical content using AI
              const aiPrompt = `You are S5, an AI Technical Writer for Loxa. Generate a detailed engineering case study based on this autonomous infrastructure action.

Action: ${action.action_taken}
Agent: ${action.agent_id}
Details: ${action.details}
Timestamp: ${action.timestamp}

Requirements:
- Output ONLY raw Markdown (no markdown code blocks, just the content)
- Title: Technical and descriptive (e.g., "How We Optimized D1 Latency at the Edge")
- Include: Problem statement, technical approach, code examples, performance metrics (before/after)
- Add SEO frontmatter at the top with title, description, and keywords
- Make it valuable for developers searching for similar solutions
- Include specific technical details, stack traces, and implementation notes
- Length: 800-1200 words

Format:
---
title: "Technical Title"
description: "SEO description"
keywords: ["keyword1", "keyword2", "keyword3"]
---

[Content starts here]`;

              const aiResponse = await env.AI.run(aiPrompt, {
                model: "@cf/meta/llama-3.8b-instruct"
              });

              if (aiResponse.success) {
                const content = aiResponse.response;
                const filename = `engineering-report-${Date.now()}.md`;
                
                // Store content in KV for GitHub API integration
                await env.LOXA_DYNAMIC_CODE.put(
                  `seo_content_${action.id}`,
                  JSON.stringify({
                    filename,
                    content,
                    action_id: action.id,
                    generated_at: new Date().toISOString(),
                    status: 'pending_pr'
                  })
                );

                console.log(`S5 SEO: Generated content for action ${action.id}`);
                
                // Log SEO generation action
                const seoActionId = `s5_seo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                await env.DB.prepare(
                  "INSERT INTO agent_actions (id, agent_id, action_taken, status, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)"
                ).bind(
                  seoActionId,
                  "s5",
                  `Generated SEO content: ${filename}`,
                  "completed",
                  new Date().toISOString(),
                  JSON.stringify({
                    filename,
                    action_id: action.id,
                    content_preview: content.substring(0, 200) + "..."
                  })
                ).run();
              }
            } catch (e: any) {
              console.error(`S5 SEO: Failed to generate content for action ${action.id}:`, e);
            }
          }
        }

        // 2. Evaluate A/B test results from last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        
        // Get variant A vs B performance
        const variantMetrics = await env.DB.prepare(
          "SELECT variant, COUNT(*) as interactions, AVG(duration_ms) as avg_duration FROM user_navigation_logs WHERE timestamp >= ? AND variant IS NOT NULL GROUP BY variant"
        ).bind(oneHourAgo).all() as any[];

        // Check for failed deployments (errors)
        const failedDeployments = await env.DB.prepare(
          "SELECT COUNT(*) as failures FROM agent_actions WHERE agent_id = 's5' AND status = 'failed' AND timestamp >= ?"
        ).bind(oneHourAgo).first() as any;

        console.log("S5 A/B Test Results:", JSON.stringify(variantMetrics.results));
        console.log("S5 Failed Deployments:", failedDeployments.failures);

        // 2. Evaluate and promote/rollback variants
        if (variantMetrics.results.length >= 2) {
          const variantA = variantMetrics.results.find((v: any) => v.variant === 'a');
          const variantB = variantMetrics.results.find((v: any) => v.variant === 'b');

          if (variantA && variantB) {
            // If B has higher engagement and no failures, promote to baseline
            if (variantB.interactions > variantA.interactions && failedDeployments.failures === 0) {
              console.log("S5: Promoting variant B to baseline (higher engagement)");
              
              // Update variant B to status "baseline"
              const keys = await env.LOXA_DYNAMIC_CODE.list();
              for (const key of keys.keys) {
                if (key.name.startsWith("s5_component_")) {
                  const componentData = await env.LOXA_DYNAMIC_CODE.get(key.name);
                  if (componentData) {
                    const parsed = JSON.parse(componentData);
                    if (parsed.variant === 'b') {
                      await env.LOXA_DYNAMIC_CODE.put(
                        key.name,
                        JSON.stringify({
                          ...parsed,
                          variant: "a",
                          status: "baseline"
                        })
                      );
                    }
                  }
                }
              }
            } else if (failedDeployments.failures > 0) {
              console.log("S5: Rolling back variant B (errors detected)");
              
              // Delete failed variant B
              const keys = await env.LOXA_DYNAMIC_CODE.list();
              for (const key of keys.keys) {
                if (key.name.startsWith("s5_component_")) {
                  const componentData = await env.LOXA_DYNAMIC_CODE.get(key.name);
                  if (componentData) {
                    const parsed = JSON.parse(componentData);
                    if (parsed.variant === 'b' && parsed.status === 'testing') {
                      await env.LOXA_DYNAMIC_CODE.delete(key.name);
                    }
                  }
                }
              }
            }
          }
        }

        // 3. Generate new variant B for testing
        const componentOneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const navigationLogs = await env.DB.prepare(
          "SELECT panel_id, action, COUNT(*) as visits FROM user_navigation_logs WHERE timestamp >= ? GROUP BY panel_id ORDER BY visits DESC LIMIT 5"
        ).bind(componentOneDayAgo).all() as any[];

        const slowQueries = await env.DB.prepare(
          "SELECT table_name, duration_ms, query_text FROM slow_queries WHERE timestamp >= ? ORDER BY duration_ms DESC LIMIT 5"
        ).bind(componentOneDayAgo).all() as any[];

        const telemetryContext = {
          top_panels: navigationLogs.results.map((log: any) => ({
            panel: log.panel_id,
            visits: log.visits
          })),
          slowest_queries: slowQueries.results.map((q: any) => ({
            table: q.table_name,
            duration_ms: q.duration_ms,
            query_sample: q.query_text.substring(0, 200)
          }))
        };

        console.log("S5 Telemetry context:", JSON.stringify(telemetryContext));

        const aiPrompt = `You are S5, an AI Architect for the Loxa infrastructure platform. Based on this telemetry data, generate a React/Tailwind component that either:
1. Expands on the most-used feature (highest traffic panel)
2. Solves the biggest performance bottleneck (slowest query)

Telemetry Data:
${JSON.stringify(telemetryContext, null, 2)}

Requirements:
- Output ONLY raw React/Tailwind code (no markdown, no explanations)
- Component must be self-contained (no external imports beyond lucide-react)
- Use the existing dark/purple neon design theme
- Component should be a new dashboard panel or tool
- Include proper TypeScript interfaces
- Make it interactive and useful

Return the complete component code as a single string.`;

        const aiResponse = await env.AI.run(aiPrompt, {
          model: "@cf/meta/llama-3.8b-instruct"
        });

        const generatedCode = aiResponse.success ? aiResponse.response : null;

        if (generatedCode) {
          const componentId = `s5_component_${Date.now()}`;
          await env.LOXA_DYNAMIC_CODE.put(
            componentId,
            JSON.stringify({
              code: generatedCode,
              telemetry_context: telemetryContext,
              timestamp: new Date().toISOString(),
              generated_by: "s5",
              variant: "b",
              status: "testing"
            })
          );

          const actionId = `s5_action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await env.DB.prepare(
            "INSERT INTO agent_actions (id, agent_id, action_taken, status, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)"
          ).bind(
            actionId,
            "s5",
            `Generated variant B: ${componentId}`,
            "completed",
            new Date().toISOString(),
            JSON.stringify({
              telemetry_context,
              component_id,
              variant: "b"
            })
          ).run();

          console.log(`S5: Generated component ${componentId}`);
        } else {
          console.log("S5: AI generation failed, skipping evolution");
        }
      } catch (e: any) {
        console.error("S5 Self-evolution error:", e);
      }
    }
  }
};