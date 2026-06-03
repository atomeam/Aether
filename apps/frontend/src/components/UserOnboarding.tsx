import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, X, Rocket, Server, DollarSign, BarChart3, MessageSquare, Zap, Play, ArrowRight, ExternalLink } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
  action?: string;
  actionLabel?: string;
}

interface QuickStartItem {
  id: string;
  text: string;
  completed: boolean;
}

export default function UserOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [skipped, setSkipped] = useState(false);
  const [quickStart, setQuickStart] = useState<QuickStartItem[]>([
    { id: 'signup', text: 'Signed up for account', completed: true },
    { id: 'dashboard', text: 'Viewed dashboard', completed: false },
    { id: 'infrastructure', text: 'Checked infrastructure tab', completed: false },
    { id: 'ai', text: 'Viewed AI recommendations', completed: false },
  ]);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to a-to-mind',
      description: 'The World\'s First Autonomous Business Engine. Let us show you around in 2 minutes.',
      icon: Rocket,
      completed: false
    },
    {
      id: 'quickstart',
      title: 'Quick Start Checklist',
      description: 'Get up and running in 5 minutes with these simple steps.',
      icon: Zap,
      completed: false,
      action: 'complete_quickstart',
      actionLabel: 'Mark as Complete'
    },
    {
      id: 'infrastructure',
      title: 'Autonomous Operations',
      description: 'Monitor your business metrics, revenue, and growth in real-time with AI-powered insights.',
      icon: Server,
      completed: false,
      action: 'view_infrastructure',
      actionLabel: 'Try Operations Tab'
    },
    {
      id: 'ai',
      title: 'Revenue Optimization',
      description: 'Get smart suggestions for pricing, growth, and market capture. AI analyzes your business data.',
      icon: Zap,
      completed: false,
      action: 'view_ai',
      actionLabel: 'View Revenue Insights'
    },
    {
      id: 'usage',
      title: 'Usage Tracking',
      description: 'Track your business decisions, revenue metrics, and growth indicators. Upgrade when you need more capacity.',
      icon: BarChart3,
      completed: false,
      action: 'view_usage',
      actionLabel: 'Check Usage'
    },
    {
      id: 'ready',
      title: 'You\'re All Set!',
      description: 'You now have access to all features. Start scaling your business and let AI handle the rest.',
      icon: CheckCircle,
      completed: false,
      action: 'start_monitoring',
      actionLabel: 'Start Monitoring'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setSkipped(true);
    setShowOnboarding(false);
  };

  const handleComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('aether_onboarding_complete', 'true');
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'complete_quickstart':
        setQuickStart(quickStart.map(item => ({ ...item, completed: true })));
        break;
      case 'view_infrastructure':
        // Emit event to switch to infrastructure tab
        window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'infrastructure' }));
        break;
      case 'view_ai':
        window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'infrastructure' }));
        break;
      case 'view_usage':
        window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'usage' }));
        break;
      case 'start_monitoring':
        handleComplete();
        break;
    }
  };

  const toggleQuickStartItem = (id: string) => {
    setQuickStart(quickStart.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  // Check if user has completed onboarding
  useEffect(() => {
    const completed = localStorage.getItem('aether_onboarding_complete');
    if (completed) {
      setShowOnboarding(false);
    }
  }, []);

  if (!showOnboarding) {
    return null;
  }

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/10 rounded-3xl p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Icon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{step.title}</h2>
              <p className="text-sm text-white/60">Step {currentStep + 1} of {steps.length}</p>
            </div>
          </div>
          <button
            onClick={handleComplete}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            title="Close onboarding"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex gap-2">
            {steps.map((s, i) => (
              <div
                key={s.id}
                className={`flex-1 h-1 rounded-full transition-all ${
                  i === currentStep ? 'bg-blue-400' :
                  i < currentStep ? 'bg-emerald-400' :
                  'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mb-8">
          <p className="text-lg text-white/90 mb-6">{step.description}</p>
          
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <Play className="w-4 h-4 text-purple-400" />
                  What you can do in 2 minutes:
                </h3>
                <ul className="space-y-2 text-sm text-white/60">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    Monitor infrastructure in real-time
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    Get AI-powered recommendations
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    Auto-remediate infrastructure issues
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    Track usage and manage payments
                  </li>
                </ul>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <h3 className="font-bold mb-4">Quick Start Checklist</h3>
                <div className="space-y-3">
                  {quickStart.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleQuickStartItem(item.id)}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'
                      }`}>
                        {item.completed && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm ${item.completed ? 'text-white/40 line-through' : 'text-white/80'}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <h3 className="font-bold mb-2">Key Features:</h3>
                <ul className="space-y-2 text-sm text-white/60">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    Real-time CPU, memory, and disk monitoring
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    Health status indicators for all resources
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    AI-powered optimization recommendations
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    Auto-remediation toggle for hands-off management
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-sm text-blue-300">
                  💡 Click "Try Infrastructure Tab" to see your monitoring dashboard
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <h3 className="font-bold mb-2">AI Capabilities:</h3>
                <ul className="space-y-2 text-sm text-white/60">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    Analyzes infrastructure patterns
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    Suggests performance optimizations
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    Identifies security vulnerabilities
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    Recommends cost-saving measures
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <p className="text-sm text-purple-300">
                  🤖 AI continuously learns from your infrastructure to provide better recommendations
                </p>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <h3 className="font-bold mb-2">Usage Plans:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                    <span>Starter</span>
                    <span className="text-white/40">100 API calls/day</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <span>Pro</span>
                    <span className="text-emerald-400">Unlimited</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <span>Enterprise</span>
                    <span className="text-purple-400">Unlimited + Priority</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="font-bold text-emerald-400 mb-2">You're Ready to Go!</h3>
                <p className="text-sm text-white/60 mb-4">
                  Start by exploring the Infrastructure tab to monitor your systems, or check out the Usage tab to track your API calls.
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => handleAction('view_infrastructure')}
                    className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm hover:bg-emerald-500/30 transition-colors flex items-center gap-2"
                  >
                    <Server className="w-4 h-4" />
                    Infrastructure
                  </button>
                  <button
                    onClick={() => handleAction('view_usage')}
                    className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 text-sm hover:bg-blue-500/30 transition-colors flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Usage
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-white/60 hover:text-white transition-colors text-sm"
            >
              Skip Tour
            </button>
            
            {step.action && (
              <button
                onClick={() => handleAction(step.action!)}
                className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center gap-2 text-sm"
              >
                {step.actionLabel}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}