import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, Copy, Check, Cpu, Hammer, Zap } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

type SpeakerType = 'user' | 'council' | 'forge' | 'aether' | 'cloud' | 'planner' | 'exec' | 'data' | 'devin';

interface CrewMemberVisuals {
  id: string;
  name: string;
  status: string;
  visuals: {
    color: string;
    symbol: string;
    avatarUrl?: string;
  };
}

interface TerminalMessage {
  id: string;
  speaker: SpeakerType;
  content: string;
  timestamp: Date;
  provider?: string;        // Which AI provider was used (e.g., "OpenAI", "Anthropic")
  providerLabel?: string;   // Human-readable label (e.g., "Workers AI (Llama)")
}

// Speaker configuration: name, icon, color
const SPEAKERS: Record<string, { name: string; color: string; symbol: string }> = {
  user: { name: 'You', color: 'text-blue-400', symbol: '➜' },
  council: { name: 'Council', color: 'text-cyan-400', symbol: '◆' },
  forge: { name: 'Forge', color: 'text-orange-400', symbol: '⚒' },
  aether: { name: 'Aether', color: 'text-purple-400', symbol: '⚡' },
  // Dynamic crew mapping
  cloud: { name: 'CLOUD', color: 'text-orange-500', symbol: '☁️' },
  planner: { name: 'PLANNER', color: 'text-cyan-400', symbol: '◆' },
  exec: { name: 'EXEC', color: 'text-orange-400', symbol: '⚒' },
  data: { name: 'DATA', color: 'text-red-500', symbol: '📊' },
  devin: { name: 'DEVIN', color: 'text-indigo-400', symbol: '⚡' }
};

