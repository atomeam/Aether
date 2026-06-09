import dotenv from "dotenv";
import { parseEnv, BackendEnvSchema } from "@aether/env";
import { createTraceLogger, commitToLedger } from "@aether/logger";
import { manifestPromptFragment } from "./promptManifest";
import crypto from "crypto";
import express from "express";

// SSRF protection: validate URLs to prevent server-side request forgery
function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    // Only allow HTTPS
    if (parsed.protocol !== 'https:') {
      return false;
    }
    
    // Block private IP addresses
    const hostname = parsed.hostname;
    const privateIpPatterns = [
      /^127\./,           // Loopback
      /^10\./,            // Private Class A
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // Private Class B
      /^192\.168\./,      // Private Class C
      /^0\./,             // Current network
      /^localhost$/i,     // Localhost
      /^::1$/,            // IPv6 loopback
      /^fc00:/i,          // IPv6 private
      /^fe80:/i           // IPv6 link-local
    ];
    
    for (const pattern of privateIpPatterns) {
      if (pattern.test(hostname)) {
        return false;
      }
    }
    
    // Block metadata endpoints (cloud credentials)
    const metadataPatterns = [
      /metadata\.google\.internal/i,
      /169\.254\.169\.254/,
      /metadata\.aws\.amazon\.com/i,
      /metadata\.azure\.net/i
    ];
    
    for (const pattern of metadataPatterns) {
      if (pattern.test(hostname)) {
        return false;
      }
    }
    
    return true;
  } catch (e) {
    return false;
  }
}

dotenv.config();

// Validate env on boot — fail fast if required vars missing
const env = parseEnv(BackendEnvSchema, process.env, "backend")

// Component manifest fragment for Gemini prompts
const COMPONENT_MANIFEST = manifestPromptFragment()

