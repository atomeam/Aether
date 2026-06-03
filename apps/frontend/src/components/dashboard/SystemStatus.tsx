import React from 'react';
import { CheckCircle, AlertCircle, XCircle, ExternalLink, Cpu, Database, Mail, CreditCard, Building2, Users, Sparkles, GitBranch } from 'lucide-react';

interface Integration {
  name: string;
  status: 'connected' | 'partial' | 'missing' | 'limited';
  description: string;
  icon: any;
  configPath: string;
}

export default function SystemStatus() {
  // In a real implementation, these would be fetched from the API
  // For now, we're showing the current state based on wrangler.toml
  const integrations: Integration[] = [
    {
      name: 'Cloudflare Workers',
      status: 'connected',
      description: 'API worker deployed and running',
      icon: Cpu,
      configPath: 'wrangler.toml'
    },
    {
      name: 'D1 Database',
      status: 'connected',
      description: 'Database operational, 3 users tracked',
      icon: Database,
      configPath: 'wrangler.toml'
    },
    {
      name: 'Cloudflare AI',
      status: 'connected',
      description: 'AI binding active for analysis',
      icon: Sparkles,
      configPath: 'wrangler.toml'
    },
    {
      name: 'Email Routing',
      status: 'connected',
      description: 'Owner email verified and ready',
      icon: Mail,
      configPath: 'wrangler.toml'
    },
    {
      name: 'HubSpot',
      status: 'limited',
      description: 'API key configured (lacks required scopes - check permissions)',
      icon: Building2,
      configPath: 'wrangler.toml: HUBSPOT_API_KEY'
    },
    {
      name: 'Apollo',
      status: 'limited',
      description: 'API key configured (free plan - upgrade for full access)',
      icon: Users,
      configPath: 'wrangler.toml: APOLLO_API_KEY'
    },
    {
      name: 'Plaid',
      status: 'connected',
      description: 'Sandbox credentials configured',
      icon: CreditCard,
      configPath: 'wrangler.toml: PLAID_CLIENT_ID, PLAID_SECRET'
    },
    {
      name: 'GitHub',
      status: 'missing',
      description: 'Token required for pipeline visibility',
      icon: GitBranch,
      configPath: 'wrangler.toml: GITHUB_TOKEN'
    },
    {
      name: 'Notion',
      status: 'connected',
      description: 'Profit metrics database configured',
      icon: Database,
      configPath: 'wrangler.toml: NOTION_API_KEY, NOTION_DATABASE_ID'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'partial': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'limited': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'missing': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4" />;
      case 'partial': return <AlertCircle className="w-4 h-4" />;
      case 'limited': return <AlertCircle className="w-4 h-4" />;
      case 'missing': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const limitedCount = integrations.filter(i => i.status === 'limited').length;
  const totalCount = integrations.length;

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">System Status</h3>
          <p className="text-slate-400 text-sm">
            {connectedCount}/{totalCount} fully connected ({limitedCount} limited)
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(connectedCount === totalCount ? 'connected' : 'partial')}`}>
          {connectedCount === totalCount ? 'All Systems Go' : limitedCount > 0 ? 'Partial Access' : 'Configuration Needed'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <div
              key={integration.name}
              className={`p-4 rounded-xl border transition-all hover:bg-slate-800/50 ${getStatusColor(integration.status)}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getStatusIcon(integration.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4" />
                    <span className="font-semibold text-white">{integration.name}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{integration.description}</p>
                  <code className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-500">
                    {integration.configPath}
                  </code>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
        <div className="flex items-start gap-3">
          <ExternalLink className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm text-slate-300 mb-1">
              <strong className="text-white">Configuration Guide:</strong> Update API keys in{' '}
              <code className="bg-slate-700 px-2 py-0.5 rounded text-blue-400">apps/api-worker/wrangler.toml</code>
            </p>
            <p className="text-xs text-slate-500">
              After updating keys, run <code className="bg-slate-700 px-2 py-0.5 rounded">npx wrangler deploy</code> to apply changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
