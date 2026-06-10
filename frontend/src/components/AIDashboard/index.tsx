/**
 * AI Dashboard Component
 * 
 * Displays all connected AI services with status, capabilities, and quick actions.
 */

import { useState, useEffect } from 'react';
import './AIDashboard.css';

interface AIIntegration {
  name: string;
  type: 'api' | 'mcp';
  enabled: boolean;
  status: string;
  description: string;
  category: string;
  capabilities?: string[];
  models?: string[];
  baseUrl?: string;
}

interface AIDashboardProps {
  runtimeUrl?: string;
}

export function AIDashboard({ runtimeUrl = '' }: AIDashboardProps) {
  const [integrations, setIntegrations] = useState<AIIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'ai' | 'business' | 'communication' | 'system'>('all');

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/api/integrations');
      const data = await res.json();
      setIntegrations(data.integrations || []);
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleIntegration = async (name: string, enabled: boolean) => {
    try {
      await fetch(`/api/integrations/${name}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      fetchIntegrations();
    } catch (error) {
      console.error('Failed to toggle integration:', error);
    }
  };

  const filteredIntegrations = integrations.filter(integration => 
    filter === 'all' || integration.category === filter
  );

  const categories = [
    { key: 'all', label: 'All Services' },
    { key: 'ai', label: 'AI Services' },
    { key: 'business', label: 'Business' },
    { key: 'communication', label: 'Communication' },
    { key: 'system', label: 'System' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'disabled': return 'text-gray-500';
      default: return 'text-yellow-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ai': return '🤖';
      case 'business': return '💼';
      case 'communication': return '💬';
      case 'system': return '⚙️';
      default: return '🔌';
    }
  };

  if (loading) {
    return (
      <div className="ai-dashboard">
        <div className="loading">Loading AI integrations...</div>
      </div>
    );
  }

  return (
    <div className="ai-dashboard">
      <div className="dashboard-header">
        <h2>🔗 AI Integration Hub</h2>
        <div className="stats">
          <span className="stat">
            <strong>{integrations.length}</strong> Total
          </span>
          <span className="stat">
            <strong>{integrations.filter(i => i.enabled).length}</strong> Active
          </span>
          <span className="stat">
            <strong>{integrations.filter(i => i.category === 'ai').length}</strong> AI Services
          </span>
        </div>
      </div>

      <div className="filter-bar">
        {categories.map(cat => (
          <button
            key={cat.key}
            className={`filter-btn ${filter === cat.key ? 'active' : ''}`}
            onClick={() => setFilter(cat.key as any)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="integrations-grid">
        {filteredIntegrations.map(integration => (
          <div key={integration.name} className={`integration-card ${!integration.enabled ? 'disabled' : ''}`}>
            <div className="card-header">
              <div className="integration-info">
                <span className="category-icon">{getCategoryIcon(integration.category)}</span>
                <div>
                  <h3>{integration.name}</h3>
                  <span className={`status ${getStatusColor(integration.status)}`}>
                    {integration.status}
                  </span>
                </div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={integration.enabled}
                  onChange={(e) => toggleIntegration(integration.name, e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <p className="description">{integration.description}</p>

            {integration.capabilities && integration.capabilities.length > 0 && (
              <div className="capabilities">
                <strong>Capabilities:</strong>
                <div className="tags">
                  {integration.capabilities.map(cap => (
                    <span key={cap} className="tag">{cap}</span>
                  ))}
                </div>
              </div>
            )}

            {integration.models && integration.models.length > 0 && (
              <div className="models">
                <strong>Models:</strong>
                <div className="tags">
                  {integration.models.slice(0, 3).map(model => (
                    <span key={model} className="tag model">{model}</span>
                  ))}
                  {integration.models.length > 3 && (
                    <span className="tag more">+{integration.models.length - 3} more</span>
                  )}
                </div>
              </div>
            )}

            <div className="card-footer">
              <span className="type-badge">{integration.type.toUpperCase()}</span>
              {integration.baseUrl && (
                <span className="url">{new URL(integration.baseUrl).hostname}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredIntegrations.length === 0 && (
        <div className="empty-state">
          <p>No integrations found for this category.</p>
        </div>
      )}
    </div>
  );
}

export default AIDashboard;