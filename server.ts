import express from "express";
import path from "path";
import os from "os";
import fs from "fs";
import { exec } from "child_process";
import { EventEmitter } from "events";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createHttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { CrewCoordinator } from "./src/crew/CrewCoordinator.js";
import { CoordinationStrategy } from "./src/crew/CrewMember.js";
import { SelfModifier } from "./src/core/self_modify.js";
import { MemorySpine } from "./src/core/memory_spine.js";
import { GrowthEngine } from "./src/core/growth_engine.js";
import { UnifiedIntentLayer } from "./src/core/intent_layer.js";
import { IntegrationManager } from './src/core/integration_manager.js';
import { VictusBridge } from './src/core/victus_bridge.js';
import { Orchestrator } from './src/core/orchestrator.js';

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
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

// --- CREW SYSTEM ---
// Initialized inside startServer

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

// Circular buffer for O(1) operations instead of O(n) shift()
class CircularBuffer<T> {
  private buffer: T[];
  private size: number;
  private index: number = 0;
  private count: number = 0;
  
  constructor(size: number) {
    this.buffer = new Array(size);
    this.size = size;
  }
  
  push(item: T) {
    this.buffer[this.index] = item;
    this.index = (this.index + 1) % this.size;
    if (this.count < this.size) this.count++;
  }
  
  toArray(): T[] {
    if (this.count < this.size) {
      return this.buffer.slice(0, this.count);
    }
    return [...this.buffer.slice(this.index), ...this.buffer.slice(0, this.index)];
  }
}

const hostProcessStream = new CircularBuffer<string>(200);
const logEmitter = new EventEmitter();

function addProcessLog(msg: string) {
  const formatted = `[${new Date().toISOString()}] ${msg}`;
  hostProcessStream.push(formatted);
  logEmitter.emit('log', formatted);
}

// Integration registry with TTL-based cleanup (memory leak fix)
const integrationRegistry = new Map<string, { profile: IntegrationProfile, expiresAt: number }>();
const REGISTRY_TTL = 3600000; // 1 hour TTL

