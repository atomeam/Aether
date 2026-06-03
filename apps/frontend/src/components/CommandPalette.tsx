import React, { useState, useEffect, useRef } from 'react';
import { Command, Search, Zap, Server, Activity, Shield, Database, Globe, X, ArrowRight } from 'lucide-react';

interface CommandAction {
  id: string;
  label: string;
  description: string;
  icon: any;
  shortcut: string;
  action: () => void;
  category: 'agents' | 'infrastructure' | 'analytics' | 'settings';
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onRunHealthScan: () => void;
}

export default function CommandPalette({ isOpen, onClose, onRunHealthScan }: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandAction[] = [
    {
      id: 's1-scan',
      label: 'Run Health Scan (S1)',
      description: 'Execute S1 Health Monitor agent',
      icon: Zap,
      shortcut: '⌘H',
      action: onRunHealthScan,
      category: 'agents'
    },
    {
      id: 's3-inspector',
      label: 'Database Inspector (S3)',
      description: 'Analyze query performance',
      icon: Database,
      shortcut: '⌘D',
      action: () => {
        const event = new CustomEvent('open-database-inspector');
        window.dispatchEvent(event);
      },
      category: 'agents'
    },
    {
      id: 'infra-status',
      label: 'Check Infrastructure Status',
      description: 'View system health metrics',
      icon: Server,
      shortcut: '⌘I',
      action: () => console.log('Infrastructure status'),
      category: 'infrastructure'
    },
    {
      id: 'api-usage',
      label: 'View API Usage',
      description: 'Check current API call usage',
      icon: Activity,
      shortcut: '⌘U',
      action: () => console.log('API usage'),
      category: 'analytics'
    },
    {
      id: 'security-scan',
      label: 'Security Scan (S4)',
      description: 'Run S4 Security Scanner',
      icon: Shield,
      shortcut: '⌘S',
      action: () => console.log('Security scan'),
      category: 'agents'
    },
    {
      id: 'global-ping',
      label: 'Global Latency Check',
      description: 'Test latency across regions',
      icon: Globe,
      shortcut: '⌘G',
      action: () => console.log('Global ping'),
      category: 'infrastructure'
    }
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        filteredCommands[selectedIndex]?.action();
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  if (!isOpen) return null;

  const getCommandIcon = (cmd: CommandAction) => {
    const Icon = cmd.icon;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <Command className="w-5 h-5 text-purple-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/40 text-lg"
          />
          <button
            onClick={onClose}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              No commands found
            </div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  index === selectedIndex
                    ? 'bg-purple-500/20 border border-purple-500/30'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  index === selectedIndex ? 'bg-purple-500/30' : 'bg-white/10'
                }`}>
                  {getCommandIcon(cmd)}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-white">{cmd.label}</div>
                  <div className="text-sm text-white/40">{cmd.description}</div>
                </div>
                <div className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded">
                  {cmd.shortcut}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 border-t border-white/10 text-xs text-white/40">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ArrowRight className="w-3 h-3" /> Enter to select
            </span>
            <span>↑↓ to navigate</span>
            <span>Esc to close</span>
          </div>
          <div className="flex items-center gap-2">
            <Search className="w-3 h-3" />
            <span>{filteredCommands.length} commands</span>
          </div>
        </div>
      </div>
    </div>
  );
}