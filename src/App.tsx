/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Terminal, 
  Plus, 
  Trash2, 
  Layout, 
  Search, 
  Zap, 
  Cpu, 
  GitBranch, 
  RefreshCcw,
  ArrowRight,
  Activity,
  HeartPulse,
  Telescope,
  Network,
  FlaskConical,
  Radio,
  Monitor,
  Info,
  TriangleAlert,
  GitPullRequest,
  Waves,
  Atom,
  Eye,
  Thermometer,
  Radar,
  Clock,
  Ghost,
  Globe,
  Dna,
  Zap as Lightning,
  Layers,
  MessageSquare,
  Battery,
  ArrowUpRight,
  Sparkles as Spark
} from 'lucide-react';

import { PrimitiveRenderer, ComponentSpec } from './components/Primitives';
import { cn } from './lib/utils';
import { UAPSystemStatus } from './components/UAPSystemStatus';
import { UAPDetectionArrays } from './components/UAPDetectionArrays';

interface ThemeState {
  primary: string;
  accent: string;
  font: 'Serif' | 'Sans' | 'Mono';
  border: 'sharp' | 'rounded' | 'glass';
}

interface KernelDriver {
  name: string;
  impact: string;
  rationale?: string;
  id: string;
}

interface SystemSnapshot {
  timestamp: number;
  components: ComponentSpec[];
  theme: ThemeState;
  kernelDrivers: KernelDriver[];
  manifesto: string;
  directives: string[];
}

interface MigrationPlan {
  thought: string;
  explanation: string;
  utilityScore?: number;
  complexityRatio?: number;
  intentHash?: string;
  criticAssessment?: string;
  manifesto?: string;
  isFallback?: boolean;
  quotaExhausted?: boolean;
  curatorRejected?: boolean;
  rejectedSimulationHashes?: string[];
  oracleReasoning?: string;
  council?: {
    builder: string;
    strategist: string;
    operator: string;
  };
  sourceDiff?: {
    before: string;
    after: string;
    rationale: string;
  };
  actions: {
    action: 'ADD' | 'MODIFY' | 'REMOVE' | 'MUTATE_THEME' | 'PATCH' | 'SOURCE_MUTATION' | 'SET_DIRECTIVE';
    targetId?: string;
    directive?: string;
    plan?: ComponentSpec;
    patchData?: { name: string; impact: string; rationale: string };
    themeUpdate?: Partial<ThemeState>;
  }[];
}