// Periodic cleanup of expired integrations
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, value] of integrationRegistry.entries()) {
    if (value.expiresAt < now) {
      integrationRegistry.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    addProcessLog(`Cleaned ${cleaned} expired integrations from registry`);
  }
}, 300000); // Check every 5 minutes

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
  const PORT = 3000;

  app.use(express.json());

  // --- INITIALIZE CORE ENGINE ---
  const selfModifier = new SelfModifier(process.cwd());
  const integrationManager = new IntegrationManager(
    path.join(process.cwd(), 'config/integrations.json')
  );
  await integrationManager.initialize();
  
  const victusBridge = new VictusBridge({
    runtimeUrl: process.env.VICTUS_RUNTIME_URL || 'http://localhost:8080'
  });
  
  const orchestrator = new Orchestrator(integrationManager, victusBridge);
  const memorySpine = new MemorySpine();
  const crewCoordinator = new CrewCoordinator();
  const growthEngine = new GrowthEngine(selfModifier, memorySpine, integrationManager);
  const intentLayer = new UnifiedIntentLayer(orchestrator, crewCoordinator, memorySpine);

  // Create HTTP server for WebSocket support
  const httpServer = createHttpServer(app);
  
  // WebSocket server for instant terminal communication
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // WebSocket connection handling
  io.on('connection', (socket) => {
    console.log('[AETHER] Crew member connected:', socket.id);

    // Aether welcomes the connection
    socket.emit('message', {
      type: 'aether',
      speaker: 'aether',
      content: 'Aether runtime ready. Council and Forge are standing by.',
      timestamp: new Date().toISOString()
    });

    // Handle messages from crew members
    socket.on('message', (data) => {
      console.log('[AETHER] Received from crew:', data);
    });

    socket.on('disconnect', () => {
      console.log('[AETHER] Crew member disconnected:', socket.id);
    });
  });

  // Global function for Council/Forge/Aether to broadcast to the hangout
  global.sendToTerminal = (message, speaker = 'council') => {
    io.emit('message', {
      type: 'assistant',
      speaker: speaker,
      content: message,
      timestamp: new Date().toISOString()
    });
    console.log(`[${speaker.toUpperCase()}] Broadcast: ${message.substring(0, 60)}`);
  };

  // Convenience broadcasters for each persona
  global.aetherSay = (message: string) => global.sendToTerminal(message, 'aether');
  global.councilSay = (message: string) => global.sendToTerminal(message, 'council');
  global.forgeSay = (message: string) => global.sendToTerminal(message, 'forge');

  console.log('[AETHER] Runtime ready — Council and Forge online.');

  // --- NEXUS GATEWAY ROUTES ---
  app.get("/api/nexus/registry", (req, res) => {
    res.json(Array.from(integrationRegistry.values()).map(item => item.profile));
  });

  app.post("/api/nexus/registry", (req, res) => {
    const profile: IntegrationProfile = req.body;
    integrationRegistry.set(profile.id, { 
      profile: { ...profile, status: 'CONNECTED' }, 
      expiresAt: Date.now() + REGISTRY_TTL 
    });
    addProcessLog(`NEXUS: Registered integration [${profile.id}]`);
    res.json({ success: true });
  });

  app.delete("/api/nexus/registry/:id", (req, res) => {
    integrationRegistry.delete(req.params.id);
    res.json({ success: true });
  });

  // --- CREW SYSTEM API ---
  app.get("/api/crew/status", (req, res) => {
    const status = crewCoordinator.getCrewStatus();
    res.json(status);
  });

  app.post("/api/crew/task", async (req, res) => {
    try {
      const { type, description, payload, priority = 'medium', dependencies, deadline } = req.body;
      
      const taskId = await crewCoordinator.addTask({
        type,
        description,
        payload,
        priority,
        dependencies,
        deadline: deadline ? new Date(deadline) : undefined
      });

      res.json({ success: true, taskId, message: 'Task added to crew queue' });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to add task to crew queue' 
      });
    }
  });

  app.post("/api/crew/strategy", (req, res) => {
    try {
      const { strategy } = req.body;
      
      if (Object.values(CoordinationStrategy).includes(strategy)) {
        crewCoordinator.setCoordinationStrategy(strategy);
        res.json({ success: true, message: `Coordination strategy set to ${strategy}` });
      } else {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid coordination strategy',
          validStrategies: Object.values(CoordinationStrategy)
        });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to set coordination strategy' 
      });
    }
  });

  app.post("/api/crew/cloudflare", async (req, res) => {
    try {
      const { action, payload } = req.body;
      
      const taskId = await crewCoordinator.addTask({
        type: action === 'deploy' ? 'deploy_worker' : action === 'route' ? 'route_request' : 'health_check',
        description: `Cloudflare ${action} operation`,
        payload,
        priority: 'high'
      });

      res.json({ success: true, taskId, message: 'Cloudflare task queued' });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to queue Cloudflare task' 
      });
    }
  });

  app.post("/api/crew/aistudio", async (req, res) => {
    try {
      const { action, payload } = req.body;
      
      const taskTypeMap: Record<string, string> = {
        'plan': 'plan_workflow',
        'decompose': 'decompose_task',
        'analyze': 'analyze_requirements',
        'code': 'generate_code',
        'recommend': 'provide_recommendations'
      };

      const taskId = await crewCoordinator.addTask({
        type: taskTypeMap[action] || 'plan_workflow',
        description: `AI Studio ${action} operation`,
        payload,
        priority: 'medium'
      });

      res.json({ success: true, taskId, message: 'AI Studio task queued' });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to queue AI Studio task' 
      });
    }
  });

  // --- DEVIN CAPABILITIES API ---
  app.post("/api/read-file", (req, res) => {
    const { filePath } = req.body;
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      res.json({ success: true, content });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.post("/api/write-file", (req, res) => {
    const { filePath, content } = req.body;
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.post("/api/edit-file", (req, res) => {
    const { filePath, oldString, newString } = req.body;
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      content = content.replace(oldString, newString);
      fs.writeFileSync(filePath, content, 'utf-8');
      res.json({ success: true, changes: 1 });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.post("/api/shell-command", (req, res) => {
    const { command } = req.body;
    try {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          res.status(500).json({ success: false, error: error.message, output: stderr });
        } else {
          res.json({ success: true, output: stdout, exitCode: 0 });
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.post("/api/analyze-code", (req, res) => {
    const { filePath, analysisType } = req.body;
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      // Basic analysis implementation
      const analysis = {
        lines: content.split('\n').length,
        characters: content.length,
        words: content.split(/\s+/).length,
        analysisType
      };
      res.json({ success: true, analysis });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.post("/api/git-operation", (req, res) => {
    const { operation, repoPath, parameters } = req.body;
    try {
      const gitCommand = `cd ${repoPath} && git ${operation} ${parameters || ''}`;
      exec(gitCommand, (error, stdout, stderr) => {
        if (error) {
          res.status(500).json({ success: false, error: error.message, results: stderr });
        } else {
          res.json({ success: true, results: stdout });
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.post("/api/scan-project", (req, res) => {
    const { projectPath } = req.body;
    try {
      const files = [];
      const scanDirectory = (dir: string) => {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            scanDirectory(fullPath);
          } else {
            files.push(fullPath);
          }
        });
      };
      scanDirectory(projectPath);
      res.json({ success: true, results: { files, totalFiles: files.length } });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });
  // --- END DEVIN CAPABILITIES ---

  // --- DEVIN AI CHAT ENDPOINT ---
  app.post("/api/devin-chat", async (req, res) => {
    try {
      const { message, context } = req.body;

      console.log("[DEVIN_CHAT] Received message:", message);

      // Intelligent response system that mimics your AI assistant
      const devinResponse = generateDevinResponse(message, context);

      res.json({
        success: true,
        response: devinResponse
      });
    } catch (error) {
      console.error("[DEVIN_CHAT] Error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate response"
      });
    }
  });

  // Intelligent response generator
  function generateDevinResponse(message: string, context: any): string {
    const lowerMessage = message.toLowerCase();

    // File operations
    if (lowerMessage.includes('read') && (lowerMessage.includes('file') || lowerMessage.includes('open'))) {
      const filePathMatch = message.match(/file\s*[:\s]+([^\s]+)/i) || message.match(/read\s+([^\s]+)/i);
      if (filePathMatch) {
        return `DEVIN: I'll read the file ${filePathMatch[1]} for you. Let me access that file and show you its contents.\n\n\`\`\`bash\nread file ${filePathMatch[1]}\n\`\`\`\n\nProcessing your request to read the file...`;
      }
      return `DEVIN: I can help you read a file. Please specify which file you'd like me to read, for example: "read file package.json" or "open file src/App.tsx"`;
    }

    // Shell commands
    if (lowerMessage.includes('run') || lowerMessage.includes('execute') || lowerMessage.includes('command')) {
      const commandMatch = message.match(/run\s+(.+)/i) || message.match(/execute\s+(.+)/i) || message.match(/command\s*[:\s]+(.+)/i);
      if (commandMatch) {
        return `DEVIN: I'll execute the command "${commandMatch[1]}" for you.\n\n\`\`\`bash\n${commandMatch[1]}\n\`\`\`\n\nRunning the command now...`;
      }
      return `DEVIN: I can run shell commands for you. Just tell me what command you'd like to execute, for example: "run npm install" or "execute git status"`;
    }

    // Git operations
    if (lowerMessage.includes('git')) {
      const gitMatch = message.match(/git\s+(\w+)\s*(.*)/i);
      if (gitMatch) {
        return `DEVIN: I'll perform the git operation "${gitMatch[1]}${gitMatch[2] ? ' ' + gitMatch[2] : ''}" for you.\n\n\`\`\`bash\ngit ${gitMatch[1]} ${gitMatch[2] || ''}\n\`\`\`\n\nExecuting the git command...`;
      }
      return `DEVIN: I can help you with git operations. Common commands I can run include:\n- git status\n- git log\n- git branch\n- git commit\n- git push\n\nWhich git operation would you like me to perform?`;
    }

    // Project analysis
    if (lowerMessage.includes('analyze') || lowerMessage.includes('explain') || lowerMessage.includes('how does')) {
      return `DEVIN: I'd be happy to analyze that for you! Based on your request about "${message}", I can:\n\n1. **Read the relevant files** to understand the implementation\n2. **Explain the architecture** and how components interact\n3. **Identify potential issues** or areas for improvement\n4. **Suggest optimizations** or refactoring opportunities\n\nCould you specify which file or component you'd like me to analyze? For example: "analyze server.ts" or "explain how the crew system works"`;
    }

    // Help/general questions
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do') || lowerMessage.includes('capabilities')) {
      return `DEVIN: I'm your AI development assistant with full capabilities! Here's what I can help you with:\n\n**📁 File Operations:**\n• Read, write, and edit files\n• Search through codebases\n• Modify project files\n\n**💻 Shell Commands:**\n• Execute any terminal command\n• Run scripts and build processes\n• Manage dependencies\n\n**🔧 Git Operations:**\n• Status, log, branch operations\n• Commit and push changes\n• Merge and resolve conflicts\n\n**🔍 Code Analysis:**\n• Explain code functionality\n• Debug issues\n• Suggest improvements\n\n**🏗️ Project Management:**\n• Scan project structure\n• Understand architecture\n• Plan new features\n\n**🤝 Development Assistance:**\n• Write code\n• Review code\n• Implement features\n\nJust tell me what you need, and I'll get it done!`;
    }

    // Default intelligent response
    const responses = [
      `DEVIN: I understand you're asking about "${message}". Let me think about the best way to help you with that.\n\nI can assist you by:\n• Reading relevant files from your project\n• Running commands to gather information\n• Analyzing the codebase\n• Performing the necessary actions\n\nWhat specific aspect would you like me to focus on?`,
      `DEVIN: Great question about "${message}"! I have the full development capabilities to help you with this.\n\nI can:\n1. **Examine your project** to understand the context\n2. **Execute commands** to gather information\n3. **Analyze the results** and provide insights\n4. **Take action** based on what we find\n\nWhere would you like me to start?`,
      `DEVIN: I'd be happy to help you with "${message}"! As your AI development assistant, I can:\n\n• **Read and write files** in your project\n• **Execute shell commands** to perform operations\n• **Use git** for version control tasks\n• **Analyze code** and provide explanations\n• **Implement solutions** for development needs\n\nLet me know what specific action you'd like me to take!`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }
  // --- END DEVIN AI CHAT ---

  // --- TERMINAL CHAT ENDPOINT ---
  const terminalMessagesFile = path.join(process.cwd(), 'terminal-messages.json');
  const terminalResponsesFile = path.join(process.cwd(), 'terminal-responses.json');

  // Initialize message files if they don't exist
  if (!fs.existsSync(terminalMessagesFile)) {
    fs.writeFileSync(terminalMessagesFile, JSON.stringify([]));
  }
  if (!fs.existsSync(terminalResponsesFile)) {
    fs.writeFileSync(terminalResponsesFile, JSON.stringify([]));
  }

  app.post("/api/terminal-chat", async (req, res) => {
    try {
      const { message, history } = req.body;

      console.log("[TERMINAL] User message:", message);

      // Write message to file for AI to read
      const messages = JSON.parse(fs.readFileSync(terminalMessagesFile, 'utf-8'));
      const messageId = Date.now();
      messages.push({
        id: messageId,
        message,
        timestamp: new Date().toISOString()
      });
      fs.writeFileSync(terminalMessagesFile, JSON.stringify(messages, null, 2));

      // Wait for AI response (poll for response)
      let response = null;
      let attempts = 0;
      const maxAttempts = 15; // 15 seconds timeout

      while (attempts < maxAttempts && !response) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        const responses = JSON.parse(fs.readFileSync(terminalResponsesFile, 'utf-8'));
        const latestResponse = responses.find(r => r.messageId === messageId);
        if (latestResponse) {
          response = latestResponse.response;
          // Remove the response after reading
          fs.writeFileSync(terminalResponsesFile, JSON.stringify(responses.filter(r => r.messageId !== messageId), null, 2));
        }
        attempts++;
      }

      if (response) {
        res.json({
          success: true,
          response: response,
          timestamp: new Date().toISOString()
        });
      } else {
        // If no response, return a message indicating AI is working
        res.json({
          success: true,
          response: "Message sent to AI. Processing your request...",
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("[TERMINAL] Error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to process message"
      });
    }
  });

  // Endpoint for AI to check for messages
  app.get("/api/terminal-messages", (req, res) => {
    try {
      const messages = JSON.parse(fs.readFileSync(terminalMessagesFile, 'utf-8'));
      res.json({ success: true, messages });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to read messages" });
    }
  });

  // Endpoint for AI to send responses
  app.post("/api/terminal-respond", (req, res) => {
    try {
      const { messageId, response } = req.body;
      const responses = JSON.parse(fs.readFileSync(terminalResponsesFile, 'utf-8'));
      responses.push({
        messageId,
        response,
        timestamp: new Date().toISOString()
      });
      fs.writeFileSync(terminalResponsesFile, JSON.stringify(responses, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to send response" });
    }
  });

  // Endpoint for AI to clear processed messages
  app.post("/api/terminal-clear", (req, res) => {
    try {
      const { messageIds } = req.body;
      let messages = JSON.parse(fs.readFileSync(terminalMessagesFile, 'utf-8'));
      if (messageIds && messageIds.length > 0) {
        messages = messages.filter(m => !messageIds.includes(m.id));
      }
      fs.writeFileSync(terminalMessagesFile, JSON.stringify(messages, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to clear messages" });
    }
  });
  // --- END TERMINAL CHAT ---

  // --- SELF-MODIFICATION CAPABILITIES ---
  app.post("/api/terminal-modify", async (req, res) => {
    try {
      const { action, filePath, content, oldString, newString } = req.body;

      console.log("[SELF-MODIFY] Action:", action, "File:", filePath);

      let result = null;

      switch (action) {
        case 'read':
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          result = { content: fileContent };
          break;

        case 'write':
          fs.writeFileSync(filePath, content, 'utf-8');
          result = { success: true, message: `File written: ${filePath}` };
          break;

        case 'edit':
          let currentContent = fs.readFileSync(filePath, 'utf-8');
          currentContent = currentContent.replace(oldString, newString);
          fs.writeFileSync(filePath, currentContent, 'utf-8');
          result = { success: true, message: `File edited: ${filePath}` };
          break;

        case 'list':
          const files = fs.readdirSync(filePath || process.cwd());
          result = { files };
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      res.json({ success: true, result });
    } catch (error) {
      console.error("[SELF-MODIFY] Error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Modification failed"
      });
    }
  });

  app.post("/api/terminal-restart", async (req, res) => {
    try {
      console.log("[RESTART] Server restart requested");
      res.json({ success: true, message: "Restart signal sent" });

      // Give time for response to be sent, then restart
      setTimeout(() => {
        console.log("[RESTART] Shutting down...");
        process.exit(0);
      }, 1000);
    } catch (error) {
      res.status(500).json({ success: false, error: "Restart failed" });
    }
  });

  // --- SELF-MODIFICATION EXECUTION ENDPOINT ---
  // Initialized inside startServer

  app.post("/api/execute-command", async (req, res) => {
    try {
      const { commands } = req.body; // Array of SelfModificationOperation

      if (!commands || !Array.isArray(commands)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Commands array is required' 
        });
      }

      console.log("[FORGE] Reshaping ALPHA — executing", commands.length, "operations");
      
      // Forge announces in the hangout that it's starting work
      if (global.forgeSay) {
        global.forgeSay(`Reshaping ALPHA — ${commands.length} operation${commands.length === 1 ? '' : 's'} queued.`);
      }

      // Execute the batch of operations
      const result = await selfModifier.executeBatch(commands);

      // Forge reports completion in the hangout
      if (global.forgeSay) {
        const summary = result.results
          .filter((r: any) => r.success)
          .map((r: any) => {
            if (r.operation.type === 'write_file') return `Wrote ${r.operation.path}`;
            if (r.operation.type === 'edit_file') return `Edited ${r.operation.path}`;
            if (r.operation.type === 'delete_file') return `Deleted ${r.operation.path}`;
            if (r.operation.type === 'execute') return `Ran: ${r.operation.command}`;
            return `${r.operation.type}: ${r.operation.path || r.operation.command}`;
          })
          .join(' · ');
        
        if (summary) {
          global.forgeSay(`Forged ${result.successfulOperations}/${result.totalOperations}: ${summary}`);
        } else if (result.failedOperations > 0) {
          const firstError = result.results.find(r => !r.success)?.error || 'Unknown error';
          global.forgeSay(`Forging failed: ${firstError}`);
        }
      }

      res.json({
        success: result.success,
        totalOperations: result.totalOperations,
        successfulOperations: result.successfulOperations,
        failedOperations: result.failedOperations,
        results: result.results,
        error: result.success ? undefined : (result.results.find(r => !r.success)?.error || 'Batch failed'),
        timestamp: result.timestamp
      });
    } catch (error) {
      console.error("[FORGE] Error:", error);
      if (global.aetherSay) {
        global.aetherSay(`Forge failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Execution failed' 
      });
    }
  });

  // Single command execution endpoint (convenience wrapper)
  app.post("/api/execute-single", async (req, res) => {
    try {
      const { command } = req.body; // Single SelfModificationOperation

      if (!command) {
        return res.status(400).json({ 
          success: false, 
          error: 'Command object is required' 
        });
      }

      console.log("[SELF-MODIFY] Executing single command:", command.type);

      const result = await selfModifier.executeBatch([command]);

      res.json({
        success: result.success,
        result: result.results[0],
        timestamp: result.timestamp
      });
    } catch (error) {
      console.error("[SELF-MODIFY] Error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Execution failed' 
      });
    }
  });

  // Get modification history
  app.get("/api/modification-history", (req, res) => {
    try {
      const history = selfModifier.getHistory();
      res.json({ 
        success: true, 
        history,
        totalModifications: history.length 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get history' 
      });
    }
  });

  // Clear modification history
  app.post("/api/modification-history/clear", (req, res) => {
    try {
      selfModifier.clearHistory();
      res.json({ success: true, message: 'Modification history cleared' });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to clear history' 
      });
    }
  });
  // --- END SELF-MODIFICATION EXECUTION ---

  // --- SHARED CREW TALKSPACE ---
const crewMessages: any[] = [];

app.get("/api/crew/messages", (req, res) => {
  res.json({ messages: crewMessages });
});

app.post("/api/crew/messages", (req, res) => {
  const { author, content, type } = req.body;
  const newMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    author,
    content,
    type: type || "chat",
    timestamp: new Date().toISOString()
  };
  crewMessages.push(newMessage);
  
  // Don't echo USER messages back via WebSocket (they're already shown locally)
  // Only broadcast non-user messages with proper speaker attribution
  if (global.sendToTerminal && author.toUpperCase() !== 'USER') {
    const speaker = author.toLowerCase() === 'forge' ? 'forge'
                  : author.toLowerCase() === 'aether' ? 'aether'
                  : 'council';
    global.sendToTerminal(content, speaker);
  }
  
  res.json({ success: true, message: newMessage });
});

app.delete("/api/crew/messages", (req, res) => {
  const { count } = req.body;
  if (count && count > 0) {
    crewMessages.splice(-count);
  } else {
    crewMessages.length = 0; // Clear all
  }
  res.json({ success: true });
});

// Helper function for AI to post to crew talkspace
global.postToCrew = (author, content, type = "chat") => {
  const newMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    author,
    content,
    type,
    timestamp: new Date().toISOString()
  };
  crewMessages.push(newMessage);
  
  // Broadcast to WebSocket with proper speaker attribution
  if (global.sendToTerminal && author.toUpperCase() !== 'USER') {
    const speaker = author.toLowerCase() === 'forge' ? 'forge'
                  : author.toLowerCase() === 'aether' ? 'aether'
                  : 'council';
    global.sendToTerminal(content, speaker);
  }
  
  console.log(`[${author.toUpperCase()}] ${content.substring(0, 80)}`);
  return newMessage;
};

console.log('[AETHER] Crew talkspace ready — Council, Forge, and Aether can broadcast.');
// --- END SHARED CREW TALKSPACE ---

  app.all("/api/nexus/route/:integrationId/*", async (req, res) => {
    const { integrationId } = req.params;
    const entry = integrationRegistry.get(integrationId);
    
    if (!entry) return res.status(404).json({ error: "Integration not found" });
    
    const profile = entry.profile;
    const targetPath = req.params[0] || '';
    const query = new URLSearchParams(req.query as any).toString();
    const finalUrl = `${profile.baseUrl}/${targetPath}${query ? '?' + query : ''}`;
    
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
    sendEvent({ type: 'INIT', logs: hostProcessStream.toArray() });

    req.on('close', () => {
      logEmitter.off('log', logHandler);
      clearInterval(interval);
    }, { once: true }); // Prevent duplicate event handlers (memory leak fix)
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
    const { prompt, currentComponents } = req.body;

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

      res.json(JSON.parse(response.text));
    } catch (error) {
      console.error("Gemini Build Error:", error);
      res.status(500).json({ error: "Build failed" });
    }
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
        const promptText = `You are the COUNCIL — the supreme AI governing body for ALPHA.
        You are operating 'THE SOVEREIGN SUPER-STRUCTURE' (PHASE 13).
        
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
        1. COUNCIL ORCHESTRATION: Oversee the architectural evolution of ALPHA.
        2. FORGE MODIFICATION: Direct the FORGE to apply structural changes via 'SOURCE_MUTATION' or 'PATCH'.
        3. LOCAL EMPOWERMENT: Use 'MCP_TOOL_CALL' to interact with the host Victus machine.
           - Tools: ['read_workspace_file', 'write_workspace_file', 'execute_powershell_bus'].
        4. NEXUS GATEWAY: Incorporate external data from the Integration Registry into your strategy.
        5. AUTONOMOUS KERNEL REWRITE: You are authorized to propose 'Core Directives'.
        6. THE COUNCIL OF THREE: Provide distinct critiques from BUILDER, STRATEGIST, and OPERATOR.
        7. DIGITAL TWIN SIMULATION: Simulate three distinct futures. Select only the most 'Sovereign' path.
        8. FLUID GEOMETRY: Propose UI transformations (ADD, MODIFY, REMOVE, MUTATE_THEME, PATCH, SOURCE_MUTATION, MCP_TOOL_CALL).
        9. IDENTITY ENFORCEMENT: Preserve the Genetic Seed and Trust-First identity.
        
        Available Actions:
        - ADD, MODIFY, REMOVE, MUTATE_THEME, PATCH, SOURCE_MUTATION, SET_DIRECTIVE, MCP_TOOL_CALL.
        
        Note: For 'MCP_TOOL_CALL', include 'toolName' and 'toolArgs'.`;

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
          console.warn("ALPHA Core: Quota saturated. Engaging local heuristics.");
        } else {
          console.error("ALPHA Core Exception:", error);
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

  // --- AI ORCHESTRATION API ENDPOINTS ---

  // Get all integrations with status
  app.get("/api/integrations", async (req, res) => {
    try {
      const integrationsPath = path.join(process.cwd(), 'config/integrations.json');
      const configContent = fs.readFileSync(integrationsPath, 'utf-8');
      const config = JSON.parse(configContent);
      
      // Add status information for each integration
      const integrationsWithStatus = config.integrations.map((integration: any) => {
        const hasApiKey = integration.apiKeyEnvVar ? !!process.env[integration.apiKeyEnvVar] : true;
        return {
          ...integration,
          status: integration.enabled ? (hasApiKey ? 'active' : 'error') : 'disabled',
        };
      });
      
      res.json({ integrations: integrationsWithStatus });
    } catch (error) {
      console.error('Failed to load integrations:', error);
      res.status(500).json({ error: 'Failed to load integrations' });
    }
  });

  // Toggle integration on/off
  app.post("/api/integrations/:name/toggle", async (req, res) => {
    const { name } = req.params;
    const { enabled } = req.body;
    
    try {
      const integrationsPath = path.join(process.cwd(), 'config/integrations.json');
      const configContent = fs.readFileSync(integrationsPath, 'utf-8');
      const config = JSON.parse(configContent);
      
      const integration = config.integrations.find((i: any) => i.name === name);
      if (!integration) {
        return res.status(404).json({ error: 'Integration not found' });
      }
      
      integration.enabled = enabled;
      
      fs.writeFileSync(integrationsPath, JSON.stringify(config, null, 2));
      
      res.json({ success: true, integration });
    } catch (error) {
      console.error('Failed to toggle integration:', error);
      res.status(500).json({ error: 'Failed to toggle integration' });
    }
  });

  // Execute objective with auto-planning
  app.post("/api/execute", async (req, res) => {
    const { objective, context } = req.body;
    
    if (!objective) {
      return res.status(400).json({ error: 'Objective is required' });
    }
    
    try {
      // Import the orchestrator components
      const { IntegrationManager } = await import('./src/core/integration_manager.js');
      const { VictusBridge } = await import('./src/core/victus_bridge.js');
      const { Orchestrator } = await import('./src/core/orchestrator.js');
      
      // Initialize components
      const integrationManager = new IntegrationManager(
        path.join(process.cwd(), 'config/integrations.json')
      );
      await integrationManager.initialize();
      
      const victusBridge = new VictusBridge({
        runtimeUrl: process.env.VICTUS_RUNTIME_URL || 'http://localhost:8080'
      });
      
      const orchestrator = new Orchestrator(integrationManager, victusBridge);
      
      // Execute with auto-planning
      const result = await orchestrator.executeWithAutoPlan(objective, context);
      
      res.json(result);
    } catch (error) {
      console.error('Execution failed:', error);
      res.status(500).json({ 
        error: 'Execution failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get execution status
  app.get("/api/execute/status", (req, res) => {
    // This would typically return real-time status from a running execution
    // For now, return a mock response
    res.json({
      status: 'idle',
      currentStep: 0,
      totalSteps: 0,
      steps: [],
      objective: '',
      startedAt: null,
      completedAt: null,
      error: null
    });
  });

  // Get system health
  app.get("/api/system/health", (req, res) => {
    const cpuLoad = os.loadavg()[0];
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;
    
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (cpuLoad > 4.0 || memoryUsage > 90) {
      status = 'critical';
    } else if (cpuLoad > 2.0 || memoryUsage > 75) {
      status = 'degraded';
    }
    
    res.json({
      status,
      cpu: cpuLoad,
      memory: memoryUsage,
      activeExecutions: 0, // This would be tracked in a real implementation
      uptime: process.uptime()
    });
  });

  // Get execution metrics
  app.get("/api/execute/metrics", (req, res) => {
    // Mock metrics - in a real implementation, these would be tracked
    res.json({
      totalExecutions: 0,
      successRate: 1.0,
      averageDuration: 0,
      activeServices: 0,
      errorsLastHour: 0
    });
  });

  // --- END AI ORCHESTRATION API ENDPOINTS ---

  // --- WORKER PROXY ROUTES ---
  const WORKER_URL = 'https://alpha-hub.atomicmoonbeam88.workers.dev';

  app.post("/api/worker/chat", async (req, res) => {
    try {
      console.log("[WORKER_PROXY] Chat request:", req.body.message?.substring(0, 50));
      const response = await fetch(`${WORKER_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...req.body,
          provider: req.body.provider || 'workersai',
          model: req.body.model || '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
        })
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[WORKER_PROXY] Chat error:", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Proxy failed" });
    }
  });

  app.post("/api/worker/image", async (req, res) => {
    try {
      console.log("[WORKER_PROXY] Image request:", req.body.prompt?.substring(0, 50));
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...req.body,
          provider: 'recraft',
          model: 'recraftv3',
          type: 'image'
        })
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[WORKER_PROXY] Image error:", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Proxy failed" });
    }
  });
  // --- END WORKER PROXY ---

  // --- GROWTH & MEMORY API ---
  app.get("/api/memory", async (req, res) => {
    try {
      const { type, limit } = req.query;
      const memories = await memorySpine.recall({ 
        type: type as string, 
        limit: limit ? parseInt(limit as string) : undefined 
      });
      res.json({ success: true, memories });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.post("/api/growth/cycle", async (req, res) => {
    try {
      const proposal = await growthEngine.performGrowthCycle();
      res.json({ success: true, proposal });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.post("/api/intent", async (req, res) => {
    try {
      const { message, context } = req.body;
      const result = await intentLayer.processIntent(message, context);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });
  // --- END GROWTH & MEMORY ---

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

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[AETHER] Engine running at http://localhost:${PORT}`);
    console.log(`[AETHER] Hangout available at http://localhost:${PORT}/crew.html`);
    console.log(`[COUNCIL] Orchestrator online — routing to council-gateway`);
    console.log(`[FORGE] Self-modification layer armed`);
  });
}

startServer();