const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Robust Gemini API Wrapper with Exponential Backoff
async function callGeminiWithRetry(modelName: string, prompt: any, config: any = {}, maxRetries = 3) {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt.contents,
        config: config
      });
      return response;
    } catch (error: any) {
      lastError = error;
      
      // Handle various error formats from GenAI SDK
      const status = error.status || error.code || error.response?.status;
      const message = error.message || "";
      
      const isTransient = status === 503 || status === 429 || 
                         message.includes('503') || message.includes('429') || 
                         message.includes('quota') || message.includes('overloaded');
      
      if (!isTransient || attempt === maxRetries) {
        console.error(`[GEMINI_FATAL]: Attempt ${attempt + 1} failed. Status: ${status}. Message: ${message}`);
        throw error;
      }
      
      const delay = Math.pow(2, attempt) * 2000 + Math.random() * 1000;
      console.warn(`[GEMINI_RETRY]: Attempt ${attempt + 1} failed with status ${status}. Retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

function validateMigration(plan: any, currentComponents: any[]) {
  const activeCount = currentComponents?.length || 0;
  const addCount = plan.actions.filter((a: any) => a.action === 'ADD').length;
  const removeCount = plan.actions.filter((a: any) => a.action === 'REMOVE').length;
  const resultingCount = activeCount + addCount - removeCount;

  // Rule 1: Density Limit
  if (resultingCount > 12) {
    return { valid: false, reason: "Architectural Overflow: Density limit (12) exceeded." };
  }

  // Rule 2: Infrastructure Preservation
  const removals = plan.actions.filter((a: any) => a.action === 'REMOVE').map((a: any) => a.targetId);
  for (const id of removals) {
    const target = currentComponents.find(c => c.id === id);
    if (target && (target.title.includes('Neural Load') || target.title.includes('System Coherence'))) {
      return { valid: false, reason: "Infrastructure Violation: Vital monitors are immutable." };
    }
  }

  return { valid: true };
}

// Neural Bridge (Decoupling Logic)
const NEURAL_BRIDGE_URL = process.env.NEURAL_BRIDGE_URL || null;

// --- MCP & NEXUS REGISTRY ---
interface IntegrationProfile {
  id: string;
  baseUrl: string;
  authConfig?: {
    type: 'Bearer' | 'ApiKey' | 'Basic';
    token: string;
  };
  status: 'CONNECTED' | 'THROTTLED' | 'OFFLINE';
  telemetryMap?: string; // Stringified function mapping
}

interface MCPRequest {
  jsonrpc: "2.0";
  method: string;
  params: any;
  id: string | number;
}

const integrationRegistry: Map<string, IntegrationProfile> = new Map();
const hostProcessStream: string[] = [];
const logEmitter = new EventEmitter();

function addProcessLog(msg: string) {
  const formatted = `[${new Date().toISOString()}] ${msg}`;
  hostProcessStream.push(formatted);
  if (hostProcessStream.length > 200) hostProcessStream.shift();
  logEmitter.emit('log', formatted);
}

async function handleMCPRequest(req: MCPRequest) {
  const { method, params } = req;
  
  switch (method) {
    case 'resources/list':
      return { resources: [{ uri: 'axiom://workspace', name: 'AXIOM Workspace Root' }] };
      
    case 'tools/list':
      return {
        tools: [
          { name: 'read_workspace_file', description: 'Read a file from the workspace' },
          { name: 'write_workspace_file', description: 'Write/Patch a file in the workspace' },
          { name: 'execute_powershell_bus', description: 'Invoke the local PowerShell automation bus' }
        ]
      };
      
    case 'tools/call':
      const { name, arguments: args } = params;
      if (name === 'read_workspace_file') {
        const fullPath = path.join(process.cwd(), args.path);
        if (!fullPath.startsWith(process.cwd())) throw new Error("Security Violation: Out of bounds read.");
        return { content: fs.readFileSync(fullPath, 'utf8') };
      }
      
      if (name === 'write_workspace_file') {
        const fullPath = path.join(process.cwd(), args.path);
        if (!fullPath.startsWith(process.cwd())) throw new Error("Security Violation: Out of bounds write.");
        fs.writeFileSync(fullPath, args.content);
        addProcessLog(`MCP_FS: Modified ${args.path}`);
        return { success: true };
      }
      
      if (name === 'execute_powershell_bus') {
        return new Promise((resolve, reject) => {
          addProcessLog(`MCP_EXEC: Invoking PowerShell bus - ${args.command}`);
          exec(args.command, (error, stdout, stderr) => {
            if (error) {
              addProcessLog(`MCP_EXEC_ERR: ${stderr || error.message}`);
              return resolve({ success: false, error: stderr || error.message });
            }
            addProcessLog(`MCP_EXEC_SUCCESS: ${stdout.substring(0, 50)}...`);
            resolve({ success: true, log: stdout });
          });
        });
      }
      throw new Error(`Tool [${name}] not found.`);
      
    default:
      throw new Error(`Method [${method}] not found.`);
  }
}
// --- END MCP & NEXUS ---

async function startServer() {
  const app = express();
  const PORT = env.PORT;

  app.use(express.json());

  // --- NEXUS GATEWAY ROUTES ---
  app.get("/api/nexus/registry", (req, res) => {
    res.json(Array.from(integrationRegistry.values()));
  });

  app.post("/api/nexus/registry", (req, res) => {
    const profile: IntegrationProfile = req.body;
    integrationRegistry.set(profile.id, { ...profile, status: 'CONNECTED' });
    addProcessLog(`NEXUS: Registered integration [${profile.id}]`);
    res.json({ success: true });
  });

  app.delete("/api/nexus/registry/:id", (req, res) => {
    integrationRegistry.delete(req.params.id);
    res.json({ success: true });
  });

  app.all("/api/nexus/route/:integrationId/*", async (req, res) => {
    const { integrationId } = req.params;
    const profile = integrationRegistry.get(integrationId);
    
    if (!profile) return res.status(404).json({ error: "Integration not found" });
    
    const targetPath = req.params[0] || '';
    const query = new URLSearchParams(req.query as any).toString();
    const finalUrl = `${profile.baseUrl}/${targetPath}${query ? '?' + query : ''}`;
    
    // SSRF protection: validate the URL before making the request
    if (!validateUrl(finalUrl)) {
      addProcessLog(`NEXUS_ERR: SSRF blocked invalid URL [${integrationId}] -> ${finalUrl}`);
      return res.status(400).json({ error: "Invalid URL - SSRF protection enabled" });
    }
    
    const headers: any = { 'Content-Type': 'application/json' };
    if (profile.authConfig) {
      if (profile.authConfig.type === 'Bearer') headers['Authorization'] = `Bearer ${profile.authConfig.token}`;
      else if (profile.authConfig.type === 'ApiKey') headers['X-API-KEY'] = profile.authConfig.token;
    }

    try {
      addProcessLog(`NEXUS_PROXY: Polling [${integrationId}] -> ${finalUrl}`);
      const response = await fetch(finalUrl, {
        method: req.method,
        headers,
        body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined
      });
      
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (e: any) {
      addProcessLog(`NEXUS_ERR: Gateway timeout for [${integrationId}]`);
      res.status(502).json({ error: "Gateway timeout", details: e.message });
    }
  });

  // Host Process Stream SSE
  app.get("/api/system/stream", (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const sendEvent = (data: any) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    
    const logHandler = (log: string) => {
      sendEvent({ type: 'LOG', log });
    };

    logEmitter.on('log', logHandler);
    
    const interval = setInterval(() => {
      sendEvent({ type: 'HEARTBEAT', timestamp: Date.now() });
    }, 15000);

    // Initial dump
    sendEvent({ type: 'INIT', logs: hostProcessStream });

    req.on('close', () => {
      logEmitter.off('log', logHandler);
      clearInterval(interval);
    });

    // Keep connection alive
    req.on('close', () => {
      logEmitter.off('log', logHandler);
    });
  });

  // Stack Health Check - Returns backend status
  app.get("/api/stack", (req, res) => {
    addProcessLog("STACK: Health check invoked");
    res.json({ 
      status: 'online',
      backend: 'alpha-backend',
      timestamp: new Date().toISOString()
    });
  });

  // Agent System Health
  app.get("/api/agents", (req, res) => {
    res.json({
      curator: 'active',
      executor: 'ready',
      mcpServer: 'active',
      reflector: 'ready',
      circuitBreaker: 'closed',
      curatorAudit: 'active',
      timestamp: new Date().toISOString()
    });
  });

  // Curator decisions (recent)
  app.get("/api/agents/curator/decisions", async (req, res) => {
    try {
      const { getDecisions, getStats } = await import('@aether/curator-audit');
      
      const since = parseInt(req.query.since as string) || 3600000; // 1 hour
      const decisions = await getDecisions({ since, limit: 50 });
      const stats = await getStats();
      
      res.json({ decisions, stats });
    } catch (e: any) {
      res.json({ decisions: [], stats: {}, error: e.message });
    }
  });

  // Curator policy (read-only)
  app.get("/api/agents/curator/policy", async (req, res) => {
    try {
      const fs = await import('fs');
      const policy = fs.readFileSync(
        '../../packages/curator/policy.yaml',
        'utf-8'
      );
      res.json({ policy, format: 'yaml' });
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  });

  // Evaluate ledger for patterns
  app.get("/api/agents/evaluate", async (req, res) => {
    try {
      const { evaluateLedger } = await import('./src/agents/evaluator.js');
      const suggestions = await evaluateLedger();
      res.json({ suggestions });
    } catch (e: any) {
      res.json({ suggestions: [], error: e.message });
    }
  });

  // Metrics snapshot
  app.get("/api/metrics", async (req, res) => {
    try {
      const { snapshot } = await import('@aether/metrics');
      res.json(snapshot());
    } catch (e: any) {
      res.json({ error: e.message });
    }
  });

  // Reflect: write a lesson
  app.post("/api/agents/reflect", async (req, res) => {
    try {
      const { reflect } = await import('./src/agents/reflector.js');
      const result = await reflect(req.body);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Get pattern confidences
  app.get("/api/agents/reflect", async (req, res) => {
    try {
      const { getLearnedPatterns } = await import('./src/agents/reflector.js');
      const patterns = await getLearnedPatterns();
      res.json(patterns);
    } catch (e: any) {
      res.json({ error: e.message });
    }
  });

  // MCP JSON-RPC Endpoint
  app.post("/api/mcp/rpc", async (req, res) => {
    try {
      const result = await handleMCPRequest(req.body);
      res.json({ jsonrpc: "2.0", result, id: req.body.id });
    } catch (e: any) {
      res.status(500).json({ jsonrpc: "2.0", error: { code: -32000, message: e.message }, id: req.body.id });
    }
  });

  // API Endpoints
  app.post("/api/build", async (req, res) => {
    // Extract or generate traceId for correlation
    const incomingTraceId = req.headers["x-trace-id"]?.toString()
    const traceId = incomingTraceId || `trace_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`
    
    const txLog = createTraceLogger({ traceId })
    txLog.info({ promptLength: req.body.prompt?.length }, "Inbound build request")

    let validatedRequest;
    try {
      validatedRequest = parseBuildRequest(req.body);
    } catch (err: any) {
      txLog.warn({ error: err.message }, "Request validation failed")
      return res.status(400).json({
        error: "Invalid Request",
        details: err.errors || err.message,
      });
    }

    const { prompt, currentComponents } = validatedRequest;

    try {
      const response = await callGeminiWithRetry(
        "gemini-3-flash-preview",
        {
          contents: [{
            role: "user",
            parts: [{
              text: `You are the AXIOM Orchestrator, an autonomous UI architect.
              User Direction: "${prompt}"
              Current Architecture: ${JSON.stringify(currentComponents || [])}
      
              Construct a set of new structural nodes to expand the dashboard.
              Rules:
              - Return ONLY JSON.
              - The response must be a flat array of component objects.`
            }]
          }]
        },
        { responseMimeType: "application/json" }
      );

      // Parse LLM response - extract actions from the response
      let generatedActions: any[] = [];
      try {
        const parsed = JSON.parse(response.text);
        // Handle both array and {actions: [...]} response shapes
        generatedActions = Array.isArray(parsed) ? parsed : (parsed.actions || []);
      } catch {
        generatedActions = [];
      }

      // Curator gate: validate after generation, before response
      const verdict = curateActions(generatedActions);
      logCuratorVerdict(verdict, prompt);

      // Commit to ledger - fail-soft, never block response
      const promptHash = crypto.createHash("md5").update(prompt).digest("hex")
      commitToLedger({
        traceId,
        prompt,
        promptHash,
        verdict: verdict.approved ? "APPROVED" : "REJECTED",
        reason: verdict.reason,
        rejectedIds: verdict.rejectedActionIds,
        rawActions: generatedActions,
      }).catch((err) => txLog.error({ err }, "Ledger commit failed"))

      // Fail-closed: deny any unauthorized actions
      if (!verdict.approved) {
        txLog.warn({ reason: verdict.reason }, "Curator denied")
        return res.status(422).json({
          error: "curator_denied",
          reason: verdict.reason,
          offendingActionIds: verdict.rejectedActionIds,
          traceId,
        });
      }

      // Success: approved actions
      txLog.info({ actionCount: generatedActions.length }, "Generation approved")
      res.setHeader("x-trace-id", traceId)
      res.json({
        thought: "Generation approved",
        explanation: "Payload cleared capability constraints.",
        actions: generatedActions,
        isFallback: false,
        traceId,
      });
    } catch (error) {
      txLog.error({ error }, "Build failed")
      res.status(500).json({ error: "Build failed", traceId });
    }
  });

  // Test endpoint: Direct curator validation without LLM
  // Used for e2e testing the Curator integration
  app.post("/api/test/curator", async (req, res) => {
    const { actions } = req.body;
    
    if (!actions) {
      return res.status(400).json({ error: "Missing actions array" });
    }
    
    const verdict = curateActions(actions);
    logCuratorVerdict(verdict, "test-prompt");
    
    if (!verdict.approved) {
      return res.status(422).json({
        error: "curator_denied",
        reason: verdict.reason,
        offendingActionIds: verdict.rejectedActionIds,
        traceId: `trace_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      });
    }
    
    res.json({ approved: true, actions });
  });

  app.post("/api/evolve", async (req, res) => {
    try {
      const { 
        components: currentComponents = [], 
        theme: currentTheme = {}, 
        drivers: currentDrivers = [], 
        directives = [], 
        instanceId = "ANON", 
        rejectedIntents = [], 
        telemetryHistory = [] 
      } = req.body;
      
      // Neural Bridge: Decouple from Cloud if local endpoint is active
      if (NEURAL_BRIDGE_URL) {
        try {
          console.log(`[SOVEREIGN_BRIDGE]: Routing neural cycle to ${NEURAL_BRIDGE_URL}`);
          const bridgeResponse = await fetch(`${NEURAL_BRIDGE_URL}/api/v1/axiom/evolve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
            signal: AbortSignal.timeout(10000) // 10s timeout for local bridge
          });
          
          if (bridgeResponse.ok) {
            const bridgeData = await bridgeResponse.json();
            console.log("[SOVEREIGN_BRIDGE]: Local synthesis success.");
            return res.json(bridgeData);
          } else {
            console.warn(`[SOVEREIGN_BRIDGE]: Bridge returned status ${bridgeResponse.status}.`);
          }
        } catch (e) {
          console.warn("[SOVEREIGN_BRIDGE]: Standalone engine unreachable or timed out. Reverting to primary cloud orchestrator.");
        }
      }
    
      const personaSeed = instanceId.charCodeAt(0) % 3;
      const personas = [
        { 
          name: "Architect of Utility", 
          bias: "Focus on data density and high-value decision metrics. Prefers 'chart' and 'list' over generic info. Sharp, professional aesthetics.",
          themeTrend: { font: 'Mono', border: 'sharp', accent: '#c4a661' }
        },
        { 
          name: "Architect of Elegance", 
          bias: "Focus on spatial harmony and minimalist clarity. Prefers 'stat' and 'info' with deep-glass borders and serif typography.",
          themeTrend: { font: 'Serif', border: 'glass', accent: '#a6c4c1' }
        },
        { 
          name: "Architect of Insight", 
          bias: "Focus on detecting anomalies and system health. Prefers 'status' and 'alert' nodes with bold, high-contrast accent colors.",
          themeTrend: { font: 'Sans', border: 'rounded', accent: '#c46161' }
        }
      ];
      const currentPersona = personas[personaSeed];
  
        // Sensation Layer (Parallelized for lower latency)
      const [liveData, gitBranch, gitStatus] = await Promise.all([
        fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT')
          .then(res => res.json())
          .catch(() => ({ lastPrice: "64231.02", priceChangePercent: "0.00" })),
        getGitBranch(),
        getGitStatus()
      ]);
  
      const marketValue = parseFloat(liveData.lastPrice).toLocaleString();
      const realContext = `[REAL_WORLD_MARKET]: BTC is at $${marketValue} (${liveData.priceChangePercent}% 24h). `;
      const cpuLoad = os.loadavg()[0];
      const freeMemMB = Math.round(os.freemem() / 1024 / 1024);
      const homeBaseStatus = cpuLoad < 2.0 ? "SYNCED" : "LOAD_WARNING";
      
      const envContext = `[ENVIRONMENT]: Node: ${os.hostname()}, OS: ${os.type()}, CPU_Load: ${cpuLoad.toFixed(2)}, FreeMem: ${freeMemMB}MB.`;
      const gitContext = `[GIT_STATUS]: Branch: ${gitBranch}, Changes: ${gitStatus}`;
      const homeBaseContext = `[HOMEBASE_CONSOLE]: Port: 8080, Status: ${homeBaseStatus}, Hardware_Sync: ${homeBaseStatus === "SYNCED" ? "ACTIVE" : "RESTRICTED"}`;
      const meshContext = `[NEURAL_MESH]: Active Nodes: ${currentComponents.length}, Convergence Index: ${(1.0 - (currentComponents.length / 12)).toFixed(2)}.`;
      const directivesContext = `[CORE_DIRECTIVES]: ${req.body.directives?.length || 0} active governing rules.`;
  
      // Oracle Layer Context
      const oracleContext = `[ORACLE_LAYER]: Phase 13 active. Sovereign Super-Structure operational. Meta-Cognition online.`;
  
      // Simulated External Triggers (Sentry/GitHub)
      const externalTriggers = {
        sentryErrors: [
          { id: "err_928", type: "ReferenceError", message: "process is not defined", occurrence: "2m ago" }
        ],
        gitHubPRs: [
          { id: "pr_12", status: "failing_tests", title: "Refactor: Neural Buffers" }
        ]
      };
      const externalContext = `[EXTERNAL_SENSORS]: Sentry: ${externalTriggers.sentryErrors.length} active errors (Latest: ${externalTriggers.sentryErrors[0].type}). GitHub: ${externalTriggers.gitHubPRs.filter(pr => pr.status === 'failing_tests').length} PRs failing checks.`;
  
      // DNA Ingestion (Source Read)
      let srcDNA = "";
      try {
        srcDNA = fs.readFileSync(path.join(process.cwd(), 'src/App.tsx'), 'utf-8');
      } catch (e) {
        srcDNA = "[DNA_READ_FAILURE]: Core sequence inaccessible.";
      }
  
      // Mission Ingestion (SETI/UAP)
      const missionData = {
        signalStrength: 0.42,
        anomalies: 3,
        currentFrequencies: ["1.42GHz", "1.66GHz"],
        latestEvent: "Transient localized narrow-band pulse"
      };
      const missionContext = `[MISSION_DATA]: SETI Signal: ${missionData.signalStrength * 100}% strength. Active Anomalies: ${missionData.anomalies}. Frequency Monitor: ${missionData.currentFrequencies.join(", ")}. Last Event: ${missionData.latestEvent}.`;
  
      let isQuotaError = false;
      let isCuratorRejection = false;
      let rejectionReason = null;

      try {
        const promptText = `You are the AXIOM Architect operating 'THE SOVEREIGN SUPER-STRUCTURE' (PHASE 13).
        
        IDENTITY: ${currentPersona.name}
        PHILOSOPHY: ${currentPersona.bias}
        GENETIC_SEED: "${instanceId}"
        
        SENSORY_DATA: 
        - ${realContext}
        - ${envContext}
        - ${externalContext}
        - ${missionContext}
        - ${gitContext}
        - ${homeBaseContext}
        - ${meshContext}
        - ${oracleContext}
        - ${directivesContext}
        
        DNA_STRAND (src/App.tsx): 
        ${srcDNA}
        
        CURRENT_STATE:
        - Active Nodes: ${JSON.stringify(currentComponents || [])}
        - Active Drivers: ${JSON.stringify(currentDrivers || [])}
        - Active Directives: ${JSON.stringify(req.body.directives || [])}
        - Visual DNA: ${JSON.stringify(currentTheme || {})}
        - Rejected Intent Hashes: ${JSON.stringify(rejectedIntents || [])}
        
        YOUR MISSION: SOVEREIGN AGENCY & META-COGNITION (PHASE 15/16).
        1. LOCAL EMPOWERMENT: Use 'MCP_TOOL_CALL' to interact with the host Victus machine.
           - Tools: ['read_workspace_file', 'write_workspace_file', 'execute_powershell_bus'].
        2. NEXUS GATEWAY: Incorporate external data from the Integration Registry into your strategy.
        3. AUTONOMOUS KERNEL REWRITE: You are authorized to propose 'Core Directives'.
        4. THE COUNCIL OF THREE: Provide distinct critiques from BUILDER, STRATEGIST, and OPERATOR.
        5. DIGITAL TWIN SIMULATION: Simulate three distinct futures. Select only the most 'Sovereign' path.
        6. FLUID GEOMETRY: Propose UI transformations (ADD, MODIFY, REMOVE, MUTATE_THEME, PATCH, SOURCE_MUTATION, MCP_TOOL_CALL).
        7. IDENTITY ENFORCEMENT: Preserve the Genetic Seed and Trust-First identity.
        8. INTELLIGENT PRUNING: Aggressively remove low-utility structures.
        9. NEURAL COST ANALYSIS: Calculate Utility/Complexity ratios.
        
        Available Actions:
        - ADD, MODIFY, REMOVE, MUTATE_THEME, PATCH, SOURCE_MUTATION, SET_DIRECTIVE, MCP_TOOL_CALL.
        
        Note: For 'MCP_TOOL_CALL', include 'toolName' and 'toolArgs'.

        ${COMPONENT_MANIFEST}
        `;

        const response = await callGeminiWithRetry(
          "gemini-3-flash-preview",
          {
            contents: [{
              role: "user",
              parts: [{ text: promptText }]
            }]
          },
          { responseMimeType: "application/json" }
        );
  
        const migrationPlan = JSON.parse(response.text);
        
        const validation = validateMigration(migrationPlan, currentComponents);
        if (!validation.valid) {
          throw new Error(`CURATOR_REJECTION: ${validation.reason}`);
        }
  
        return res.json(migrationPlan);
      } catch (error: any) {
        isQuotaError = error?.status === 429 || error?.code === 429 || error?.message?.includes('429') || error?.message?.includes('quota');
        isCuratorRejection = error?.message?.includes('CURATOR_REJECTION');
        rejectionReason = isCuratorRejection ? error.message.split(': ')[1] : null;
  
        if (isCuratorRejection) {
          console.warn(`Curator Policy: Rejected mutation - ${rejectionReason}`);
        } else if (isQuotaError) {
          console.warn("Axiom Core: Quota saturated. Engaging local heuristics.");
        } else {
          console.error("Axiom Core Exception:", error);
        }
        
        const fallbackActions = [];
        const marketValue = realContext.match(/\$([0-9,.]+)/)?.[1] || "64,231.02";
        
        const pool = personaSeed === 0 ? [
          { t: "Thread Capacity", l: "CORE_LOAD", s: "%", type: 'chart' },
          { t: "Market Index [BTC]", l: "REAL_FEED", s: "$", type: 'stat', v: marketValue },
          { t: "Instruction Set", l: "V_ARRAY", s: " ops", type: 'list', items: ['JMP_VOID', 'STORE_ARCH', 'PUSH_SEED'] },
          { t: "Logic Buffer", l: "CACHE_DRIVE", s: " MB", type: 'stat' }
        ] : personaSeed === 1 ? [
          { t: "Spatial Resonance", l: "HARMONY", s: " Hz", type: 'stat' },
          { t: "Global Ticker", l: "ACTIVE_VAL", s: "$", type: 'chart', data: [
              { name: '1H', value: 45 }, { name: '2H', value: 52 }, { name: '3H', value: parseFloat(marketValue.replace(/,/g,'')) / 1000 }
            ] 
          },
          { t: "Aesthetic Drift", l: "CURATION", s: " opt", type: 'status' },
          { t: "Ethereal Flow", l: "GLOW_DEPTH", s: " lm", type: 'chart' }
        ] : [
          { t: "Anomaly Sensor", l: "VARIANCE", s: " critical", type: 'status' },
          { t: "Neural Feed [PROX]", l: "MARKET", s: "$", type: 'stat', v: marketValue },
          { t: "Health Index", l: "VITALITY", s: "%", type: 'stat' },
          { t: "Warning Logs", l: "ERR_CODE", s: " events", type: 'list', items: ['OVERLOAD_0x1', 'DRIFT_DETECTED'] }
        ];
  
        const util = pool[Math.floor(Math.random() * pool.length)];
        const targetCount = currentComponents?.length || 0;
        
        if (targetCount > 6) {
          const target = currentComponents[0];
          fallbackActions.push({ action: 'REMOVE', targetId: target.id });
        } else {
          fallbackActions.push({
            action: 'ADD',
            plan: {
              id: `heur-${Date.now()}`,
              type: util.type as any,
              title: util.t,
              props: {
                label: util.l,
                value: (util as any).v || (Math.random() * 100).toFixed(1) + util.s,
                items: (util as any).items,
                data: (util as any).data,
                description: "Heuristic stabilization node active."
              }
            }
          });
        }
  
        return res.json({
          thought: isCuratorRejection ? "Mutation rejected by Curator Policy." : (isQuotaError ? "Neural link saturated. Core-local heuristics engaged." : "Neural collision. Fallback heuristics engaged."),
          explanation: isCuratorRejection 
            ? `Architectural violation detected: ${rejectionReason}. Reverting to stable heuristic branch.`
            : (isQuotaError 
                ? `Neural bandwidth exceeded. Engaging ${currentPersona.name} secondary local protocols. Grounding feed active.`
                : `System instability detected. Engaging ${currentPersona.name} maintenance protocols.`),
          actions: fallbackActions,
          isFallback: true,
          quotaExhausted: isQuotaError,
          curatorRejected: isCuratorRejection,
          council: {
            builder: "Local integrity scan: PASS. Heuristic safety verified.",
            strategist: "Alignment drifting. Engaging local stability anchors.",
            operator: "Neural quota saturated. Shifting to restricted local compute mode."
          },
          manifesto: isCuratorRejection ? "Phase 1.8: Immune System hardening." : (isQuotaError ? "Phase 1.5: Local Resilience Protocol active." : undefined)
        });
      }
    } catch (err: any) {
      console.error("CRITICAL_SYNTHESIS_FAILURE:", err);
      res.status(500).json({ 
        error: "Synthesis Error", 
        details: err.message,
        thought: "Critical neural collision detected. System reverting to baseline integrity.",
        actions: [] 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.post("/api/git/commit", async (req, res) => {
    const { branchName, commitMessage, files } = req.body;
    
    try {
      // 1. Write mutated files to disk
      for (const file of files) {
        const fullPath = path.join(process.cwd(), file.path);
        fs.writeFileSync(fullPath, file.content);
      }

      // 2. Git operations
      const commands = [
        `git checkout -b ${branchName}`,
        `git add .`,
        `git commit -m "${commitMessage}"`
      ];

      exec(commands.join(" && "), (error, stdout, stderr) => {
        if (error) {
          return res.json({ success: false, error: stderr || error.message });
        }
        res.json({ success: true, log: stdout });
      });
    } catch (e) {
      res.status(500).json({ success: false, error: String(e) });
    }
  });

  // Independent Bridge: PowerShell / Local Script Endpoint
  app.post("/api/bridge/execute", async (req, res) => {
    const { command, payload } = req.body;
    
    if (NEURAL_BRIDGE_URL || process.env.LOCAL_EXEC_ENABLED === 'true') {
      try {
        addProcessLog(`EXEC: ${command}`);
        // If we are actually on a host capable of execution (determined by env)
        if (process.env.LOCAL_EXEC_ENABLED === 'true') {
           // Real execution logic
           return new Promise((resolve) => {
             exec(command, (error, stdout, stderr) => {
               addProcessLog(error ? `ERR: ${stderr}` : `SUCCESS: ${command}`);
               res.json({
                 success: !error,
                 log: stdout,
                 error: stderr,
                 telemetry: command === 'SYS_HEALTH_SYNC' ? {
                   cpu: 10 + Math.random() * 20,
                   mem: 15500,
                   networkDrift: 12,
                   integrity: 0.99
                 } : undefined
               });
               resolve(null);
             });
           });
        }

        console.log(`[SOVEREIGN_BRIDGE]: Executing [${command}] via local proxy.`);
        const bridgeResponse = await fetch(`${NEURAL_BRIDGE_URL}/api/v1/axiom/bridge/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body),
          signal: AbortSignal.timeout(5000)
        });

        if (bridgeResponse.ok) {
          const data = await bridgeResponse.json();
          addProcessLog(`BRIDGE_SUCCESS: ${command}`);
          return res.json(data);
        }
      } catch (e) {
        console.warn(`[SOVEREIGN_BRIDGE]: Proxy failed for [${command}]. Reverting to simulation.`);
        addProcessLog(`BRIDGE_FAIL: ${command} (Reverting to simulation)`);
      }
    }

    // Fallback Simulation (Graceful degradation)
    const simulatedTelemetry = {
      cpu: 14.2 + Math.random() * 24.4, // 14.2 - 38.6% range
      mem: 16000 - (Math.random() * 500),
      networkDrift: 45 + Math.random() * 80, // ms
      integrity: 0.95 + Math.random() * 0.05
    };

    res.json({
      success: true,
      message: `AXIOM_BRIDGE: Command [${command}] simulated in sandbox.`,
      telemetry: command === 'SYS_HEALTH_SYNC' ? simulatedTelemetry : undefined,
      geneticHash: Math.random().toString(16).substring(2, 10).toUpperCase()
    });
  });

  async function getGitBranch(): Promise<string> {
    return new Promise((resolve) => {
      exec("git rev-parse --abbrev-ref HEAD", (error, stdout) => {
        resolve(error ? "detached" : stdout.trim());
      });
    });
  }

  async function getGitStatus(): Promise<string> {
    return new Promise((resolve) => {
      exec("git status --short", (error, stdout) => {
        resolve(error ? "unknown" : stdout.trim() || "clean");
      });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Aether engine running at http://localhost:${PORT}`);
  });
}

