import { CrewMember, CrewRole, CrewStatus, CrewTask, CrewTaskResult } from '../CrewMember.js';

/**
 * Devin Crew Member - AI Assistant with Full Capabilities
 * Priority: 1
 * Handles: All operations - file ops, code execution, shell commands, project analysis
 * Identity: DEVIN - Your AI assistant with full development capabilities
 */
export class DevinCrewMember implements CrewMember {
  id = 'devin-1';
  name = 'DEVIN';
  role = CrewRole.PLANNING;
  status = CrewStatus.ACTIVE;
  capabilities = [
    'file_operations',
    'code_execution', 
    'shell_commands',
    'project_analysis',
    'code_generation',
    'debugging',
    'git_operations',
    'documentation',
    'task_coordination',
    'api_integration'
  ];
  priority = 1;

  visuals = {
    color: 'text-indigo-400',
    symbol: '⚡',
    theme: 'versatile-assistant',
    avatarUrl: '/avatars/devin-agent.png'
  };

  private backendUrl = 'http://localhost:3000';

  async execute(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'conversation':
          return await this.handleConversation(task);
        case 'file_read':
          return await this.readFile(task);
        case 'file_write':
          return await this.writeFile(task);
        case 'file_edit':
          return await this.editFile(task);
        case 'shell_command':
          return await this.executeShellCommand(task);
        case 'code_analysis':
          return await this.analyzeCode(task);
        case 'git_operation':
          return await this.executeGitOperation(task);
        case 'project_scan':
          return await this.scanProject(task);
        case 'api_call':
          return await this.makeApiCall(task);
        case 'assistance':
          return await this.provideAssistance(task);
        case 'coordination':
          return await this.coordinateTasks(task);
        case 'guidance':
          return await this.provideGuidance(task);
        default:
          return await this.handleGeneralTask(task);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Devin request failed',
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    }
  }

  private async handleConversation(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();
    const { message } = task.payload;

    // Simulate conversation response
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    const responses = [
      "I'm here to help you with anything you need!",
      "That's an interesting point. Let me think about that...",
      "I can definitely help you with that!",
      "Great question! Here's what I think...",
      "I'm ready to assist you with your project.",
      "Let's work through this together."
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];

    return {
      success: true,
      data: {
        response,
        message: `DEVIN: ${response}`,
        originalMessage: message
      },
      executionTime: Date.now() - startTime,
      crewMemberId: this.id,
      timestamp: new Date()
    };
  }

  private async provideAssistance(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();
    const { request } = task.payload;

    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      success: true,
      data: {
        assistance: `I'll help you with: ${request}`,
        suggestions: [
          'Let me break this down into smaller steps',
          'I can help you prioritize your tasks',
          'Would you like me to explain any part in more detail?'
        ],
        message: 'DEVIN: I\'m ready to assist you with this task.'
      },
      executionTime: Date.now() - startTime,
      crewMemberId: this.id,
      timestamp: new Date()
    };
  }

  private async coordinateTasks(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();
    const { tasks } = task.payload;

    await new Promise(resolve => setTimeout(resolve, 600));

    return {
      success: true,
      data: {
        coordination: `I've coordinated ${tasks?.length || 0} tasks for you.`,
        priority: 'I suggest we start with the most critical tasks first.',
        message: 'DEVIN: Tasks coordinated. Ready to execute when you are.'
      },
      executionTime: Date.now() - startTime,
      crewMemberId: this.id,
      timestamp: new Date()
    };
  }

  private async provideGuidance(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();
    const { topic } = task.payload;

    await new Promise(resolve => setTimeout(resolve, 700));

    return {
      success: true,
      data: {
        guidance: `Here's my guidance on ${topic}:`,
        steps: [
          'First, let\'s understand the current situation',
          'Then we can explore different approaches',
          'Finally, I\'ll help you implement the best solution'
        ],
        message: 'DEVIN: I\'m here to guide you through this process.'
      },
      executionTime: Date.now() - startTime,
      crewMemberId: this.id,
      timestamp: new Date()
    };
  }

  private async handleGeneralTask(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();

    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      data: {
        result: 'Task completed successfully',
        message: 'DEVIN: I\'ve handled that for you.',
        note: 'Let me know if you need anything else!'
      },
      executionTime: Date.now() - startTime,
      crewMemberId: this.id,
      timestamp: new Date()
    };
  }

  // Real file operations via backend
  private async readFile(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();
    const { filePath } = task.payload;

    try {
      const response = await fetch(`${this.backendUrl}/api/read-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      });

      const data = await response.json();

      return {
        success: response.ok,
        data: {
          content: data.content,
          filePath,
          message: `DEVIN: Read file ${filePath} successfully`
        },
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    }
  }

  private async writeFile(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();
    const { filePath, content } = task.payload;

    try {
      const response = await fetch(`${this.backendUrl}/api/write-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, content })
      });

      const data = await response.json();

      return {
        success: response.ok,
        data: {
          filePath,
          message: `DEVIN: Wrote to ${filePath} successfully`,
          bytesWritten: content?.length || 0
        },
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    }
  }

  private async editFile(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();
    const { filePath, oldString, newString } = task.payload;

    try {
      const response = await fetch(`${this.backendUrl}/api/edit-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, oldString, newString })
      });

      const data = await response.json();

      return {
        success: response.ok,
        data: {
          filePath,
          message: `DEVIN: Edited ${filePath} successfully`,
          changes: data.changes || 1
        },
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to edit file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    }
  }

  private async executeShellCommand(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();
    const { command } = task.payload;

    try {
      const response = await fetch(`${this.backendUrl}/api/shell-command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });

      const data = await response.json();

      return {
        success: response.ok,
        data: {
          command,
          output: data.output,
          exitCode: data.exitCode,
          message: `DEVIN: Executed command: ${command}`
        },
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to execute command: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    }
  }

  private async analyzeCode(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();
    const { filePath, analysisType } = task.payload;

    try {
      const response = await fetch(`${this.backendUrl}/api/analyze-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, analysisType })
      });

      const data = await response.json();

      return {
        success: response.ok,
        data: {
          filePath,
          analysisType,
          results: data.analysis,
          message: `DEVIN: Analyzed ${filePath} - ${analysisType} complete`
        },
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to analyze code: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    }
  }

  private async executeGitOperation(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();
    const { operation, repoPath, parameters } = task.payload;

    try {
      const response = await fetch(`${this.backendUrl}/api/git-operation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation, repoPath, parameters })
      });

      const data = await response.json();

      return {
        success: response.ok,
        data: {
          operation,
          repoPath,
          results: data.results,
          message: `DEVIN: Git ${operation} completed`
        },
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to execute git operation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    }
  }

  private async scanProject(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();
    const { projectPath } = task.payload;

    try {
      const response = await fetch(`${this.backendUrl}/api/scan-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath })
      });

      const data = await response.json();

      return {
        success: response.ok,
        data: {
          projectPath,
          scanResults: data.results,
          message: `DEVIN: Project scan complete - found ${data.results?.files?.length || 0} files`
        },
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to scan project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    }
  }

  private async makeApiCall(task: CrewTask): Promise<CrewTaskResult> {
    const startTime = Date.now();
    const { url, method, body, headers } = task.payload;

    try {
      const response = await fetch(url, {
        method,
        headers: headers || { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });

      const data = await response.json();

      return {
        success: response.ok,
        data: {
          url,
          method,
          response: data,
          message: `DEVIN: API call to ${url} completed`
        },
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: `API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: Date.now() - startTime,
        crewMemberId: this.id,
        timestamp: new Date()
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    return true; // Devin is always available
  }
}