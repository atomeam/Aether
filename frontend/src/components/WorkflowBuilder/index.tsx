/**
 * Workflow Builder Component
 * 
 * Visual drag-and-drop interface for creating AI automation workflows.
 */

import { useState } from 'react';
import './WorkflowBuilder.css';

interface WorkflowStep {
  id: string;
  type: 'ai' | 'api' | 'local' | 'conditional';
  service: string;
  action: string;
  params?: Record<string, unknown>;
  enabled: boolean;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: WorkflowStep[];
}

interface WorkflowBuilderProps {
  onWorkflowCreate?: (workflow: WorkflowStep[]) => void;
}

export function WorkflowBuilder({ onWorkflowCreate }: WorkflowBuilderProps) {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const workflowTemplates: WorkflowTemplate[] = [
    {
      id: 'chat-with-analysis',
      name: 'Chat with Analysis',
      description: 'Process user input through multiple AI models for comprehensive analysis',
      category: 'ai',
      steps: [
        {
          id: 'step_1',
          type: 'ai',
          service: 'openai',
          action: 'chat',
          params: { model: 'gpt-4', temperature: 0.7 },
          enabled: true,
        },
        {
          id: 'step_2',
          type: 'ai',
          service: 'anthropic',
          action: 'analyze',
          params: { model: 'claude-3-sonnet' },
          enabled: true,
        },
        {
          id: 'step_3',
          type: 'local',
          service: 'filesystem-mcp',
          action: 'write_file',
          params: { path: './output/analysis.txt' },
          enabled: true,
        },
      ],
    },
    {
      id: 'content-generation',
      name: 'Multi-Model Content Generation',
      description: 'Generate content using multiple AI services and save results',
      category: 'content',
      steps: [
        {
          id: 'step_1',
          type: 'ai',
          service: 'openai',
          action: 'generate',
          params: { model: 'gpt-4-turbo' },
          enabled: true,
        },
        {
          id: 'step_2',
          type: 'ai',
          service: 'cohere',
          action: 'embed',
          params: { model: 'embed-english-v3.0' },
          enabled: true,
        },
        {
          id: 'step_3',
          type: 'local',
          service: 'filesystem-mcp',
          action: 'write_file',
          params: { path: './output/content.json' },
          enabled: true,
        },
      ],
    },
    {
      id: 'customer-support',
      name: 'Customer Support Automation',
      description: 'AI-powered customer support with Slack integration',
      category: 'business',
      steps: [
        {
          id: 'step_1',
          type: 'ai',
          service: 'openai',
          action: 'classify',
          params: { model: 'gpt-3.5-turbo' },
          enabled: true,
        },
        {
          id: 'step_2',
          type: 'conditional',
          service: 'orchestrator',
          action: 'route',
          params: { condition: 'priority' },
          enabled: true,
        },
        {
          id: 'step_3',
          type: 'api',
          service: 'slack',
          action: 'notify',
          params: { channel: '#support' },
          enabled: true,
        },
      ],
    },
  ];

  const addStep = (type: WorkflowStep['type']) => {
    const newStep: WorkflowStep = {
      id: `step_${steps.length + 1}`,
      type,
      service: type === 'ai' ? 'openai' : type === 'api' ? 'slack' : 'filesystem-mcp',
      action: type === 'ai' ? 'chat' : type === 'api' ? 'call' : 'execute',
      enabled: true,
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(step => step.id !== id));
  };

  const updateStep = (id: string, updates: Partial<WorkflowStep>) => {
    setSteps(steps.map(step => 
      step.id === id ? { ...step, ...updates } : step
    ));
  };

  const applyTemplate = (template: WorkflowTemplate) => {
    setSteps(template.steps);
    setSelectedTemplate(template.id);
    setShowTemplates(false);
  };

  const createWorkflow = () => {
    if (onWorkflowCreate) {
      onWorkflowCreate(steps);
    }
  };

  const getStepIcon = (type: WorkflowStep['type']) => {
    switch (type) {
      case 'ai': return '🤖';
      case 'api': return '🔌';
      case 'local': return '💻';
      case 'conditional': return '🔀';
      default: return '📋';
    }
  };

  return (
    <div className="workflow-builder">
      <div className="builder-header">
        <h2>🔧 Workflow Builder</h2>
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            📋 Templates
          </button>
          <button 
            className="btn-primary"
            onClick={createWorkflow}
            disabled={steps.length === 0}
          >
            ▶ Create Workflow
          </button>
        </div>
      </div>

      {showTemplates && (
        <div className="templates-panel">
          <h3>Workflow Templates</h3>
          <div className="templates-grid">
            {workflowTemplates.map(template => (
              <div 
                key={template.id}
                className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                onClick={() => applyTemplate(template)}
              >
                <h4>{template.name}</h4>
                <p>{template.description}</p>
                <span className="template-category">{template.category}</span>
                <span className="step-count">{template.steps.length} steps</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="builder-content">
        <div className="step-palette">
          <h3>Add Step</h3>
          <div className="palette-buttons">
            <button className="palette-btn ai" onClick={() => addStep('ai')}>
              🤖 AI Step
            </button>
            <button className="palette-btn api" onClick={() => addStep('api')}>
              🔌 API Step
            </button>
            <button className="palette-btn local" onClick={() => addStep('local')}>
              💻 Local Step
            </button>
            <button className="palette-btn conditional" onClick={() => addStep('conditional')}>
              🔀 Conditional
            </button>
          </div>
        </div>

        <div className="workflow-canvas">
          <h3>Workflow Steps</h3>
          {steps.length === 0 ? (
            <div className="empty-canvas">
              <p>Drag steps from the palette or select a template to get started</p>
            </div>
          ) : (
            <div className="steps-list">
              {steps.map((step, index) => (
                <div key={step.id} className="workflow-step">
                  <div className="step-number">{index + 1}</div>
                  <div className="step-content">
                    <div className="step-header">
                      <span className="step-icon">{getStepIcon(step.type)}</span>
                      <select
                        value={step.service}
                        onChange={(e) => updateStep(step.id, { service: e.target.value })}
                        className="step-service"
                      >
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="google-ai">Google AI</option>
                        <option value="cohere">Cohere</option>
                        <option value="huggingface">HuggingFace</option>
                        <option value="replicate">Replicate</option>
                        <option value="slack">Slack</option>
                        <option value="stripe">Stripe</option>
                        <option value="filesystem-mcp">Filesystem MCP</option>
                      </select>
                      <input
                        type="text"
                        value={step.action}
                        onChange={(e) => updateStep(step.id, { action: e.target.value })}
                        placeholder="Action"
                        className="step-action"
                      />
                      <label className="step-toggle">
                        <input
                          type="checkbox"
                          checked={step.enabled}
                          onChange={(e) => updateStep(step.id, { enabled: e.target.checked })}
                        />
                        <span>Enabled</span>
                      </label>
                      <button 
                        className="remove-step"
                        onClick={() => removeStep(step.id)}
                      >
                        ✕
                      </button>
                    </div>
                    {step.params && (
                      <div className="step-params">
                        <textarea
                          value={JSON.stringify(step.params, null, 2)}
                          onChange={(e) => {
                            try {
                              updateStep(step.id, { params: JSON.parse(e.target.value) });
                            } catch (err) {
                              // Invalid JSON, ignore
                            }
                          }}
                          placeholder="Parameters (JSON)"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                  {index < steps.length - 1 && <div className="step-connector">↓</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkflowBuilder;