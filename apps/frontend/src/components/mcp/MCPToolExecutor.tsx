/**
 * MCP Tool Executor Component
 * Handles parameter input and tool invocation
 */

import React, { useState } from 'react';
import { MCPTool, MCPToolResult } from './types';
import { mcpApi } from './api';
import { Play, Loader2, CheckCircle, XCircle, Copy, ChevronDown, ChevronUp } from 'lucide-react';

interface MCPToolExecutorProps {
  tool: MCPTool;
  onInvocation: (toolName: string, parameters: Record<string, any>, result: MCPToolResult) => void;
}

export default function MCPToolExecutor({ tool, onInvocation }: MCPToolExecutorProps) {
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MCPToolResult | null>(null);
  const [showResult, setShowResult] = useState(true);

  const handleParameterChange = (paramName: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value,
    }));
  };

  const handleExecute = async () => {
    setLoading(true);
    setResult(null);

    const invocationResult = await mcpApi.invokeTool(tool, parameters);
    setResult(invocationResult);
    onInvocation(tool.name, parameters, invocationResult);
    setLoading(false);
  };

  const handleCopyResult = () => {
    if (result) {
      const text = JSON.stringify(result.data || result.error, null, 2);
      navigator.clipboard.writeText(text);
    }
  };

  const renderParameterInput = (param: any) => {
    const value = parameters[param.name];

    switch (param.type) {
      case 'boolean':
        return (
          <select
            value={value ?? false}
            onChange={(e) => handleParameterChange(param.name, e.target.value === 'true')}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#c4a661]/50"
          >
            <option value="false">false</option>
            <option value="true">true</option>
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => handleParameterChange(param.name, parseFloat(e.target.value) || 0)}
            placeholder={param.description}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#c4a661]/50"
          />
        );

      case 'string':
        if (param.enum) {
          return (
            <select
              value={value ?? ''}
              onChange={(e) => handleParameterChange(param.name, e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#c4a661]/50"
            >
              <option value="">Select...</option>
              {param.enum.map((option: string) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          );
        }
        return (
          <input
            type="text"
            value={value ?? ''}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            placeholder={param.description}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#c4a661]/50"
          />
        );

      case 'object':
        return (
          <textarea
            value={value ? JSON.stringify(value, null, 2) : ''}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleParameterChange(param.name, parsed);
              } catch {
                handleParameterChange(param.name, e.target.value);
              }
            }}
            placeholder={`{ "key": "value" }`}
            rows={3}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#c4a661]/50"
          />
        );

      case 'array':
        return (
          <textarea
            value={value ? JSON.stringify(value, null, 2) : ''}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleParameterChange(param.name, parsed);
              } catch {
                handleParameterChange(param.name, e.target.value);
              }
            }}
            placeholder={`[ "item1", "item2" ]`}
            rows={3}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#c4a661]/50"
          />
        );

      default:
        return (
          <input
            type="text"
            value={value ?? ''}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            placeholder={param.description}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#c4a661]/50"
          />
        );
    }
  };

  const canExecute = tool.parameters.every(
    param => !param.required || parameters[param.name] !== undefined && parameters[param.name] !== ''
  );

  return (
    <div className="space-y-4">
      {/* Tool Info */}
      <div className="p-4 border border-white/5 bg-white/[0.01] rounded-lg">
        <h3 className="text-sm font-medium text-white mb-1">{tool.name}</h3>
        <p className="text-xs text-white/60 mb-2">{tool.description}</p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium uppercase text-[#c4a661]">{tool.category}</span>
          <span className="text-[10px] text-white/40">{tool.method}</span>
          <span className="text-[10px] text-white/40">{tool.endpoint}</span>
        </div>
      </div>

      {/* Parameters */}
      {tool.parameters.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-white/90">Parameters</h4>
          {tool.parameters.map(param => (
            <div key={param.name} className="space-y-1">
              <label className="flex items-center gap-2 text-xs text-white/60">
                <span className="font-medium">{param.name}</span>
                <span className="text-[10px] text-white/40">({param.type})</span>
                {param.required && <span className="text-red-400">*</span>}
              </label>
              {renderParameterInput(param)}
              <p className="text-[10px] text-white/40">{param.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Execute Button */}
      <button
        onClick={handleExecute}
        disabled={!canExecute || loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#c4a661] hover:bg-[#c4a661]/90 disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed rounded-lg text-black font-medium transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Executing...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Execute Tool
          </>
        )}
      </button>

      {/* Result */}
      {result && (
        <div className="border border-white/5 bg-white/[0.01] rounded-lg overflow-hidden">
          <button
            onClick={() => setShowResult(!showResult)}
            className="w-full flex items-center justify-between px-4 py-2 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <span className="text-xs font-medium text-white">
                {result.success ? 'Success' : 'Error'}
              </span>
              <span className="text-[10px] text-white/40">
                {new Date(result.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {showResult ? (
              <ChevronUp className="w-4 h-4 text-white/40" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/40" />
            )}
          </button>

          {showResult && (
            <div className="p-4">
              {result.error && (
                <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs text-red-400">{result.error}</p>
                </div>
              )}
              <div className="relative">
                <pre className="text-xs text-white/80 font-mono bg-black/30 p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
                <button
                  onClick={handleCopyResult}
                  className="absolute top-2 right-2 p-1 bg-white/10 hover:bg-white/20 rounded transition-colors"
                  title="Copy result"
                >
                  <Copy className="w-3 h-3 text-white/60" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