export default function CrewDashboard() {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [crewMembers, setCrewMembers] = useState<CrewMemberVisuals[]>([]);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Smart auto-scroll logic
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      // If we are within 30px of the bottom, enable auto-scroll for new messages
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 30;
      setShouldAutoScroll(isAtBottom);
    }
  };

  // WebSocket connection
  useEffect(() => {
    const socket = io('http://localhost:3000', {
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
      // Aether announces connection
      addSystemMessage('aether', 'Aether runtime connected on port 3000. Council is ready.');
      // Fetch initial data
      fetchCrewMessages();
      fetchCrewStatus();
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      addSystemMessage('aether', 'Aether runtime disconnected.');
    });

    socket.on('message', (data) => {
      // Skip user/system echoes — we add those locally
      if (data.type === 'system' || data.type === 'user') return;
      
      const newMessage: TerminalMessage = {
        id: `msg-${Date.now()}-${Math.random()}`,
        speaker: data.speaker || 'council',
        content: data.content,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
    });

    socketRef.current = socket;

    // Poll for updates
    const pollInterval = setInterval(() => {
      fetchCrewMessages();
      fetchCrewStatus();
    }, 2000);

    return () => {
      socket.disconnect();
      clearInterval(pollInterval);
    };
  }, []);

  const fetchCrewStatus = async () => {
    try {
      const response = await fetch('/api/crew/status');
      const data = await response.json();
      if (data.crewMembers) {
        setCrewMembers(data.crewMembers);
      }
    } catch (error) {
      console.error('Failed to fetch crew status:', error);
    }
  };

  const addSystemMessage = (speaker: string, content: string) => {
    const msg: TerminalMessage = {
      id: `sys-${Date.now()}-${Math.random()}`,
      speaker: speaker as SpeakerType,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, msg]);
  };

  // Map crew author names to speaker types
  const mapAuthorToSpeaker = (author: string): string => {
    const lower = author.toLowerCase();
    if (lower === 'user') return 'user';
    if (lower === 'council' || lower === 'planner') return 'planner';
    if (lower === 'forge' || lower === 'exec') return 'exec';
    if (lower === 'aether' || lower === 'system') return 'aether';
    if (lower === 'cloud') return 'cloud';
    if (lower === 'data') return 'data';
    if (lower === 'devin') return 'devin';
    return lower;
  };

  const fetchCrewMessages = async () => {
    try {
      const response = await fetch('/api/crew/messages');
      const data = await response.json();
      if (data.messages && data.messages.length > 0) {
        // Convert crew messages to terminal format
        const crewTerminalMessages: TerminalMessage[] = data.messages.map((msg: any) => ({
          id: msg.id,
          speaker: mapAuthorToSpeaker(msg.author),
          content: msg.content,
          timestamp: new Date(msg.timestamp)
        }));
        
        // Only add new messages
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMessages = crewTerminalMessages.filter(m => !existingIds.has(m.id));
          return [...prev, ...newMessages];
        });
      }
    } catch (error) {
      console.error('Failed to fetch crew messages:', error);
    }
  };

  useEffect(() => {
    if (shouldAutoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderMessage = (content: string) => {
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const parts: any[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        });
      }

      parts.push({
        type: 'code',
        language: match[1] || 'plaintext',
        content: match[2].trim(),
        id: `code-${Math.random().toString(36).substr(2, 9)}`
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex)
      });
    }

    return parts;
  };

  const handleSendMessage = async () => {
    const message = input.trim();
    if (!message) return;

    // Add user message locally
    const userMessage: TerminalMessage = {
      id: `msg-${Date.now()}`,
      speaker: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Send to shared crew endpoint
    fetch('/api/crew/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        author: 'USER',
        content: message,
        type: 'chat'
      })
    }).catch(error => console.error('Failed to send to crew endpoint:', error));

    // Call Worker's /chat endpoint via local proxy for Council response
    try {
      setLoading(true);
      const workerResponse = await fetch('/api/worker/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          provider: 'workersai',
          model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
          history: messages.slice(-10).map(m => ({
            role: m.speaker === 'user' ? 'user' : 'assistant',
            content: m.content
          }))
        })
      });

      const workerData = await workerResponse.json();
      
      if (workerData.success && workerData.response) {
        // Council speaks first with the AI response
        const councilMessage: TerminalMessage = {
          id: `msg-${Date.now()}-council`,
          speaker: 'council',
          content: workerData.response,
          timestamp: new Date(),
          provider: workerData.provider || 'workersai',
          providerLabel: workerData.providerLabel || 'Workers AI (Llama 3.3)'
        };
        setMessages(prev => [...prev, councilMessage]);

        // Post Council's response to shared crew endpoint
        fetch('/api/crew/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            author: 'Council',
            content: workerData.response,
            type: 'chat'
          })
        }).catch(error => console.error('Failed to send Council response to crew endpoint:', error));

        // Check if response contains structured commands → invoke Forge
        const commands = extractCommands(workerData.response);
        
        if (commands.length > 0) {
          // Forge announces what it's about to do
          addSystemMessage('forge', `Reshaping ALPHA — executing ${commands.length} operation${commands.length === 1 ? '' : 's'}...`);
          
          // Execute the commands
          const executionResult = await executeCommands(commands);
          
          // Forge reports results
          const forgeReport: TerminalMessage = {
            id: `msg-${Date.now()}-forge`,
            speaker: 'forge',
            content: executionResult.summary,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, forgeReport]);
          
          if (executionResult.details) {
            addSystemMessage('forge', executionResult.details);
          }
          
          // Post Forge's report to shared crew endpoint
          fetch('/api/crew/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              author: 'Forge',
              content: executionResult.summary,
              type: 'modification'
            })
          }).catch(error => console.error('Failed to send Forge report to crew endpoint:', error));
        }
      } else if (workerData.error) {
        addSystemMessage('aether', `Council Error: ${workerData.error}`);
      }
    } catch (error) {
      // Aether reports the error
      addSystemMessage('aether', `Council unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Extract structured commands from Council's response
  const extractCommands = (response: string): any[] => {
    const commands: any[] = [];
    
    // Try to parse JSON blocks in the response
    const jsonBlockRegex = /```json\n([\s\S]*?)```/g;
    let match;
    
    while ((match = jsonBlockRegex.exec(response)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed)) {
          commands.push(...parsed);
        } else if (parsed.commands && Array.isArray(parsed.commands)) {
          commands.push(...parsed.commands);
        } else if (parsed.type || parsed.action) {
          commands.push(parsed);
        }
      } catch (e) {
        // Not valid JSON, skip
      }
    }
    
    return commands;
  };

  // Execute commands via the local API (Forge in action)
  const executeCommands = async (commands: any[]): Promise<{ summary: string, details?: string }> => {
    try {
      const response = await fetch('/api/execute-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands })
      });
      
      const result = await response.json();
      
      if (result.success) {
        const operationSummary = result.results
          .filter((r: any) => r.success)
          .map((r: any) => {
            if (r.operation.type === 'write_file') return `Wrote ${r.operation.path}`;
            if (r.operation.type === 'edit_file') return `Edited ${r.operation.path}`;
            if (r.operation.type === 'delete_file' || r.operation.type === 'remove_file') return `Deleted ${r.operation.path}`;
            if (r.operation.type === 'read_file') return `Read ${r.operation.path}`;
            if (r.operation.type === 'execute') return `Ran: ${r.operation.command}`;
            return `${r.operation.type} completed`;
          })
          .join('\n  ✓ ');
        
        return {
          summary: `Forged ${result.successfulOperations}/${result.totalOperations} operations:\n  ✓ ${operationSummary}`,
          details: result.failedOperations > 0 
            ? `${result.failedOperations} operations failed.`
            : undefined
        };
      } else {
        return {
          summary: `Forging failed: ${result.error || 'Unknown error'}`,
          details: result.results.find((r: any) => !r.success)?.error
        };
      }
    } catch (error) {
      return {
        summary: `Forge unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-[75vh] max-w-6xl mx-auto gap-4">
      {/* Main Terminal (Left) */}
      <div className="flex flex-col flex-1 bg-black text-green-400 font-mono rounded-lg border border-green-900 overflow-hidden shadow-2xl shadow-green-900/20">
        {/* Terminal Header */}
        <div className="p-4 border-b border-green-900 bg-black shrink-0">
          <div className="text-xl font-bold mb-2 text-green-300 flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            ALPHA — CREW HANGOUT
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-400">Aether Runtime</h1>
            <span className="text-xs text-slate-700">·</span>
            <div className="ml-auto flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} ${connected ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] uppercase tracking-wider text-slate-500">{connected ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {/* Terminal Output */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 bg-black scrollbar-thin scrollbar-thumb-green-900"
        >
          {messages.length === 0 ? (
            <div className="text-slate-600 text-sm">
              <p className="mb-2"><span className="text-purple-500">⚡ Aether:</span> Runtime ready.</p>
              <p className="mb-2"><span className="text-cyan-500">◆ Council:</span> Multi-agent intelligence online. Specify intent.</p>
              <p><span className="text-orange-500">⚒ Forge:</span> File modification layer armed and ready.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const speakerKey = mapAuthorToSpeaker(msg.speaker);
              const speakerInfo = SPEAKERS[speakerKey] || SPEAKERS.council;
              const messageParts = renderMessage(msg.content);

              return (
                <div
                  key={msg.id}
                  className={`mb-4 animate-in fade-in slide-in-from-left-1 duration-300`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-bold ${speakerInfo.color}`}>{speakerInfo.symbol}</span>
                    <span className={`font-bold text-xs tracking-tighter uppercase ${speakerInfo.color}`}>{speakerInfo.name}</span>
                    {msg.providerLabel && (
                      <span className="text-[10px] text-slate-600 italic flex items-center gap-1">
                        <Zap className="w-2 h-2" />
                        {msg.providerLabel}
                      </span>
                    )}
                    <span className="text-[9px] text-slate-700 ml-auto font-light">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="text-slate-700 hover:text-green-400 transition-colors"
                      title="Copy"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="ml-4 border-l border-green-900/30 pl-3 py-1">
                    {messageParts.map((part, idx) => {
                      if (part.type === 'text') {
                        return <span key={idx} className="whitespace-pre-wrap text-[13px] leading-relaxed text-green-400/90">{part.content}</span>;
                      } else if (part.type === 'code') {
                        return (
                          <div key={idx} className="my-3 rounded overflow-hidden border border-green-900/50 bg-slate-950">
                            <div className="flex items-center justify-between bg-green-950/20 px-3 py-1.5 border-b border-green-900/30">
                              <span className="text-[10px] text-green-600 font-bold tracking-widest uppercase">{part.language}</span>
                              <button
                                onClick={() => copyToClipboard(part.content, part.id)}
                                className="text-[10px] text-green-700 hover:text-green-400 uppercase font-bold"
                              >
                                {copiedId === part.id ? 'Copied' : 'Copy Code'}
                              </button>
                            </div>
                            <pre className="p-3 overflow-x-auto">
                              <code className="text-[11px] text-green-300 font-mono leading-tight">{part.content}</code>
                            </pre>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Terminal Input */}
        <div className="p-4 border-t border-green-900/50 bg-black shrink-0">
          <div className="flex items-center gap-2 bg-green-950/10 border border-green-900/30 rounded p-2 focus-within:border-green-500/50 transition-all">
            <span className="text-green-600 font-bold ml-1">➜</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={loading ? "CONVENING..." : "SPECIFY INTENT OR SOURCE MUTATION..."}
              disabled={loading}
              className="flex-1 bg-transparent border-none outline-none text-green-400 placeholder-green-900/50 text-sm font-mono disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || loading}
              className="p-1.5 hover:text-green-300 text-green-700 disabled:opacity-30 transition-all"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Crew Status Sidebar (Right) */}
      <div className="w-64 flex flex-col gap-4 shrink-0">
        <div className="flex-1 bg-black border border-green-900 rounded-lg p-4 flex flex-col overflow-hidden">
          <h2 className="text-[10px] font-bold text-green-700 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Cpu className="w-3 h-3" />
            Active Crew
          </h2>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-none">
            {crewMembers.map((member) => (
              <div key={member.id} className="group relative">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded border border-green-900/50 bg-green-950/20 flex items-center justify-center shrink-0 text-lg`}>
                    {member.visuals.symbol}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[11px] font-bold uppercase truncate ${SPEAKERS[member.name.toLowerCase()]?.color || 'text-slate-400'}`}>
                        {member.name}
                      </span>
                      <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : member.status === 'busy' ? 'bg-orange-500 animate-pulse' : 'bg-slate-700'}`} />
                    </div>
                    <p className="text-[9px] text-slate-500 uppercase tracking-tighter mt-0.5 truncate">
                      {member.status} • priority { (member as any).priority || '?' }
                    </p>
                  </div>
                </div>
                {/* Capability Tooltip (Visual) */}
                <div className="mt-1 flex flex-wrap gap-1">
                  {(member as any).capabilities?.slice(0, 3).map((cap: string) => (
                    <span key={cap} className="px-1 py-0.5 bg-green-900/10 border border-green-900/20 rounded text-[7px] text-green-800 uppercase tracking-tighter">
                      {cap.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-green-900/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] text-slate-600 uppercase font-bold">Network Connectivity</span>
              <span className="text-[8px] text-green-600 font-mono">99.9%</span>
            </div>
            <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-green-900 w-[99.9%]" />
            </div>
          </div>
        </div>

        {/* System Logs / Metrics Panel */}
        <div className="h-32 bg-black border border-green-900 rounded-lg p-3 overflow-hidden flex flex-col">
          <h2 className="text-[9px] font-bold text-orange-900 uppercase tracking-[0.2em] mb-2">System Pulse</h2>
          <div className="flex-1 font-mono text-[8px] text-green-900/50 space-y-1">
            <div className="flex justify-between"><span>CPU_LOAD</span><span>{(Math.random() * 100).toFixed(1)}%</span></div>
            <div className="flex justify-between"><span>MEM_SYNC</span><span>STABLE</span></div>
            <div className="flex justify-between"><span>NET_DRIFT</span><span>0.12ms</span></div>
            <div className="flex justify-between"><span>AGENT_COH</span><span>1.00</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}