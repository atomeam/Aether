/**
 * Ops Run-Close - /ops/run-close endpoint
 * Subscribes to Slack events, parses RESULT: lines, closes Notion tasks
 */

interface SlackEventPayload {
  type: string;
  event: {
    type: string;
    text: string;
    channel: string;
    ts: string;
    user?: string;
  };
  challenge?: string;
}

interface Env {
  NOTION_TOKEN: string;
  SLACK_SIGNING_SECRET: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  });
}

function error(message: string, status = 500): Response {
  return json({ error: message }, status);
}

// Constant-time string comparison for Slack signature verification
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  
  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }
  
  return result === 0;
}

// Verify Slack signature
async function verifySlackSignature(request: Request, env: Env): Promise<boolean> {
  const timestamp = request.headers.get('x-slack-request-timestamp');
  const signature = request.headers.get('x-slack-signature');
  
  if (!timestamp || !signature) return false;
  
  // Reject requests older than 5 minutes (replay protection)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) return false;
  
  const body = await request.clone().text();
  const baseString = `v0:${timestamp}:${body}`;
  
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.SLACK_SIGNING_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(baseString));
  const signatureHex = [...new Uint8Array(signatureBytes)]
    .map(b => b.toString(16).padStart(2, '0')).join('');
  
  const expectedSignature = `v0=${signatureHex}`;
  
  return timingSafeEqual(signature, expectedSignature);
}

// Parse RESULT: line from Slack message
export function parseResultLine(text: string): { run_id: string; result: string } | null {
  const resultMatch = text.match(/RESULT\s+\(([^)]+)\):\s*(.+)/i);
  if (!resultMatch) return null;
  
  return {
    run_id: resultMatch[1],
    result: resultMatch[2],
  };
}

// Extract task_id from RUN header (Notion page URL)
export function parseTaskId(text: string): string | null {
  const taskMatch = text.match(/TASK:\s*(https:\/\/www\.notion\.so\/[^\s]+)/i);
  if (!taskMatch) return null;
  
  return taskMatch[1];
}

// Close Notion task
async function closeNotionTask(taskId: string, result: string, env: Env): Promise<boolean> {
  try {
    // Extract page ID from Notion URL
    const pageIdMatch = taskId.match(/([a-f0-9]{32})/);
    if (!pageIdMatch) return false;
    
    const pageId = pageIdMatch[1];
    
    // Update page status to "Done"
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${env.NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        properties: {
          Status: {
            select: {
              name: 'Done',
            },
          },
        },
      }),
    });
    
    return response.ok;
  } catch (e) {
    console.error('[OPS] Failed to close Notion task:', e);
    return false;
  }
}

async function handlePostRunClose(request: Request, env: Env): Promise<Response> {
  try {
    // Handle Slack URL verification challenge
    const body = await request.json() as SlackEventPayload;
    if (body.challenge) {
      return json({ challenge: body.challenge });
    }
    
    // Verify Slack signature
    if (!await verifySlackSignature(request, env)) {
      return error('Invalid Slack signature', 401);
    }
    
    // Only process message events
    if (body.event?.type !== 'message') {
      return json({ ok: true, message: 'Event type not processed' });
    }
    
    const text = body.event.text || '';
    
    // Parse RESULT: line
    const resultLine = parseResultLine(text);
    if (!resultLine) {
      return json({ ok: true, message: 'No RESULT: line found' });
    }
    
    // Parse task_id from RUN header
    const taskId = parseTaskId(text);
    if (!taskId) {
      console.error('[OPS] No task_id found in RUN header');
      return json({ ok: true, message: 'No task_id found' });
    }
    
    // Close Notion task
    const closed = await closeNotionTask(taskId, resultLine.result, env);
    
    if (closed) {
      console.log(`[OPS] Closed task ${taskId} for run ${resultLine.run_id} with result: ${resultLine.result}`);
      return json({ 
        ok: true, 
        run_id: resultLine.run_id,
        task_id: taskId,
        result: resultLine.result,
        task_closed: true 
      });
    } else {
      console.error(`[OPS] Failed to close task ${taskId}`);
      return json({ 
        ok: true, 
        run_id: resultLine.run_id,
        task_id: taskId,
        result: resultLine.result,
        task_closed: false 
      });
    }
  } catch (e) {
    console.error('[POST /ops/run-close]', e);
    return error('Failed to process run close', 500);
  }
}

export { handlePostRunClose };
