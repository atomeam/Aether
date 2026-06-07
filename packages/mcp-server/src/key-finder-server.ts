import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Create server instance
const server = new McpServer({
  name: "key-finder",
  version: "1.0.0",
});

// Tool: Search for API keys in files
server.registerTool(
  "search_api_keys",
  {
    description: "Search for API keys in system files",
    inputSchema: z.object({
      searchPath: z.string().optional().describe("Path to search (default: user home)"),
      keyPattern: z.string().optional().describe("Pattern to match (default: AIza)"),
      fileExtensions: z.array(z.string()).optional().describe("File extensions to search"),
    }).shape,
  },
  async ({ searchPath, keyPattern, fileExtensions }) => {
    const searchDir = searchPath || process.env.HOME || process.env.USERPROFILE || "C:\\Users\\adamm";
    const pattern = keyPattern || "AIza";
    const extensions = fileExtensions || [".env", ".json", ".txt", ".md", ".js", ".ts", ".py"];
    
    const results: any[] = [];
    
    try {
      // Search using appropriate command for OS
      const isWindows = process.platform === "win32";
      let command = "";
      
      if (isWindows) {
        // Windows PowerShell command
        const extPattern = extensions.join(",");
        command = `Get-ChildItem -Path "${searchDir}" -Recurse -Include ${extPattern} -ErrorAction SilentlyContinue | Select-String -Pattern "${pattern}" -ErrorAction SilentlyContinue | Select-Object -First 20`;
      } else {
        // Unix command
        const extPattern = extensions.map(ext => `*${ext}`).join(" ");
        command = `find "${searchDir}" -type f \\( -name "${extPattern}" \\) -exec grep -l "${pattern}" {} \\; 2>/dev/null | head -20`;
      }
      
      const { stdout } = await execAsync(command, { 
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        timeout: 30000 // 30 second timeout
      });
      
      if (stdout.trim()) {
        const lines = stdout.trim().split("\n");
        for (const line of lines) {
          if (line.trim()) {
            results.push({
              file: line.trim(),
              matched: true
            });
          }
        }
      }
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              searchPath: searchDir,
              pattern: pattern,
              extensions: extensions,
              results: results,
              count: results.length
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: error.message,
              searchPath: searchDir,
              pattern: pattern,
              results: []
            }, null, 2),
          },
        ],
      };
    }
  }
);

// Tool: Read file content safely
server.registerTool(
  "read_file_content",
  {
    description: "Read file content and extract potential API keys",
    inputSchema: z.object({
      filePath: z.string().describe("Path to file to read"),
      maxLines: z.number().optional().describe("Maximum lines to read (default: 100)"),
    }).shape,
  },
  async ({ filePath, maxLines }) => {
    const linesToRead = maxLines || 100;
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').slice(0, linesToRead);
      
      // Look for potential API keys
      const potentialKeys: any[] = [];
      const keyPatterns = [
        /AIza[0-9A-Za-z\-_]{35}/g, // Google API key
        /sk-[a-zA-Z0-9]{32,}/g, // Stripe key
        /xoxb-[0-9]{10,}-[0-9]{10,}-[a-zA-Z0-9]{24}/g, // Slack bot token
        /ghp_[a-zA-Z0-9]{36}/g, // GitHub personal access token
        /ya29\.[a-zA-Z0-9_-]{100,}/g, // OAuth token
      ];
      
      lines.forEach((line, index) => {
        keyPatterns.forEach(pattern => {
          const matches = line.match(pattern);
          if (matches) {
            matches.forEach(match => {
              potentialKeys.push({
                line: index + 1,
                key: match,
                context: line.trim().substring(0, 100)
              });
            });
          }
        });
      });
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              file: filePath,
              totalLines: content.split('\n').length,
              linesRead: lines.length,
              potentialKeys: potentialKeys,
              preview: lines.join('\n')
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: error.message,
              file: filePath
            }, null, 2),
          },
        ],
      };
    }
  }
);

// Tool: Check Google Cloud credentials
server.registerTool(
  "check_google_credentials",
  {
    description: "Check Google Cloud credentials and configuration",
    inputSchema: z.object({}).shape,
  },
  async () => {
    const results: any = {
      gcloudConfigured: false,
      adcConfigured: false,
      credentialsPaths: [],
      envVars: {}
    };
    
    try {
      // Check for gcloud configuration
      try {
        const { stdout } = await execAsync("gcloud config list --format=json", { timeout: 5000 });
        results.gcloudConfigured = true;
        results.gcloudConfig = JSON.parse(stdout);
      } catch (e) {
        results.gcloudConfigured = false;
      }
      
      // Check for Application Default Credentials
      try {
        const { stdout } = await execAsync("gcloud auth application-default print-access-token", { timeout: 5000 });
        results.adcConfigured = true;
      } catch (e) {
        results.adcConfigured = false;
      }
      
      // Check common credential paths
      const credentialPaths = [
        process.env.GOOGLE_APPLICATION_CREDENTIALS,
        path.join(process.env.HOME || process.env.USERPROFILE || "", ".config", "gcloud", "application_default_credentials.json"),
        path.join(process.env.APPDATA || "", "gcloud", "application_default_credentials.json"),
      ];
      
      for (const credPath of credentialPaths) {
        if (credPath && fs.existsSync(credPath)) {
          results.credentialsPaths.push(credPath);
        }
      }
      
      // Check environment variables
      results.envVars = {
        GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      };
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: error.message,
              results: results
            }, null, 2),
          },
        ],
      };
    }
  }
);

// Tool: Search browser data
server.registerTool(
  "search_browser_data",
  {
    description: "Search browser local storage and cookies for API keys",
    inputSchema: z.object({
      browser: z.enum(["chrome", "firefox", "edge"]).optional().describe("Browser to search"),
    }).shape,
  },
  async ({ browser }) => {
    const browserType = browser || "chrome";
    const results: any = {
      browser: browserType,
      found: false,
      data: []
    };
    
    try {
      // This is a placeholder - actual browser data access requires specific permissions
      // and is platform-dependent
      
      const commonPaths = {
        chrome: [
          path.join(process.env.APPDATA || "", "Google", "Chrome", "User Data", "Default", "Local Storage"),
          path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "User Data", "Default", "Local Storage"),
        ],
        firefox: [
          path.join(process.env.APPDATA || "", "Mozilla", "Firefox", "Profiles"),
        ],
        edge: [
          path.join(process.env.LOCALAPPDATA || "", "Microsoft", "Edge", "User Data", "Default", "Local Storage"),
        ]
      };
      
      const paths = commonPaths[browserType as keyof typeof commonPaths] || [];
      
      for (const browserPath of paths) {
        if (fs.existsSync(browserPath)) {
          results.data.push({
            path: browserPath,
            exists: true,
            accessible: true
          });
        }
      }
      
      results.found = results.data.length > 0;
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: error.message,
              results: results
            }, null, 2),
          },
        ],
      };
    }
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Key Finder MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