const CognitiveNodeGraph = ({ activeNodeTitle, cpu, directives }: { activeNodeTitle?: string; cpu: number; directives: string[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  return (
    <div ref={containerRef} className="w-full h-48 relative overflow-hidden bg-black/20 rounded-2xl border border-white/5">
      <svg className="w-full h-full">
        <defs>
          <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Connection Lines */}
        {directives.map((_, i) => (
          <motion.line
            key={`line-${i}`}
            x1="50%" y1="50%"
            x2={`${20 + (i * 15)}%`} y2={`${20 + (Math.sin(i) * 20 + 30)}%`}
            stroke="var(--gold)"
            strokeWidth="0.5"
            strokeOpacity="0.1"
            animate={{ strokeOpacity: [0.05, 0.2, 0.05] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}

        {/* Central Orchestrator Node */}
        <motion.circle
          cx="50%" cy="50%"
          r={20 + (cpu / 10)}
          fill="url(#nodeGradient)"
          animate={{ 
            r: [20 + (cpu / 10), 25 + (cpu / 10), 20 + (cpu / 10)],
            fill: cpu > 60 ? 'rgba(196,166,97,0.6)' : 'rgba(196,166,97,0.3)'
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <text x="50%" y="50%" textAnchor="middle" dy=".3em" className="fill-gold font-mono text-[6px] uppercase font-bold tracking-tighter">
          AXIOM_CORE
        </text>

        {/* Dynamic Directive Nodes */}
        {directives.map((d, i) => (
          <g key={`node-${i}`}>
            <motion.circle
              cx={`${20 + (i * 15)}%`} cy={`${20 + (Math.sin(i) * 20 + 30)}%`}
              r="4"
              fill="var(--gold)"
              className="opacity-20"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{ duration: 2 + i, repeat: Infinity }}
            />
            <text 
              x={`${20 + (i * 15)}%`} 
              y={`${20 + (Math.sin(i) * 20 + 35)}%`} 
              textAnchor="middle" 
              className="fill-white/30 font-mono text-[4px] uppercase tracking-tighter"
            >
              {d.substring(0, 12)}
            </text>
          </g>
        ))}

        {/* Telemetry Pulse Clusters */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: '50% 50%' }}
        >
          <circle cx="80%" cy="20%" r="2" fill="var(--gold)" className="opacity-40" />
          <circle cx="20%" cy="80%" r="2" fill="var(--gold)" className="opacity-40" />
        </motion.g>
      </svg>
      
      <div className="absolute bottom-2 left-4 font-mono text-[5px] text-white/20 uppercase tracking-[0.2em]">
        Cognitive_Map_v4.2 // Load_Index: {cpu.toFixed(1)}
      </div>
    </div>
  );
};

const SpectralWaveform = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let offset = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(196,166,97,0.4)';
      ctx.lineWidth = 1;

      for (let x = 0; x < canvas.width; x++) {
        const y = (canvas.height / 2) + Math.sin(x * 0.1 + offset) * 10 + Math.sin(x * 0.05 + offset * 0.5) * 5;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
      offset += 0.1;
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return <canvas ref={canvasRef} width={200} height={40} className="w-full h-10 opacity-50" />;
};

interface NexusIntegration {
  id: string;
  baseUrl: string;
  authConfig?: {
    type: 'Bearer' | 'ApiKey' | 'Basic';
    token: string;
  };
  status: 'CONNECTED' | 'THROTTLED' | 'OFFLINE';
}

const NexusGatewayPortal = ({ integrations, onRegister }: { integrations: NexusIntegration[], onRegister: (p: Partial<NexusIntegration>) => void }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [newProfile, setNewProfile] = useState<Partial<NexusIntegration>>({ id: '', baseUrl: '', authConfig: { type: 'Bearer', token: '' } });

  return (
    <div className="p-8 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-2xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <Network className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-white/90">Nexus Gateway</h2>
            <p className="text-[8px] text-white/30 uppercase tracking-widest">Dynamic API Registry</p>
          </div>
        </div>
        <button 
          onClick={() => setShowConfig(!showConfig)}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm text-[8px] uppercase tracking-widest transition-all cursor-pointer"
        >
          {showConfig ? 'Close Forge' : 'Open Integration Forge'}
        </button>
      </div>

      {showConfig && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-8 p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <input 
              placeholder="Integration ID" 
              className="bg-black/50 border border-white/10 px-4 py-2 text-[10px] font-mono text-white outline-none"
              value={newProfile.id}
              onChange={e => setNewProfile({...newProfile, id: e.target.value})}
            />
            <input 
              placeholder="Base URL" 
              className="bg-black/50 border border-white/10 px-4 py-2 text-[10px] font-mono text-white outline-none"
              value={newProfile.baseUrl}
              onChange={e => setNewProfile({...newProfile, baseUrl: e.target.value})}
            />
          </div>
          <button 
            onClick={() => onRegister(newProfile)}
            className="w-full py-3 bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest hover:bg-blue-500/40 transition-all cursor-pointer"
          >
            Register Pipeline
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {integrations.map(int => (
          <div key={int.id} className="p-4 bg-white/[0.01] border border-white/5 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", int.status === 'CONNECTED' ? 'bg-green-400' : 'bg-red-400')} />
              <div>
                <div className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{int.id}</div>
                <div className="text-[7px] text-white/20 font-mono">{int.baseUrl}</div>
              </div>
            </div>
            <div className="flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <motion.div 
                animate={{ scaleX: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-[1px] bg-blue-500/40"
              />
              <span className="text-[7px] text-blue-400/60 font-black uppercase tracking-widest">{int.status}</span>
            </div>
          </div>
        ))}
        {integrations.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl opacity-20">
            <span className="text-[8px] uppercase tracking-[0.3em]">No Active Pipelines</span>
          </div>
        )}
      </div>
    </div>
  );
};

const HostProcessStream = ({ logs }: { logs: string[] }) => {
  return (
    <div className="p-8 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-2xl h-80 flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-2 bg-emerald-500/10 rounded-sm">
          <Terminal className="w-4 h-4 text-emerald-400" />
        </div>
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/90">Host Process Stream</h2>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 pr-4 custom-scrollbar bg-black/20 p-4 rounded-lg border border-white/5">
        {logs.map((log, i) => {
          const isError = log.includes('ERR:') || log.includes('FATAL');
          const isSuccess = log.includes('SUCCESS:');
          return (
            <div key={i} className={cn(
              "font-mono text-[9px] whitespace-pre-wrap flex gap-3",
              isError ? "text-red-400" : (isSuccess ? "text-emerald-400" : "text-white/40")
            )}>
              <span className="opacity-30 shrink-0">[{i}]</span>
              <span>{log}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function App() {
  const [instanceId, setInstanceId] = useState(() => {
    let id = localStorage.getItem('axiom_instance_id');
    if (!id) {
      id = Math.random().toString(36).substring(2, 10).toUpperCase();
      localStorage.setItem('axiom_instance_id', id);
    }
    return id;
  });

  const [displayInstanceId, setDisplayInstanceId] = useState(instanceId);
  const [screenShake, setScreenShake] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    if (isGlitching) {
      const interval = setInterval(() => {
        setDisplayInstanceId(Math.random().toString(36).substring(2, 10).toUpperCase());
      }, 50);
      return () => {
        clearInterval(interval);
        setDisplayInstanceId(instanceId);
      };
    }
  }, [isGlitching, instanceId]);

  const triggerGlitch = () => {
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 1500);
  };

  const triggerShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 500);
  };

  const [components, setComponents] = useState<ComponentSpec[]>(() => {
    const saved = localStorage.getItem(`axiom_${instanceId}_components`) || localStorage.getItem('axiom_components');
    return saved ? JSON.parse(saved) : [];
  });
  const [kernelDrivers, setKernelDrivers] = useState<KernelDriver[]>(() => {
    const saved = localStorage.getItem(`axiom_${instanceId}_kernel_drivers`) || localStorage.getItem('axiom_kernel_drivers');
    return saved ? JSON.parse(saved) : [];
  });
  const [manifesto, setManifesto] = useState(() => {
    return localStorage.getItem(`axiom_${instanceId}_manifesto`) || localStorage.getItem('axiom_manifesto') || "Phase 1: Initial Link Established.";
  });
  const [theme, setTheme] = useState<ThemeState>(() => {
    const saved = localStorage.getItem(`axiom_${instanceId}_theme`) || localStorage.getItem('axiom_theme');
    return saved ? JSON.parse(saved) : {
      primary: '#c4a661',
      accent: 'rgba(196,166,97,0.05)',
      font: 'Serif',
      border: 'rounded'
    };
  });
  const [isBuilding, setIsBuilding] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [snapshots, setSnapshots] = useState<SystemSnapshot[]>(() => {
    const saved = localStorage.getItem('axiom_snapshots');
    return saved ? JSON.parse(saved) : [];
  });
  const [logs, setLogs] = useState<string[]>(['Axiom Orchestrator Initialized.']);
  const [rejectedIntents, setRejectedIntents] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('axiom_rejected_intents');
    return new Set(saved ? JSON.parse(saved) : []);
  });
  const [migration, setMigration] = useState<MigrationPlan | null>(null);
  const [autonomous, setAutonomous] = useState(false);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [isQuotaExhausted, setIsQuotaExhausted] = useState(() => {
    return localStorage.getItem('axiom_quota_exhausted') === 'true';
  });
  const [lastAttemptTime, setLastAttemptTime] = useState(0);
  const [retryDelay, setRetryDelay] = useState(30000); // 30s base for frequent drift
  const [neuralLoad, setNeuralLoad] = useState(0);
  const [systemVitality, setSystemVitality] = useState(100);
  const [activeSignals, setActiveSignals] = useState<string[]>([]);
  const [nexusIntegrations, setNexusIntegrations] = useState<NexusIntegration[]>([]);
  const [hostLogs, setHostLogs] = useState<string[]>([]);
  const [coreDirectives, setCoreDirectives] = useState<string[]>(() => {
    const saved = localStorage.getItem(`axiom_${instanceId}_directives`);
    return saved ? JSON.parse(saved) : ["Protect Instance Integrity", "Analyze Mission Signals"];
  });
  const [telemetryHistory, setTelemetryHistory] = useState<any[]>([]);
  const [safetyOverrideMode, setSafetyOverrideMode] = useState(false);
  const [chronosEngineActive, setChronosEngineActive] = useState(false);
  const [isAnalysisMode, setIsAnalysisMode] = useState(false);
  const [missionProgress, setMissionProgress] = useState(0);
  const [homeBaseSynced, setHomeBaseSynced] = useState(false);
  const [hardwareStats, setHardwareStats] = useState<{cpu: number, mem: number, networkDrift?: number, integrity?: number}>({ cpu: 22.4, mem: 15420, networkDrift: 42, integrity: 0.98 });
  const [signalLogs, setSignalLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // HomeBase Telemetry Polling (High-Integrity Bridge) with Fallback
  useEffect(() => {
    let simInterval: any;
    
    const pollTelemetry = async () => {
      try {
        const response = await fetch('/api/bridge/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: 'SYS_HEALTH_SYNC' }),
          signal: AbortSignal.timeout(500)
        });
        if (response.ok) {
          const data = await response.json();
          if (data.telemetry) {
            setHardwareStats(data.telemetry);
            setHomeBaseSynced(true);
            return;
          }
        }
        throw new Error('Bridge timeout');
      } catch (e) {
        setHomeBaseSynced(false);
        // Fallback simulation: Machine Ecology
        setHardwareStats(prev => {
          const snapshotBonus = snapshots.length * 0.5;
          const networkDrift = 45 + Math.random() * 80 + (isBuilding ? 50 : 0);
          return {
            cpu: Math.max(14.2, Math.min(38.6, prev.cpu + (Math.random() - 0.5) * 4 + (isBuilding ? 15 : 0))),
            mem: Math.min(16000, 15000 + snapshots.length * 100 + (Math.random() * 200)),
            networkDrift,
            integrity: 0.95 + Math.random() * 0.05 - (isBuilding ? 0.05 : 0)
          };
        });
      }
    };

    const interval = setInterval(pollTelemetry, homeBaseSynced ? 3000 : 1000);
    pollTelemetry();
    return () => clearInterval(interval);
  }, [homeBaseSynced]);

  // Host Process Stream SSE
  useEffect(() => {
    const eventSource = new EventSource('/api/system/stream');
    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'INIT') {
        setHostLogs(data.logs);
      } else if (data.type === 'LOG') {
        setHostLogs(prev => [...prev.slice(-200), data.log]);
      } else if (data.type === 'HEARTBEAT') {
        // Just keeping alive
      }
    };
    return () => eventSource.close();
  }, []);

  // Sync log updates (simulated since SSE INIT is one-shot in my basic implementation)
  useEffect(() => {
    const interval = setInterval(async () => {
      // In a real app we'd push new logs via the same SSE or another mechanism
      // For now we'll just periodically check for refresh or rely on current state
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Nexus Integrations Sync
  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const res = await fetch('/api/nexus/registry');
        if (res.ok) setNexusIntegrations(await res.json());
      } catch (e) {}
    };
    fetchIntegrations();
  }, []);

  const registerIntegration = async (profile: Partial<NexusIntegration>) => {
    try {
      const res = await fetch('/api/nexus/registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        setNexusIntegrations(prev => [...prev, { ...profile, status: 'CONNECTED' } as NexusIntegration]);
      }
    } catch (e) {}
  };

  // Signal Lab: Hex Log Ticker
  useEffect(() => {
    const interval = setInterval(() => {
      const hex = Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
      const events = ['FREQ_MATCH', 'DRIFT_DETECTED', 'NODE_SYNC', 'DNA_STABLE', 'NEURAL_PULSE', 'VOID_SCAN'];
      const event = events[Math.floor(Math.random() * events.length)];
      setSignalLogs(prev => [`[0x${hex}: ${event}]`, ...prev].slice(0, 10));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Temporal Memory Buffer (Neural Mesh)
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetryHistory(prev => {
        const next = [...prev, {
          timestamp: Date.now(),
          cpu: hardwareStats?.cpu || neuralLoad,
          vitality: systemVitality,
          nodeCount: components.length
        }].slice(-60); // 60 snapshots (e.g., last 5-10 mins depends on interval)
        return next;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [hardwareStats, neuralLoad, systemVitality, components]);

  // Adaptive Styling Engine
  useEffect(() => {
    if (systemVitality < 40) {
      if (theme.primary !== '#ff5555' || theme.font !== 'Mono') {
        addLog("ADAPTIVE_STYLING: Vitality critical. Engaging Emergency Protocol.");
        setTheme(t => ({ ...t, primary: '#ff5555', accent: 'rgba(255, 85, 85, 0.1)', font: 'Mono', border: 'sharp' }));
      }
    } else if (systemVitality > 90) {
      if (theme.primary !== '#c4a661' || theme.font !== 'Serif') {
        addLog("ADAPTIVE_STYLING: Vitality stabilized. Returning to Sophisticated Aesthetic.");
        setTheme(t => ({ ...t, primary: '#c4a661', accent: 'rgba(196,166,97,0.05)', font: 'Serif', border: 'glass' }));
      }
    }
  }, [systemVitality]);

  // Event Bus / Inter-Node Signals
  useEffect(() => {
    const totalSignals = components.flatMap(c => c.props?.signals || []);
    if (totalSignals.length > activeSignals.length) {
      const newSignal = totalSignals[totalSignals.length - 1];
      addLog(`EVENT_BUS: Signal Detected: [${newSignal}]`);
      setActiveSignals(totalSignals);

      // Fluid Geometry: Analysis Mode Trigger
      if (newSignal === 'SETI_ANOMALY' || newSignal === 'CRITICAL_DISCOVERY') {
        setIsAnalysisMode(true);
        addLog("SOVEREIGN_AGENCY: Engaging Deep-Analysis Geometry.");
        setTimeout(() => {
          setIsAnalysisMode(false);
          addLog("SOVEREIGN_AGENCY: Core analysis complete. Restoring node grid.");
        }, 30000); // 30s analysis window
      }
    }
  }, [components]);

  // Neural Load & Vitality Simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setNeuralLoad(prev => {
        const reduction = kernelDrivers.length * 1.5;
        // Load increases if HomeBase is disconnected (manual overhead)
        const loadBias = homeBaseSynced ? 0 : 15;
        const target = isBuilding ? 85 : (autonomous ? 20 - reduction + loadBias : 5 + loadBias);
        const delta = (target - prev) * 0.1;
        return Math.max(0, Math.min(100, prev + delta + (Math.random() - 0.5) * 5));
      });

      // Vitality influenced by components, drivers, and HomeBase sync
      setSystemVitality(prev => {
        const base = 100 - (components.length * 2);
        const bonus = kernelDrivers.length * 5 + (homeBaseSynced ? 15 : 0);
        const target = Math.max(0, Math.min(100, base + bonus));
        return prev + (target - prev) * 0.05;
      });

      // Mission Progress - based on specialized components and HomeBase research cycles
      setMissionProgress(prev => {
        const missionNodes = components.filter(c => c.title.toLowerCase().includes('signal') || c.title.toLowerCase().includes('anomaly') || c.props?.discoveryHash).length;
        const increment = missionNodes * 0.01 + (autonomous ? 0.005 : 0) + (homeBaseSynced && systemVitality > 60 ? 0.015 : 0);
        return Math.min(100, prev + increment);
      });
    }, 200);
    return () => clearInterval(interval);
  }, [isBuilding, autonomous, kernelDrivers, components, homeBaseSynced, systemVitality]);

  // Autonomous Local Synthesis Loop
  useEffect(() => {
    if (!autonomous || !isQuotaExhausted) return;

    const interval = setInterval(() => {
      const rand = Math.random();
      if (rand > 0.8) {
        addLog("LOCAL_SYNTHESIS: Engaging autonomous heuristic branch.");
        checkForEvolution();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autonomous, isQuotaExhausted]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`axiom_${instanceId}_components`, JSON.stringify(components));
    localStorage.setItem(`axiom_${instanceId}_theme`, JSON.stringify(theme));
    localStorage.setItem(`axiom_${instanceId}_kernel_drivers`, JSON.stringify(kernelDrivers));
    localStorage.setItem(`axiom_${instanceId}_manifesto`, manifesto);
    localStorage.setItem(`axiom_${instanceId}_directives`, JSON.stringify(coreDirectives));
    localStorage.setItem(`axiom_${instanceId}_rejected_intents`, JSON.stringify(Array.from(rejectedIntents)));
    
    // Global fallback for initial load migration
    localStorage.setItem('axiom_components', JSON.stringify(components));
  }, [components, theme, kernelDrivers, manifesto, rejectedIntents, instanceId]);

  // Apply Theme to DOM
  useEffect(() => {
    document.documentElement.style.setProperty('--gold', theme.primary);
    document.documentElement.style.setProperty('--accent-glow', theme.accent);
    
    const body = document.body;
    body.classList.remove('font-serif', 'font-sans', 'font-mono');
    body.classList.add(`font-${theme.font.toLowerCase()}`);
  }, [theme]);

  const createSnapshot = () => {
    const newSnapshot: SystemSnapshot = {
      timestamp: Date.now(),
      components: [...components],
      theme: { ...theme },
      kernelDrivers: [...kernelDrivers],
      manifesto,
      directives: [...coreDirectives] // Added to snapshot
    };
    const nextSnapshots = [newSnapshot, ...snapshots].slice(0, 10); // Increase to 10
    setSnapshots(nextSnapshots);
    localStorage.setItem('axiom_snapshots', JSON.stringify(nextSnapshots));
    addLog(`Snapshot Created: Branch ${newSnapshot.timestamp.toString(16).toUpperCase()} staged.`);
  };

  const rollback = (index: number = 0) => {
    const target = snapshots[index];
    if (!target) {
      addLog("Rollback Failed: No snapshot found.");
      return;
    }

    setComponents(target.components);
    setTheme(target.theme);
    setKernelDrivers(target.kernelDrivers);
    setManifesto(target.manifesto);
    if (target.directives) setCoreDirectives(target.directives);
    addLog(`Chronos Reversion: Branch ${target.timestamp.toString(16).toUpperCase()} reconciled.`);
    triggerShake();
  };

  const checkForEvolution = async () => {
    if (isBuilding || migration || isCoolingDown) return;
    
    // Minimum 5s gap between manual clicks
    const now = Date.now();
    if (now - lastAttemptTime < 5000) {
      addLog("Neural Core Cooling: Request throttled.");
      return;
    }
    setLastAttemptTime(now);

    setIsBuilding(true);
    triggerGlitch();
    
    // Hardware Spike Simulation
    setHardwareStats(prev => ({ ...prev, cpu: 74.1 }));
    setTimeout(() => {
      setHardwareStats(prev => ({ ...prev, cpu: prev.cpu > 50 ? 32.4 : prev.cpu }));
    }, 2000);
    
    // Sovereign Bridge: Trigger local execution if synced
    if (homeBaseSynced) {
      addLog("SOVEREIGN_BRIDGE: Invoking local power-shell script for evolution branch.");
      fetch('/api/bridge/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'PROVOKE_EVOLUTION', instanceId })
      }).catch(e => console.warn("Bridge invoke failed", e));
    }

    try {
      const response = await fetch('/api/evolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          components, 
          theme,
          drivers: kernelDrivers,
          directives: coreDirectives,
          instanceId,
          rejectedIntents: Array.from(rejectedIntents),
          telemetryHistory // Added for temporal analysis
        }),
      });
      
      if (response.status === 429 || response.status === 503) {
        setIsQuotaExhausted(true);
        const isUnavailable = response.status === 503;
        setRetryDelay(prev => Math.min(prev * 2, 900000));
        addLog(isUnavailable ? "AXIOM: Intelligence layer overloaded [503]. Retrying later..." : "AXIOM: Neural link saturated [429]. Backing off...");
        return;
      }

      setIsQuotaExhausted(false);
      localStorage.removeItem('axiom_quota_exhausted');

      if (response.ok) {
        const data: MigrationPlan = await response.json();
        setMigration(data);
        
        if (data.curatorRejected) {
          addLog("CURATOR_POLICY: Rejected architectural drift.");
          addLog("IMMUNE_SYSTEM: Heuristic branch engaged.");
        } else if (data.intentHash && rejectedIntents.has(data.intentHash)) {
          addLog("INTENT_GUARD: Suppressing repetitive mutation.");
          setMigration(null);
          return;
        } else if (data.quotaExhausted) {
          setIsQuotaExhausted(true);
          setRetryDelay(prev => Math.min(prev * 2, 300000)); // Aggressive backoff on quota
          addLog("AXIOM: Neural link saturated. Engaging local synthesis.");
        } else if (data.isFallback) {
          setIsQuotaExhausted(true);
          setRetryDelay(60000); // 1 min for non-quota local mode
          addLog("AXIOM: Synthesis drift detected. Fallback active.");
        } else {
          setIsQuotaExhausted(false);
          setRetryDelay(30000); // Reset to 30s for healthy neural link
          addLog(`Axiom Analysis: ${data.actions.length} operations ready.`);
          const patches = data.actions.filter(a => a.action === 'PATCH');
          if (patches.length > 0) {
            addLog(`Core Kernel: Distributed ${patches.length} logical patches.`);
          }
        }
      } else {
        addLog(`Axiom Sync Error: ${response.status}`);
      }
    } catch (err: any) {
      console.error("Evolution cycle failed", err);
      const isFetchError = err.message?.includes('fetch') || err.message?.includes('Network');
      addLog(`NEURAL_GAP: ${err.message || 'Connection Interrupted'}`);
      if (isFetchError) {
        addLog("CRITICAL: Server Link Severed. This usually happens during a Core Reboot. Stand by...");
      } else {
        addLog("External Interference detected. Engaging safe-mode heuristics.");
      }
    } finally {
      setIsBuilding(false);
    }
  };

  // Autonomous Evolution Loop
  useEffect(() => {
    if (!autonomous || migration || isBuilding) return;
    
    const timer = setTimeout(checkForEvolution, retryDelay); 
    return () => clearTimeout(timer);
  }, [components, isBuilding, migration, theme, isCoolingDown, retryDelay, instanceId, autonomous]);

  // Handle Auto-Convergence
  useEffect(() => {
    if (autonomous && migration) {
      const timer = setTimeout(() => {
        applyMigration();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [autonomous, migration]);

  const applyMigration = async () => {
    if (!migration) return;
    
    // Heuristic Override Safety Layer
    const removalsCount = migration.actions.filter(a => a.action === 'REMOVE').length;
    const currentCount = components.length;
    if (removalsCount > (currentCount * 0.5) && !safetyOverrideMode) {
      addLog("SAFETY_LAYER: Massive architectural pruning detected (>50%). Confirmation Required.");
      setSafetyOverrideMode(true);
      return;
    }

    setIsValidating(true);
    setValidationProgress(0);
    addLog("Immune System: Scrutinizing synthesis plan...");

    // Simulated "Validation Pass"
    for (let i = 0; i <= 100; i += 20) {
      setValidationProgress(i);
      await new Promise(r => setTimeout(r, 200));
    }

    if (migration.criticAssessment) {
      addLog(`Critic Feedback: ${migration.criticAssessment}`);
    }

    createSnapshot(); // Buffer the current state before applying changes
    triggerGlitch();
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 500);

    let nextComponents = [...components];
    let nextTheme = { ...theme };
    let nextDrivers = [...kernelDrivers];

    if (migration.manifesto) {
      setManifesto(migration.manifesto);
    }

    if (migration.coreDirectives) {
      setCoreDirectives(migration.coreDirectives);
    }

    migration.actions.forEach(op => {
      if (op.action === 'MUTATE_THEME' && op.themeUpdate) {
        nextTheme = { ...nextTheme, ...op.themeUpdate };
      } else if (op.action === 'SET_DIRECTIVE' && (op.directive || op.plan?.directive)) {
        const d = op.directive || op.plan?.directive;
        if (d) setCoreDirectives(prev => [...new Set([...prev, d])].slice(-5));
      } else if (op.action === 'SOURCE_MUTATION') {
        addLog("Source DNA: Mutation sequence synchronized. Permanent refactor buffered.");
      } else if (op.action === 'MCP_TOOL_CALL' && op.toolName && op.toolArgs) {
        const mcpId = Date.now();
        fetch('/api/mcp/rpc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: `tools/call`,
            params: { name: op.toolName, arguments: op.toolArgs },
            id: mcpId
          })
        });
        addLog(`MCP: Invoked [${op.toolName}]`);
      } else if (op.action === 'PATCH' && op.patchData) {
        if (op.patchData.name === 'CORE_REFACTOR') {
          addLog("Optimization: Internal Refactor executed.");
        }
        // Add or update kernel driver
        const existingIdx = nextDrivers.findIndex(d => d.name === op.patchData?.name);
        if (existingIdx >= 0) {
          nextDrivers[existingIdx] = { 
            name: op.patchData.name,
            impact: op.patchData.impact,
            rationale: op.patchData.rationale,
            id: nextDrivers[existingIdx].id 
          };
        } else {
          nextDrivers.push({ 
            name: op.patchData.name,
            impact: op.patchData.impact,
            rationale: op.patchData.rationale,
            id: `driver-${Date.now()}-${Math.random()}` 
          });
        }
      } else {
        switch (op.action) {
          case 'ADD':
            if (op.plan) nextComponents.push(op.plan);
            break;
          case 'MODIFY':
            nextComponents = nextComponents.map(c => c.id === op.targetId && op.plan ? op.plan : c);
            break;
          case 'REMOVE':
            nextComponents = nextComponents.filter(c => c.id !== op.targetId);
            break;
        }
      }
    });

    setComponents(nextComponents);
    setTheme(nextTheme);
    setKernelDrivers(nextDrivers.slice(-6)); // Keep latest 6 drivers
    setIsValidating(false);
    setSafetyOverrideMode(false);
    addLog(`Neural Convergence: Batch sequence successful.`);
    setMigration(null);
  };

  const handleCommitSource = async () => {
    if (!migration || !migration.sourceDiff) return;
    
    setIsBuilding(true);
    addLog(`GIT_KERNEL: Initiating commit for hash ${migration.intentHash?.substring(0,6)}...`);
    
    try {
      // Perform the actual text replacement for simulation (and for the server)
      const currentDNA = await (await fetch('/src/App.tsx')).text();
      const mutatedDNA = currentDNA.replace(migration.sourceDiff.before, migration.sourceDiff.after);

      const res = await fetch("/api/git/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchName: `evolution/${migration.intentHash || Date.now()}`,
          commitMessage: `[AXIOM_EVOLUTION] ${migration.explanation.substring(0, 50)}...`,
          files: [{ path: 'src/App.tsx', content: mutatedDNA }]
        }),
      });

      const data = await res.json();
      if (data.success) {
        addLog("GIT_KERNEL: Commit successful. Branch staged.");
        setMigration(null);
      } else {
        addLog(`GIT_KERNEL_ERROR: ${data.error}`);
        // Fallback for demo environments without real git
        addLog("SIMULATION_MODE: Mutation applied to local memory state.");
        setMigration(null);
      }
    } catch (e) {
      addLog("GIT_KERNEL_CRITICAL: Handshake failed.");
    } finally {
      setIsBuilding(false);
    }
  };

  const handleNodeAction = (command: string) => {
    addLog(`Agency Deployment: Executing command [${command}]`);
    
    // Simulate real action impact
    setTimeout(() => {
      if (command.includes('CACHE')) {
        addLog("Neural Flush: Memory buffers cleared.");
      } else if (command.includes('SYNC')) {
        addLog("Core Sync: Environment delta reconciled.");
      } else if (command.includes('OPTIMIZE')) {
        addLog("Recursive Optimization: DNA strands aligned.");
      } else {
        addLog(`Command [${command}] completed with status 0.`);
      }
    }, 1500);
  };

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-5), msg]);
  };

  const clearDashboard = () => {
    localStorage.clear();
    const newId = Math.random().toString(36).substring(2, 10).toUpperCase();
    localStorage.setItem('axiom_instance_id', newId);
    
    setComponents([]);
    setKernelDrivers([]);
    setCoreDirectives(["Protect Instance Integrity", "Analyze Mission Signals"]);
    setManifesto("Phase 0: Memory Flushed. Rebooting...");
    setRejectedIntents(new Set());
    setTheme({
      primary: '#c4a661',
      accent: 'rgba(196,166,97,0.05)',
      font: 'Serif',
      border: 'rounded'
    });
    setMigration(null);
    setInstanceId(newId);
    setLogs(['Axiom Orchestrator Reset. Root instance purged.']);
    setAutonomous(false);
    setIsCoolingDown(false);
    setIsQuotaExhausted(false);
    setRetryDelay(30000); // Fast initial poll after reset
    triggerGlitch();
  };

  return (
    <motion.div 
      animate={screenShake ? {
        x: [0, -10, 10, -10, 10, 0],
        y: [0, 5, -5, 5, -5, 0]
      } : {}}
      transition={{ duration: 0.4 }}
      className={cn(
        "min-h-screen bg-[#020202] text-[#e0e0e0] font-sans flex overflow-hidden relative selection:bg-gold/30 selection:text-white",
        theme.border === 'sharp' ? 'rounded-none' : 'rounded-3xl m-4',
        isGlitching && "animate-pulse"
      )}
      style={isGlitching ? { filter: 'contrast(1.5) brightness(1.2) hue-rotate(90deg)' } : {}}
    >
      {/* Neural Resonance: 3D Heartbeat Mesh */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            opacity: [0.05, 0.2 * (hardwareStats?.integrity || 1), 0.05],
            scale: [1, 1 + ((hardwareStats?.cpu || 0) / 400), 1],
            rotate: [0, 5 * (1 - (hardwareStats?.integrity || 1)) + 5, 0],
            skewX: [0, (hardwareStats?.cpu || 0) / 10, 0],
            skewY: [0, (hardwareStats?.networkDrift || 0) / 40, 0]
          }}
          transition={{ 
            duration: Math.max(0.4, 3 - ((hardwareStats?.cpu || 0) / 20)), 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute inset-[-20%] bg-[radial-gradient(circle_at_center,_rgba(196,166,97,0.2)_0%,_transparent_60%)] filter blur-[100px] opacity-20"
        />
        <motion.div 
          animate={{ 
            opacity: [0.02, 0.08, 0.02],
            x: ['-10%', '10%', '-10%'],
            y: ['-10%', '10%', '-10%'],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: Math.max(1, 6 - ((hardwareStats?.cpu || 0) / 15)), 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,_transparent_0%,_rgba(196,166,97,0.08)_50%,_transparent_100%)] opacity-30"
        />
        {/* Dynamic Shadow Interference */}
        <motion.div 
          animate={{ 
            opacity: [0, 0.1, 0],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{ 
            duration: 1.5,
            repeat: Infinity,
            ease: "anticipate"
          }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,_rgba(0,0,0,0.5)_0%,_transparent_50%)]"
        />
      </div>

      {/* Background Heartbeat Pulse (Legacy fallback) */}
      <motion.div 
        animate={{ 
          opacity: [0.01, 0.04, 0.01],
          scale: [1, 1.2, 1],
        }}
        transition={{ 
          duration: Math.max(0.5, 4 - ((hardwareStats?.cpu || 10) / 25)) * 2, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,_rgba(196,166,97,0.1)_0%,_transparent_70%)]"
      />

      {/* Precision Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
           style={{ 
             backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
             backgroundSize: '40px 40px' 
           }} 
      />

      {/* Global Scanline Effect */}
      <div className="absolute inset-0 z-50 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] bg-[length:100%_2px,3px_100%]" />

      {/* Axis Lines */}
      <div className="absolute top-0 left-20 bottom-0 w-[1px] bg-white/[0.02] z-0" />
      <div className="absolute top-20 left-0 right-0 h-[1px] bg-white/[0.02] z-0" />

      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(196,166,97,0.03)_0%,_transparent_70%)] pointer-events-none" />

      {/* Neural Core Activity Stream */}
      <div className="absolute right-8 top-32 w-48 space-y-2 opacity-10 font-mono text-[7px] pointer-events-none select-none uppercase tracking-tighter">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div 
            key={i}
            animate={{ 
              opacity: [0.1, 0.4, 0.1], 
              x: [0, 2, 0],
              filter: neuralLoad > 60 ? ['blur(0px)', 'blur(1px)', 'blur(0px)'] : 'none'
            }}
            transition={{ duration: 2 + i % 3, repeat: Infinity }}
          >
            {`0x${(i * 1234).toString(16)}: CORE_DRIFT_${(Math.random() * 10).toFixed(0)} >> ${isQuotaExhausted ? 'HEUR_LOCAL' : (autonomous ? 'ACTIVE' : 'IDLE')}`}
          </motion.div>
        ))}
      </div>

      {/* Grid Overlay / Flux */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(196,166,97,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(196,166,97,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <motion.div 
          animate={{ 
            opacity: [0.2, 0.3, 0.2],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(196,166,97,0.05)_0%,_transparent_100%)]" 
        />
      </div>

      {/* Side Profile / System Status */}
      <aside className="w-80 border-r border-white/5 bg-black/50 backdrop-blur-xl flex flex-col p-8 z-20">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-3 h-3 bg-gold rounded-full animate-pulse shadow-[0_0_10px_rgba(196,166,97,0.8)]" />
          <h1 className="text-[14px] font-bold tracking-[0.2em] uppercase text-white/90">Axiom v3.1</h1>
          <div className="ml-auto flex items-center gap-2">
            <motion.div 
              animate={{ opacity: homeBaseSynced ? [0.4, 0.8, 0.4] : 0.2 }}
              transition={{ duration: 2, repeat: Infinity }}
              className={cn("w-1.5 h-1.5 rounded-full", homeBaseSynced ? "bg-green-400" : "bg-white/20")} 
            />
            <Network className={cn("w-3 h-3", homeBaseSynced ? "text-green-400" : "text-white/20")} />
          </div>
        </div>

        <div className="flex-1 space-y-12">
          {/* Cognitive Mind-Map */}
          <CognitiveNodeGraph 
            cpu={hardwareStats.cpu} 
            directives={coreDirectives} 
          />

          {/* Host Process Stream */}
          <HostProcessStream logs={hostLogs} />

          {/* Nexus Gateway Portal */}
          <NexusGatewayPortal 
            integrations={nexusIntegrations} 
            onRegister={registerIntegration} 
          />

          {/* Physician & Explorer Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm space-y-2">
              <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest text-white/40">
                <HeartPulse className={cn("w-3 h-3", systemVitality < 40 ? "text-red-400 animate-pulse" : "text-green-400")} />
                Physician
              </div>
              <div className="text-[12px] font-mono text-white/80">{Math.round(systemVitality)}%</div>
              <div className="text-[7px] text-white/20 uppercase tracking-tighter">System Vitality</div>
            </div>

            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm space-y-2 relative overflow-hidden group">
              <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest text-white/40">
                <Monitor className={cn("w-3 h-3", homeBaseSynced ? "text-blue-400" : "text-white/20")} />
                Hardware Vitality
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[12px] font-mono text-white/80">{hardwareStats ? Math.round(hardwareStats.cpu) : (homeBaseSynced ? '8' : '--')}%</span>
                <span className="text-[7px] text-white/40">CPU</span>
                {hardwareStats?.networkDrift && (
                  <span className="text-[6px] text-gold/40 font-mono ml-auto">{Math.round(hardwareStats.networkDrift)}ms_DFT</span>
                )}
              </div>
              <div className={cn(
                "absolute bottom-0 left-0 h-[1px] bg-blue-500/50 transition-all duration-1000",
                homeBaseSynced ? "w-full" : "w-0"
              )} />
            </div>

            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm space-y-2">
              <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest text-white/40">
                <Telescope className="w-3 h-3 text-gold" />
                Explorer
              </div>
              <div className="text-[12px] font-mono text-white/80">{missionProgress.toFixed(2)}%</div>
              <div className="text-[7px] text-white/20 uppercase tracking-tighter">Mission Progress</div>
            </div>
          </div>

          {/* Research Lab Container (Signal Lab) */}
          {missionProgress > 1 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 border border-white/5 rounded-3xl bg-white/[0.01] backdrop-blur-3xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <FlaskConical className="w-32 h-32 text-gold rotate-12" />
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-gold/10 rounded-xl">
                  <Radio className="w-5 h-5 text-gold animate-pulse" />
                </div>
                <div>
                  <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-white/90">Signal Lab</h2>
                  <p className="text-[8px] text-white/30 uppercase tracking-widest">Active Neural Research Chamber</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* UAP Detection Arrays - Real API Integration */}
                <UAPDetectionArrays />
                
                {/* 20 Subsystems Status - Real API Integration */}
                <UAPSystemStatus />
                
                {components.filter(c => c.props?.discoveryHash).map(spec => (
                  <div key={spec.id} className="relative group">
                    <PrimitiveRenderer spec={spec} theme={theme} onAction={handleNodeAction} />
                    <div className="absolute -top-1 -right-1 bg-gold text-black text-[5px] font-black px-1.5 py-0.5 rounded-full select-none">
                      {spec.props.discoveryHash.substring(0, 8)}
                    </div>
                  </div>
                ))}
                {components.filter(c => c.props?.discoveryHash).length === 0 && (
                  <div className="col-span-2 py-6 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl">
                    <SpectralWaveform />
                    <div className="mt-4 flex flex-col items-center opacity-40">
                      <span className="text-[8px] uppercase tracking-[0.3em] animate-pulse">Scanning Frequencies: 1.42GHz</span>
                      <div className="mt-4 w-full px-4 font-mono text-[6px] text-gold/40 flex flex-col gap-1">
                        {signalLogs.map((log, i) => (
                          <motion.div 
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={i}
                          >
                            {log}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Neural Load & Coherence */}
          <div className="space-y-8">
            {isValidating && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gold/5 border border-gold/20 rounded-sm space-y-2"
              >
                <div className="flex justify-between text-[8px] uppercase tracking-[0.2em] text-gold/60">
                  <span>Immune Validation</span>
                  <span>{validationProgress}%</span>
                </div>
                <div className="h-[1px] w-full bg-white/5 relative">
                  <motion.div 
                    animate={{ width: `${validationProgress}%` }}
                    className="absolute inset-y-0 left-0 bg-gold/80"
                  />
                </div>
                <div className="text-[7px] text-white/30 italic font-mono uppercase tracking-tighter">
                  Scanning for architectural drift...
                </div>
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="flex justify-between text-[8px] uppercase tracking-[0.3em] text-white/20">
                <span>System Coherence</span>
                <span className="text-gold font-mono">{Math.round(Math.max(10, 100 - (components.length * 8) + (kernelDrivers.length * 15)))}%</span>
              </div>
              <div className="h-[2px] w-full bg-white/5 relative overflow-hidden">
                <motion.div 
                  animate={{ 
                    width: `${Math.max(10, 100 - (components.length * 8) + (kernelDrivers.length * 15))}%`,
                    opacity: [0.4, 0.8, 0.4]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-y-0 left-0 bg-gold/60 shadow-[0_0_15px_rgba(196,166,97,0.4)]"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-[8px] uppercase tracking-[0.3em] text-white/20">
                <span>Neural Sync</span>
                <span className="text-gold font-mono">{Math.round(neuralLoad)}%</span>
              </div>
              <div className="h-[2px] w-full bg-white/5 relative overflow-hidden">
                <motion.div 
                  animate={{ width: `${neuralLoad}%` }}
                  className="absolute inset-y-0 left-0 bg-gold/40 shadow-[0_0_10px_rgba(196,166,97,0.5)]"
                />
              </div>
              <div className="flex justify-between text-[7px] text-white/10 font-mono tracking-widest">
                <span>LTC: {isBuilding ? "CALC" : (autonomous ? "1.2ms" : "STBY")}</span>
                <span>CORE: {isQuotaExhausted ? "HEURISTIC" : "NEURAL"}</span>
              </div>
            </div>
          </div>

          {/* Kernel Drivers */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[8px] uppercase tracking-[0.25em] text-white/25 border-b border-white/5 pb-2">
              <Cpu className="w-3 h-3 opacity-50" />
              Kernel Drivers
            </div>
            <div className="space-y-4 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
              {kernelDrivers.length === 0 && (
                <div className="text-[9px] text-white/10 italic">No logical drivers active.</div>
              )}
              {kernelDrivers.map((driver) => (
                <motion.div 
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={driver.id} 
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-white/60 font-mono uppercase tracking-tighter">{driver.name}</span>
                    <span className="text-[8px] text-gold/30">v{(Math.random() + 1).toFixed(1)}</span>
                  </div>
                  <div className="text-[8px] text-white/20 italic font-sans leading-tight">
                    {driver.impact}
                  </div>
                  {driver.rationale && (
                    <div className="text-[7px] text-gold/10 font-mono pl-2 border-l border-white/5">
                      RAT: {driver.rationale}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Core Directives: Meta-Cognitive Layer */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[8px] uppercase tracking-[0.25em] text-white/25 border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <Layout className="w-3 h-3 opacity-50" />
                Core Directives
              </div>
              <span className="text-gold/40 text-[6px]">META_V1.3</span>
            </div>
            <div className="space-y-2">
              {coreDirectives.map((directive, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={idx}
                  className="flex items-start gap-2 group"
                >
                  <ArrowRight className="w-2 h-2 text-gold opacity-30 mt-1 shrink-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[9px] text-white/50 leading-tight group-hover:text-white/80 transition-colors uppercase tracking-tight font-mono">{directive}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Activity Logs */}
          <div className="space-y-6">
            <div className="flex justify-between items-center text-[8px] uppercase tracking-[0.25em] text-white/25 border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-3 h-3 opacity-50" />
                Manifest Logs
              </div>
              {snapshots.length > 0 && (
                <button 
                  onClick={() => rollback(0)}
                  className="hover:text-gold transition-colors flex items-center gap-1 cursor-pointer font-mono"
                >
                  <RefreshCcw className="w-2 h-2" />
                  REVERT_LATEST
                </button>
              )}
            </div>
            <div className="space-y-4 pr-4">
              {logs.map((log, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  className="text-[9px] leading-relaxed text-white/40 font-mono border-l border-white/5 pl-3"
                >
                  {log}
                </motion.div>
              ))}
              {isBuilding && (
                <div className="flex items-center gap-3 text-[9px] text-gold/50 animate-pulse font-mono tracking-tighter">
                  <RefreshCcw className="w-3 h-3 animate-spin" />
                  ANALYZING_TOPOLOGY...
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col gap-2 relative group">
          <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity blur-xl rounded-full" />
          <div className="relative">
            <div className="text-[8px] uppercase tracking-widest text-white/20 mb-1">Genetic Seed</div>
            <div className="text-[10px] font-mono text-gold/60 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
              {displayInstanceId}
              <span className="text-[6px] border border-gold/20 px-1 rounded-sm opacity-40">SOVEREIGN</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 overflow-y-auto relative p-12 custom-scrollbar">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-5xl mx-auto mb-12 border-l border-white/5 pl-8"
        >
          <div className="text-[10px] uppercase font-mono tracking-[0.6em] text-white/20 mb-2">Systems Manifesto</div>
          <h2 className="text-xl font-serif text-white/60 italic leading-relaxed tracking-tight">
            "{manifesto}"
          </h2>
        </motion.div>

        <div className={cn(
          "grid grid-cols-1 gap-8 max-w-5xl mx-auto pb-48 transition-all duration-1000",
          isAnalysisMode ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
        )}>
          <AnimatePresence mode="popLayout">
            {components.map((spec) => (
              <div key={spec.id}>
                <PrimitiveRenderer spec={spec} theme={theme} onAction={handleNodeAction} />
              </div>
            ))}
          </AnimatePresence>
        </div>

        {/* Deep Analysis Fluid Geometry */}
        <AnimatePresence>
          {isAnalysisMode && (
            <motion.div 
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-10 flex flex-col items-center justify-center p-24 bg-black/60 backdrop-blur-2xl"
            >
              <div className="w-full max-w-4xl space-y-12">
                <div className="flex items-center gap-8 border-b border-gold/20 pb-8">
                  <div className="p-6 bg-gold/10 rounded-full">
                    <Telescope className="w-12 h-12 text-gold animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black uppercase tracking-[0.5em] text-white">Deep Discovery Analysis</h1>
                    <p className="text-gold/40 text-sm font-mono tracking-widest mt-2">SOVEREIGN_PRIORITY_INTERRUPT // {activeSignals[activeSignals.length-1]}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-12">
                  <div className="col-span-2 aspect-square border border-gold/10 bg-gold/[0.02] relative rounded-3xl overflow-hidden flex items-center justify-center">
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 180, 270, 360],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-[20px] border-gold/5 rounded-full border-dashed"
                    />
                    <div className="flex flex-col items-center gap-4">
                      <Radio className="w-16 h-16 text-gold animate-ping" />
                      <span className="text-gold font-mono text-[10px] tracking-[0.5em] uppercase">Processing_Signal_DNA</span>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div className="p-6 border border-white/5 bg-white/[0.01] rounded-2xl">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gold/60 mb-4">Signal Metadata</h4>
                      <div className="space-y-4 font-mono text-[9px] text-white/40">
                        <div className="flex justify-between">
                          <span>Origin</span>
                          <span className="text-white">LAB_CHAMBER_01</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Intensity</span>
                          <span className="text-white">0.92 SYNC</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Branch</span>
                          <span className="text-white">CHRONOS_MAIN</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsAnalysisMode(false)}
                      className="w-full py-4 border border-white/10 hover:bg-white/5 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Restore Grid Surface
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Primary Action Interface */}
      <div className="fixed bottom-12 left-0 right-0 z-50 flex flex-col items-center gap-6">
        {/* Layman Explanation / Reason */}
        <AnimatePresence mode="wait">
          {migration && (
            <motion.div 
              initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
              className="flex flex-col items-center gap-3"
            >
              <div className="px-8 py-3 bg-white/[0.03] border border-white/10 backdrop-blur-md rounded-sm text-[10px] text-white/80 font-mono tracking-tight max-w-xl text-center shadow-2xl relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gold/5 transform -skew-x-12 translate-x-full group-hover:translate-x-[-100%] transition-transform duration-1000" />
                 
                 {/* Neural Metrics */}
                 {migration.council && (
                   <div className="mb-4 grid grid-cols-1 gap-2">
                     <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-sm text-left">
                       <div className="text-[6px] text-blue-400 font-black uppercase mb-1">Council_Voice // Builder</div>
                       <div className="text-[8px] text-white/70 italic leading-tight">"{migration.council.builder}"</div>
                     </div>
                     <div className="p-2 bg-gold/10 border border-gold/20 rounded-sm text-left">
                       <div className="text-[6px] text-gold/60 font-black uppercase mb-1">Council_Voice // Strategist</div>
                       <div className="text-[8px] text-white/70 italic leading-tight">"{migration.council.strategist}"</div>
                     </div>
                     <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-sm text-left">
                       <div className="text-[6px] text-red-400 font-black uppercase mb-1">Council_Voice // Operator</div>
                       <div className="text-[8px] text-white/70 italic leading-tight">"{migration.council.operator}"</div>
                     </div>
                   </div>
                 )}
                 {(migration.utilityScore !== undefined || migration.complexityRatio !== undefined) && (
                   <div className="mb-2 flex justify-center gap-6 text-[7px] uppercase tracking-widest text-gold/60 border-b border-white/5 pb-2">
                     <div className="flex flex-col gap-1">
                       <span>Utility Score</span>
                       <span className="text-[10px] text-white font-black">{migration.utilityScore}/10</span>
                     </div>
                     <div className="w-[1px] bg-white/5" />
                     <div className="flex flex-col gap-1">
                       <span>Complexity Ratio</span>
                       <span className={cn(
                         "text-[10px] font-black",
                         (migration.complexityRatio || 0) > (migration.utilityScore || 5) * 1.5 ? "text-red-400" : "text-white"
                       )}>
                         {migration.complexityRatio?.toFixed(1)}x
                       </span>
                     </div>
                   </div>
                 )}

                 {migration.oracleReasoning && (
                   <div className="mb-4 p-3 bg-gold/5 border border-gold/10 rounded-sm text-left">
                     <div className="flex items-center gap-2 text-[7px] text-gold/60 uppercase font-black tracking-widest mb-2">
                       <Sparkles className="w-3 h-3" />
                       Oracle Strategy Assessment
                     </div>
                     <p className="text-[9px] text-white/50 leading-relaxed italic">
                       "{migration.oracleReasoning}"
                     </p>
                     {migration.rejectedSimulationHashes && migration.rejectedSimulationHashes.length > 0 && (
                       <div className="mt-2 flex gap-2 overflow-hidden">
                         {migration.rejectedSimulationHashes.map(h => (
                           <div key={h} className="px-2 py-0.5 border border-white/5 text-[6px] text-white/20 font-mono uppercase tracking-tighter shrink-0">
                              Ghost_Path: {h.substring(0, 8)} [REJECTED]
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 )}

                 {migration.explanation}
                 {migration.sourceDiff && (
                   <div className="mt-4 space-y-3">
                     <div className="p-4 bg-black/40 border border-gold/20 rounded-sm space-y-3 text-left overflow-hidden">
                       <div className="flex items-center gap-2 text-[7px] text-gold/60 uppercase font-bold tracking-widest">
                         <GitBranch className="w-3 h-3" />
                         Code Evolution Sequence
                       </div>
                       <div className="space-y-2 text-[7px]">
                         <div className="space-y-1">
                           <div className="text-[6px] text-red-400 font-mono opacity-50 uppercase">(-) CURRENT_STRAND</div>
                           <pre className="p-2 bg-red-400/5 border-l border-red-400/20 font-mono text-red-200/80 whitespace-pre-wrap">{migration.sourceDiff.before}</pre>
                         </div>
                         <div className="space-y-1">
                           <div className="text-[6px] text-green-400 font-mono opacity-50 uppercase">(+) EVOLVED_STRAND</div>
                           <pre className="p-2 bg-green-400/5 border-l border-green-400/20 font-mono text-green-200/80 whitespace-pre-wrap">{migration.sourceDiff.after}</pre>
                         </div>
                       </div>
                       <div className="text-[7px] text-gold/40 italic pt-1 border-t border-white/5">
                         RAT: {migration.sourceDiff.rationale}
                       </div>
                     </div>
                     
                     <button 
                       onClick={handleCommitSource}
                       className="w-full py-3 bg-gold text-black text-[9px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-white transition-all cursor-pointer"
                     >
                       <RefreshCcw className="w-4 h-4" />
                       Stage & Commit DNA
                     </button>
                   </div>
                 )}
                 {migration.actions.some(a => a.action === 'PATCH') && (
                   <div className="mt-2 text-[8px] text-gold/40 border-t border-white/5 pt-2 flex items-center justify-center gap-2">
                     <Zap className="w-2 h-2" />
                     {migration.actions.filter(a => a.action === 'PATCH').length} LOGIC PATCHES DETECTED
                   </div>
                 )}
              </div>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[8px] text-gold/40 font-mono uppercase tracking-[0.4em]"
              >
                — {migration.thought} —
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-8">
          <button 
            disabled={isBuilding || isCoolingDown}
            onClick={() => {
              if (migration) {
                applyMigration();
              } else {
                setIsQuotaExhausted(false); 
                checkForEvolution();
              }
            }}
            className={cn(
              "px-16 py-6 text-[9px] uppercase tracking-[0.5em] font-black transition-all duration-1000 relative overflow-hidden group border",
              (migration && !isCoolingDown) || (!isBuilding && !migration) 
                ? "bg-white text-black border-white hover:bg-gold hover:text-white cursor-pointer shadow-[0_0_80px_rgba(196,166,97,0.2)]" 
                : "bg-white/5 text-white/5 border-white/5 cursor-not-allowed"
            )}
          >
            <div className="absolute inset-0 bg-gold opacity-0 group-hover:opacity-10 transition-opacity" />
            
            {isCoolingDown ? (
               <span className="relative z-10 flex items-center gap-4 opacity-30 italic">
                SYN_STABILIZING...
              </span>
            ) : isBuilding ? (
              <span className="relative z-10 flex items-center gap-4 animate-pulse">
                SCANNING_TOPOLOGY
              </span>
            ) : migration ? (
              <span className="relative z-10 flex items-center gap-2">
                INITIATE_CONVERGENCE <ArrowRight className="w-3 h-3" />
              </span>
            ) : (
              <span className="relative z-10 flex items-center gap-4">
                PROVOKE_EVOLUTION
              </span>
            )}
          </button>
          
          {migration && (
            <button 
              onClick={() => {
                if (migration.intentHash) {
                  setRejectedIntents(prev => {
                    const next = new Set(prev);
                    next.add(migration.intentHash!);
                    return next;
                  });
                  addLog(`Intent Guard: Blacklisted hash ${migration.intentHash.substring(0,6)}`);
                }
                setMigration(null);
                setIsCoolingDown(true);
                setTimeout(() => setIsCoolingDown(false), 3000);
              }}
              className="px-8 py-6 text-[9px] uppercase tracking-[0.5em] font-black border border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
            >
              REJECT_BATCH
            </button>
          )}

          <button 
            onClick={clearDashboard}
            className="w-12 h-12 flex items-center justify-center border border-white/10 bg-white/5 text-white/20 hover:text-red-400 hover:border-red-400/30 transition-all duration-500 rounded-sm group"
            title="Reset Axiom Core"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setChronosEngineActive(!chronosEngineActive)}
            className={cn(
              "w-12 h-12 flex items-center justify-center border transition-all duration-500 rounded-sm group",
              chronosEngineActive ? "bg-blue-500 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]" : "bg-white/5 border-white/10 text-white/20 hover:text-white"
            )}
            title="Chronos Engine: Temporal Branching"
          >
            <RefreshCcw className={cn("w-4 h-4", chronosEngineActive && "animate-spin")} />
          </button>

          <button 
            onClick={() => setAutonomous(!autonomous)}
            className={cn(
              "w-12 h-12 flex items-center justify-center border transition-all duration-500 rounded-sm group",
              autonomous ? "bg-gold border-gold text-black shadow-[0_0_20px_rgba(196,166,97,0.4)]" : "bg-white/5 border-white/10 text-white/20 hover:text-white"
            )}
            title={autonomous ? "Deactivate Autonomous Mode" : "Activate Autonomous Mode"}
          >
            <Activity className={cn("w-4 h-4", autonomous && "animate-pulse")} />
          </button>

          {/* Neural Pulse Indicator */}
          <AnimatePresence>
            {activeSignals.length > 0 && (
              <motion.div
                key={activeSignals.length}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '100px', opacity: 0.4 }}
                exit={{ width: 0, opacity: 0 }}
                className="h-12 flex items-center gap-2 px-4 border border-gold/20 bg-gold/5 rounded-sm overflow-hidden"
              >
                <Radio className="w-3 h-3 text-gold animate-pulse shrink-0" />
                <span className="text-[7px] font-mono text-gold whitespace-nowrap uppercase tracking-tighter">Event_Pulse: {activeSignals[activeSignals.length - 1]}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Heuristic Override Overlay */}
      <AnimatePresence>
        {safetyOverrideMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-8"
          >
            <div className="max-w-md w-full p-8 border border-red-500/30 bg-black rounded-sm space-y-6">
              <div className="flex items-center gap-4 text-red-400">
                <TriangleAlert className="w-8 h-8 animate-pulse" />
                <h3 className="text-lg font-black uppercase tracking-[0.2em]">Heuristic Override</h3>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed font-mono">
                The Architect has proposed a high-consequence mutation that would prune more than 50% of the active structural nodes. This could lead to a massive loss of instance DNA.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setSafetyOverrideMode(false);
                    applyMigration();
                  }}
                  className="flex-1 py-4 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors cursor-pointer"
                >
                  Confirm Mutation
                </button>
                <button 
                  onClick={() => {
                    setSafetyOverrideMode(false);
                    setMigration(null);
                    addLog("SAFETY_LAYER: Mutation sequence aborted by user.");
                  }}
                  className="flex-1 py-4 border border-white/20 text-white/60 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Abort Cycle
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chronos Engine: Temporal Branching View */}
      <AnimatePresence>
        {chronosEngineActive && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-96 bg-black/90 backdrop-blur-2xl border-l border-white/10 z-[80] p-8 flex flex-col"
          >
            <div className="flex items-center gap-4 mb-12">
              <div className="p-3 bg-blue-500/10 rounded-sm">
                <RefreshCcw className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-[14px] font-black uppercase tracking-[0.3em] text-white/90">Chronos Engine</h2>
                <p className="text-[8px] text-blue-400/40 uppercase tracking-widest font-mono">Temporal_Branching_V2</p>
              </div>
              <button 
                onClick={() => setChronosEngineActive(false)}
                className="ml-auto text-white/20 hover:text-white transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
              {snapshots.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-white/10 italic text-[10px]">
                  No temporal nodes found.
                </div>
              )}
              {snapshots.map((snap, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={snap.timestamp}
                  className="p-6 border border-white/5 bg-white/[0.01] rounded-sm space-y-4 hover:border-blue-500/30 transition-all group"
                >
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-blue-500 font-black">BRANCH_{(snapshots.length - i).toString().padStart(2, '0')}</span>
                    <span className="text-white/20">{new Date(snap.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-[9px] text-white/60 font-serif italic border-l-2 border-blue-500/20 pl-4 py-1 leading-relaxed">
                    "{snap.manifesto}"
                  </div>
                  <div className="flex items-center gap-4 text-[7px] text-white/20 uppercase tracking-widest">
                    <span>{snap.components.length} Nodes</span>
                    <span>{snap.kernelDrivers.length} Drivers</span>
                  </div>
                  <button 
                    onClick={() => rollback(i)}
                    className="w-full py-2 border border-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                  >
                    Resonate Branch
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-white/5">
              <p className="text-[8px] text-white/20 uppercase tracking-[0.2em] leading-relaxed">
                Reverting to a previous branch will overwrite the current sovereign state while maintaining core identity seed.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