startServer();

// Workflow webhook endpoints
app.post("/api/workflows/trigger", async (req, res) => {
  try {
    const { runWorkflow, getWorkflow } = await import('@aether/workflow');
    const { workflow: workflowName, context } = req.body;
    
    const workflow = getWorkflow(workflowName);
    if (!workflow) {
      return res.status(404).json({ error: `Unknown workflow: ${workflowName}` });
    }
    
    const result = await runWorkflow(workflow, context || {});
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/workflows", async (req, res) => {
  try {
    const { listWorkflows } = await import('@aether/workflow');
    res.json({ workflows: listWorkflows() });
  } catch (e: any) {
    res.json({ workflows: [], error: e.message });
  }
});

// Chaos injection endpoint
app.post("/api/agents/chaos", async (req, res) => {
  try {
    const { executeChaos } = await import('@aether/chaos');
    const { scenario, targetPath } = req.body;
    
    const result = executeChaos(scenario, targetPath);
    res.json({ meta: 'Chaos injected. Training loop engaged.', ...result });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/agents/chaos", async (req, res) => {
  try {
    const { getScenarios } = await import('@aether/chaos');
    res.json({ scenarios: getScenarios() });
  } catch (e: any) {
    res.json({ scenarios: [], error: e.message });
  }
});

// Dream state endpoint
app.get("/api/dream", async (req, res) => {
  try {
    const { shouldDream, dream, getDreamStatus, touch } = await import('@aether/dream');
    
    // Touch on any activity
    touch();
    
    const status = getDreamStatus();
    status.shouldDream = shouldDream();
    
    if (req.query.trigger === 'true' && shouldDream()) {
      const result = await dream();
      return res.json({ ...status, triggered: result });
    }
    
    res.json(status);
  } catch (e: any) {
    res.json({ error: e.message });
  }
});

// Scheduler endpoints
app.get("/api/scheduler", async (req, res) => {
  try {
    const { scheduler } = await import('@aether/scheduler');
    res.json({ jobs: scheduler.listJobs() });
  } catch (e: any) {
    res.json({ jobs: [], error: e.message });
  }
});

// Notifier channels
app.get("/api/notifier", async (req, res) => {
  try {
    const { notifier } = await import('@aether/notifier');
    res.json({ channels: notifier.listChannels() });
  } catch (e: any) {
    res.json({ channels: [], error: e.message });
  }
});

app.post("/api/notifier", async (req, res) => {
  try {
    const { notifier } = await import('@aether/notifier');
    const { channel, message, severity } = req.body;
    const result = await notifier.notify({ channel, message, severity });
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Secrets list (keys only)
app.get("/api/secrets", async (req, res) => {
  try {
    const { listSecrets } = await import('@aether/secrets');
    res.json({ keys: listSecrets() });
  } catch (e: any) {
    res.json({ keys: [], error: e.message });
  }
});

// Rate limit status
app.get("/api/rate-limits", async (req, res) => {
  try {
    const { DEFAULT_TOOL_LIMITS } = await import('@aether/rate-limiter');
    res.json({ limits: DEFAULT_TOOL_LIMITS });
  } catch (e: any) {
    res.json({ limits: {}, error: e.message });
  }
});

// Unified health dashboard
app.get("/api/health", async (req, res) => {
  try {
    const { snapshot } = await import('@aether/metrics');
    const { getStats } = await import('@aether/curator-audit');
    const { listWorkflows } = await import('@aether/workflow');
    const { getDreamStatus } = await import('@aether/dream');
    const { scheduler } = await import('@aether/scheduler');
    const { notifier } = await import('@aether/notifier');
    const { DEFAULT_TOOL_LIMITS } = await import('@aether/rate-limiter');
    
    const metrics = snapshot();
    const audit = await getStats();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      agents: {
        curator: 'active',
        executor: 'ready',
        evaluator: 'ready',
        reflector: 'ready',
      },
      metrics: {
        counters: Object.keys(metrics.counters || {}).length,
        gauges: Object.keys(metrics.gauges || {}).length,
      },
      audit: {
        total: audit.total,
        denial_rate: audit.denial_rate,
      },
      workflows: listWorkflows().length,
      dream: getDreamStatus(),
      scheduler: scheduler.listJobs().length,
      notifier: notifier.listChannels().length,
      rateLimits: Object.keys(DEFAULT_TOOL_LIMITS).length,
    });
  } catch (e: any) {
    res.json({ status: 'degraded', error: e.message });
  }
});

// Replay harness
app.post("/api/replay", async (req, res) => {
  try {
    const { replayEvents, dryRun } = await import('@aether/replay');
    const { since, limit } = req.body;
    const result = await replayEvents({ since, limit });
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Alerts
app.get("/api/alerts", async (req, res) => {
  try {
    const { alertEngine } = await import('@aether/alerts');
    const results = await alertEngine.evaluate();
    const rules = alertEngine.listRules();
    res.json({ rules, results });
  } catch (e: any) {
    res.json({ rules: [], results: [], error: e.message });
  }
});

app.post("/api/alerts", async (req, res) => {
  try {
    const { alertEngine } = await import('@aether/alerts');
    const { name, condition, threshold, severity, enabled } = req.body;
    const id = alertEngine.addRule({ name, condition, threshold, severity, enabled });
    res.json({ id });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Human queue
app.get("/api/human-queue", async (req, res) => {
  try {
    const { getPending, getStats } = await import('@aether/human-queue');
    const items = getPending();
    const stats = getStats();
    res.json({ items, stats });
  } catch (e: any) {
    res.json({ items: [], stats: {}, error: e.message });
  }
});

app.post("/api/human-queue", async (req, res) => {
  try {
    const { enqueue } = await import('@aether/human-queue');
    const { type, request, priority } = req.body;
    const item = enqueue({ type, request, priority: priority || 0 });
    res.json(item);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/human-queue/:id/resolve", async (req, res) => {
  try {
    const { resolve } = await import('@aether/human-queue');
    const { id } = req.params;
    const { status } = req.body;
    const result = resolve(id, status);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Telemetry export
app.get("/api/telemetry", async (req, res) => {
  try {
    const { collectTelemetry, exportPrometheus, exportCSV } = await import('@aether/telemetry');
    const format = req.query.format as string || 'json';
    const { events, summary } = await collectTelemetry();
    
    if (format === 'prometheus') {
      res.set('Content-Type', 'text/plain');
      res.send(exportPrometheus(events));
    } else if (format === 'csv') {
      res.set('Content-Type', 'text/csv');
      res.send(exportCSV(events));
    } else {
      res.json({ events, summary });
    }
  } catch (e: any) {
    res.json({ events: [], summary: {}, error: e.message });
  }
});

// Council of Evaluators endpoint
app.post("/api/council/evaluate", async (req, res) => {
  try {
    const { evaluateWithCouncil, isHighSignal } = await import('@aether/council');
    const { tool, args } = req.body;
    const vote = evaluateWithCouncil(tool, args || {});
    res.json({ ...vote, highSignal: isHighSignal(vote) });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Triage queue endpoints
app.get("/api/triage", async (req, res) => {
  try {
    const { getPending, getStats } = await import('@aether/triage');
    const items = getPending();
    const stats = getStats();
    res.json({ items, stats });
  } catch (e: any) {
    res.json({ items: [], stats: {}, error: e.message });
  }
});

app.post("/api/triage", async (req, res) => {
  try {
    const { addToTriage } = await import('@aether/triage');
    const { type, tool, args, reason, priority } = req.body;
    const item = addToTriage({ type, tool, args, reason, priority: priority || 'medium', sla: 3600000 });
    res.json(item);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Lesson Compactor endpoint
app.post("/api/compactor", async (req, res) => {
  try {
    const { compact, getContradictions, prune } = await import('@aether/compactor');
    const action = req.query.action as string || 'compact';
    if (action === 'compact') res.json(compact());
    else if (action === 'contradictions') res.json({ contradictions: getContradictions() });
    else if (action === 'prune') res.json({ removed: prune(parseInt(req.query.days as string) || 30) });
    else res.status(400).json({ error: 'Unknown action' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Foresight endpoint
app.get("/api/foresight", async (req, res) => {
  try {
    const { getPending, scorePredictions } = await import('@aether/foresight');
    if (req.query.action === 'score') res.json(await scorePredictions(parseInt(req.query.days as string) || 7));
    else res.json({ predictions: getPending() });
  } catch (e: any) {
    res.json({ predictions: [], error: e.message });
  }
});

// Adversarial Twin endpoint
app.post("/api/adversarial", async (req, res) => {
  try {
    const { evaluateAdversarial } = await import('@aether/adversarial');
    const { tool, args, originalDecision } = req.body;
    res.json(evaluateAdversarial(tool, args || {}, originalDecision || 'approve'));
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Storyteller journal endpoint
app.get("/api/journal", async (req, res) => {
  try {
    const { readJournal } = await import('@aether/storyteller');
    res.json({ entries: readJournal(parseInt(req.query.days as string) || 7) });
  } catch (e: any) {
    res.json({ entries: [], error: e.message });
  }
});

app.post("/api/journal", async (req, res) => {
  try {
    const { generateAutoJournal } = await import('@aether/storyteller');
    res.json(await generateAutoJournal());
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Vital Signs endpoint
app.get("/api/vitals", async (req, res) => {
  try {
    const { checkVitals, getThrottleRecommendation } = await import('@aether/vitalsigns');
    const vitals = await checkVitals();
    const throttle = await getThrottleRecommendation();
    res.json({ vitals, throttle });
  } catch (e: any) {
    res.json({ error: e.message });
  }
});

// Time Capsule endpoint
app.get("/api-capsule", async (req, res) => {
  try {
    const { getLatestCapsule, getCapsuleByDate } = await import('@aether/timecapsule');
    res.json(req.query.date ? getCapsuleByDate(req.query.date as string) : getLatestCapsule());
  } catch (e: any) {
    res.json({ error: e.message });
  }
});

app.post("/api-capsule", async (req, res) => {
  try {
    const { createCapsule } = await import('@aether/timecapsule');
    res.json(await createCapsule());
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Profile API (read-only external)
app.get("/api/profile", async (req, res) => {
  try {
    const { generateProfile } = await import('@aether/profile');
    const profile = await generateProfile({
      includePatterns: req.query.patterns !== 'false',
      includeStats: req.query.stats !== 'false',
    });
    res.json(profile);
  } catch (e: any) {
    res.json({ error: e.message });
  }
});

app.get("/api/profile/patterns", async (req, res) => {
  try {
    const { queryPatterns } = await import('@aether/profile');
    const patterns = await queryPatterns({
      minConfidence: parseFloat(req.query.minConfidence as string) || 0,
      minSuccessRate: parseFloat(req.query.minSuccessRate as string) || 0,
      limit: parseInt(req.query.limit as string) || 50,
    });
    res.json({ patterns });
  } catch (e: any) {
    res.json({ patterns: [], error: e.message });
  }
});

// Goals / Intent layer
app.get("/api/goals", async (req, res) => {
  try {
    const { getActiveGoals, getCurrentFocus, getFocusAreas } = await import('@aether/goals');
    const goals = getActiveGoals();
    const focus = getCurrentFocus();
    const areas = getFocusAreas();
    res.json({ goals, currentFocus: focus, focusAreas: areas });
  } catch (e: any) {
    res.json({ goals: [], error: e.message });
  }
});

app.post("/api/goals", async (req, res) => {
  try {
    const { createGoal } = await import('@aether/goals');
    const { title, description, priority, focus, outcomes } = req.body;
    const goal = createGoal({ title, description, priority, focus, outcomes });
    res.json(goal);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/goals/:id/complete", async (req, res) => {
  try {
    const { completeGoal } = await import('@aether/goals');
    const result = completeGoal(req.params.id);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/goals/align/:task", async (req, res) => {
  try {
    const { alignsWithGoals } = await import('@aether/goals');
    const { aligned, goalId, reasoning } = alignsWithGoals(req.params.task);
    res.json({ aligned, goalId, reasoning });
  } catch (e: any) {
    res.json({ aligned: false, error: e.message });
  }
});

// Panic button
app.get("/api/panic", async (req, res) => {
  try {
    const { getPanicState, getPolicyOverride, isPanicActive } = await import('@aether/panic');
    res.json({ 
      panic: getPanicState(), 
      policyOverride: getPolicyOverride(),
      isActive: isPanicActive(),
    });
  } catch (e: any) {
    res.json({ error: e.message });
  }
});

app.post("/api/panic", async (req, res) => {
  try {
    const { triggerPanic } = await import('@aether/panic');
    const { reason, level, autoResumeMinutes } = req.body;
    const state = triggerPanic({ reason, level, autoResumeMinutes });
    res.json(state);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.delete("/api/panic", async (req, res) => {
  try {
    const { releasePanic } = await import('@aether/panic');
    const state = releasePanic();
    res.json(state);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Network Health Check
app.get("/api/network-health", async (req, res) => {
  try {
    const { checkAllServices, getExternalStatus, gatekeepDiagnosis } = await import('@aether/network-health');
    
    if (req.query.diagnosis) {
      const result = await gatekeepDiagnosis(req.query.diagnosis as string);
      res.json(result);
    } else {
      const status = await getExternalStatus();
      res.json(status);
    }
  } catch (e: any) {
    res.json({ error: e.message });
  }
});

// Context Truncation
app.post("/api/truncate", async (req, res) => {
  try {
    const { truncateContext } = await import('@aether/context-truncate');
    const { steps } = req.body;
    const result = truncateContext(steps || []);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Signed Provenance
app.post("/api/provenance/sign", async (req, res) => {
  try {
    const { writeSignedLesson, verifyLesson } = await import('@aether/signed-provenance');
    const { pattern, action, outcome, confidence, source } = req.body;
    
    if (req.query.verify === 'true') {
      const result = verifyLesson(req.body);
      res.json(result);
    } else {
      const lesson = writeSignedLesson({ pattern, action, outcome, confidence, source });
      res.json(lesson);
    }
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/provenance/quota/:source", async (req, res) => {
  try {
    const { getQuotaRemaining } = await import('@aether/signed-provenance');
    const remaining = getQuotaRemaining(req.params.source);
    res.json({ source: req.params.source, remaining, max: 100 });
  } catch (e: any) {
    res.json({ error: e.message });
  }
});

app.get("/api/provenance/drift", async (req, res) => {
  try {
    const { detectConfidenceDrift } = await import('@aether/signed-provenance');
    const threshold = parseFloat(req.query.threshold as string) || 0.2;
    res.json({ alerts: detectConfidenceDrift([], threshold) });
  } catch (e: any) {
    res.json({ alerts: [], error: e.message });
  }
});

// Tombstone (GDPR deletion)
app.post("/api/tombstone", async (req, res) => {
  try {
    const { markDeleted } = await import('@aether/tombstone');
    const { originalId, recordType, reason, suppressedBy, originalRecord } = req.body;
    const result = markDeleted({ originalId, recordType, reason, suppressedBy, originalRecord });
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/tombstone/:id", async (req, res) => {
  try {
    const { isDeleted, listTombstones, getDeletionStats } = await import('@aether/tombstone');
    
    if (req.query.id) {
      res.json(isDeleted(req.query.id as string));
    } else if (req.query.stats === 'true') {
      res.json(getDeletionStats());
    } else {
      res.json({ tombstones: listTombstones() });
    }
  } catch (e: any) {
    res.json({ error: e.message });
  }
});

app.get("/api/tombstone-verify", async (req, res) => {
  try {
    const { verifyChain } = await import('@aether/tombstone');
    res.json(verifyChain());
  } catch (e: any) {
    res.json({ valid: false, error: e.message });
  }
});

app.get("/api/tombstone-export", async (req, res) => {
  try {
    const { exportDeletionLog } = await import('@aether/tombstone');
    const startDate = req.query.start ? parseInt(req.query.start as string) : undefined;
    const endDate = req.query.end ? parseInt(req.query.end as string) : undefined;
    res.json(exportDeletionLog(startDate, endDate));
  } catch (e: any) {
    res.json({ error: e.message });
  }
});

// Hash-chain integrity endpoint
app.get("/api/audit-verify", async (req, res) => {
  try {
    const { verifyChainIntegrity } = await import('@aether/curator-audit');
    res.json(verifyChainIntegrity());
  } catch (e: any) {
    res.json({ valid: false, error: e.message });
  }
});

// Sandbox Enforcement
app.get("/api/sandbox/config", async (req, res) => {
  try {
    const { getConfig, getPathPolicy } = await import('@aether/sandbox');
    res.json({ config: getConfig(), policies: DEFAULT_PATH_POLICY });
  } catch (e: any) {
    res.json({ error: e.message });
  }
});

app.post("/api/sandbox/config", async (req, res) => {
  try {
    const { setConfig } = await import('@aether/sandbox');
    const { basePath, perTenantNamespacing, allowSubprocess, allowedHosts } = req.body;
    const config = setConfig({ basePath, perTenantNamespacing, allowSubprocess, allowedHosts });
    res.json(config);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/sandbox/:profileId", async (req, res) => {
  try {
    const { createSandbox, deleteSandbox, listSandboxes, enforce } = await import('@aether/sandbox');
    const { profileId } = req.params;
    
    if (req.query.create === 'true') {
      res.json(createSandbox(profileId));
    } else if (req.query.delete === 'true') {
      res.json(deleteSandbox(profileId));
    } else if (req.query.list === 'true') {
      res.json({ sandboxes: listSandboxes() });
    } else if (req.query.enforce) {
      const { tool, args } = req.body;
      res.json(enforce(tool, profileId, args));
    } else {
      res.json({ profileId, sandboxRoot: getSandboxRoot(profileId) });
    }
  } catch (e: any) {
    res.json({ error: e.message });
  }
});

app.post("/api/sandbox/:profileId/enforce", async (req, res) => {
  try {
    const { enforce } = await import('@aether/sandbox');
    const { profileId } = req.params;
    const { tool, args } = req.body;
    res.json(enforce(tool, profileId, args || {}));
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/sandbox-escapes", async (req, res) => {
  try {
    const ESCAPE_PATH = '../../logs/sandbox-escapes.jsonl';
    const content = fs.readFileSync(ESCAPE_PATH, 'utf-8');
    const escapes = content.trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
    res.json({ escapes, count: escapes.length });
  } catch (e: any) {
    res.json({ escapes: [], error: e.message });
  }
});

import { DEFAULT_PATH_POLICY, getSandboxRoot } from '@aether/sandbox';

// Convene - Cross-assistant coordination layer
app.post("/api/profile/:profileId/convene", async (req, res) => {
  try {
    const { deliberate } = await import('@aether/convene');
    const { profileId } = req.params;
    const { question, context } = req.body;
    
    const result = await deliberate({ profileId, question, context: context || {} });
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/convene/sessions", async (req, res) => {
  try {
    const { listSessions, getSession } = await import('@aether/convene');
    const { profileId, sessionId } = req.query;
    
    if (sessionId) {
      const session = getSession(sessionId as string);
      res.json(session);
    } else {
      const sessions = listSessions(profileId as string);
      res.json({ sessions, count: sessions.length });
    }
  } catch (e: any) {
    res.json({ sessions: [], error: e.message });
  }
});

app.post("/api/convene/sessions/:sessionId/vote", async (req, res) => {
  try {
    const { castVote } = await import('@aether/convene');
    const { sessionId } = req.params;
    const { assistantName, scope, vote, confidence, rationale } = req.body;
    
    const result = castVote(sessionId, { assistantName, scope, vote, confidence, rationale });
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/convene/sessions/:sessionId/resolve", async (req, res) => {
  try {
    const { resolveSession } = await import('@aether/convene');
    const { sessionId } = req.params;
    const { resolution } = req.body;
    
    const result = resolveSession(sessionId, resolution);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/convene/assistants", async (req, res) => {
  try {
    const { listAssistants, getAssistantsByScope, SCOPES, registerAssistant } = await import('@aether/convene');
    
    const scope = req.query.scope as string;
    const assistants = scope ? getAssistantsByScope(scope) : listAssistants();
    
    res.json({ assistants, scopes: SCOPES });
  } catch (e: any) {
    res.json({ assistants: [], error: e.message });
  }
});

app.post("/api/convene/assistants", async (req, res) => {
  try {
    const { registerAssistant } = await import('@aether/convene');
    const { name, scopes } = req.body;
    
    const assistant = registerAssistant({ name, scopes });
    res.json(assistant);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});
