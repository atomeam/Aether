/**
 * AI-Based Approval Gates
 * Intelligent autonomous approval using AI decision making
 */

const { AIIntelligenceEngine } = require('./ai-intelligence');
const { SelfValidationSystem } = require('./self-validation');
const { RateLimitingSystem } = require('./rate-limiter');

class AIApprovalGates {
  constructor() {
    this.ai = new AIIntelligenceEngine();
    this.validator = new SelfValidationSystem();
    this.rateLimiter = new RateLimitingSystem();
    
    this.approvals = [];
    this.dataPath = path.resolve(__dirname, 'ai-approvals.json');
    this.loadApprovals();
  }

  // Request approval for deployment
  async requestDeploymentApproval(projectPath, projectSpec) {
    console.log(`🤖 AI evaluating deployment approval for: ${projectSpec.name}`);
    
    const approvalId = this.generateApprovalId(projectSpec.name);
    
    // Check rate limits
    const rateLimitCheck = await this.rateLimiter.checkLimit('deployments');
    if (!rateLimitCheck.allowed) {
      return {
        id: approvalId,
        approved: false,
        reason: `Rate limit exceeded: ${rateLimitCheck.reason}`,
        type: 'rate-limit'
      };
    }
    
    // AI analysis
    const aiAnalysis = await this.ai.analyzeOpportunity(projectSpec);
    
    // Code validation
    const codeValidation = await this.validator.validateCode(projectPath, projectSpec);
    
    // Make intelligent decision
    const decision = await this.makeIntelligentDecision({
      approvalId,
      projectSpec,
      aiAnalysis,
      codeValidation,
      timestamp: new Date().toISOString()
    });
    
    // Record approval
    this.approvals.push(decision);
    this.saveApprovals();
    
    // If approved, record the action
    if (decision.approved) {
      await this.rateLimiter.recordAction('deployments');
    }
    
    return decision;
  }

  // Make intelligent approval decision
  async makeIntelligentDecision(context) {
    const { projectSpec, aiAnalysis, codeValidation } = context;
    
    // Calculate approval score
    const score = this.calculateApprovalScore(aiAnalysis, codeValidation);
    
    // Determine approval
    const approved = score >= 70; // 70% threshold for approval
    
    const decision = {
      id: context.approvalId,
      project: projectSpec.name,
      approved,
      score: score.toFixed(2),
      timestamp: context.timestamp,
      
      // Analysis components
      aiAnalysis: {
        marketFit: aiAnalysis.marketFit.score,
        technicalFeasibility: aiAnalysis.technicalFeasibility.score,
        revenuePotential: aiAnalysis.revenuePotential.predicted.month12,
        riskAssessment: aiAnalysis.riskAssessment.overall,
        competitiveAdvantage: aiAnalysis.competitiveAdvantage.score,
        successProbability: aiAnalysis.successProbability
      },
      
      codeValidation: {
        linting: codeValidation.linting.passed,
        typeChecking: codeValidation.typeChecking.passed,
        security: codeValidation.security.passed,
        secrets: codeValidation.secrets.passed,
        dependencies: codeValidation.dependencies.passed,
        bestPractices: codeValidation.bestPractices.passed,
        performance: codeValidation.performance.passed,
        accessibility: codeValidation.accessibility.passed
      },
      
      // Decision rationale
      rationale: this.generateRationale(aiAnalysis, codeValidation, score),
      
      // Conditions if approved
      conditions: approved ? this.generateConditions(aiAnalysis, codeValidation) : [],
      
      // Recommendations if rejected
      recommendations: approved ? [] : this.generateRejectionRecommendations(aiAnalysis, codeValidation),
      
      // Confidence
      confidence: this.calculateDecisionConfidence(aiAnalysis, codeValidation)
    };
    
    return decision;
  }

  // Calculate approval score
  calculateApprovalScore(aiAnalysis, codeValidation) {
    const weights = {
      marketFit: 0.2,
      technicalFeasibility: 0.15,
      revenuePotential: 0.15,
      riskAssessment: 0.1,
      competitiveAdvantage: 0.1,
      codeQuality: 0.15,
      security: 0.1,
      performance: 0.05
    };
    
    const scores = {
      marketFit: parseFloat(aiAnalysis.marketFit.score),
      technicalFeasibility: parseFloat(aiAnalysis.technicalFeasibility.score),
      revenuePotential: Math.min(100, aiAnalysis.revenuePotential.predicted.month12 / 100),
      riskAssessment: (1 - parseFloat(aiAnalysis.riskAssessment.overall)) * 100,
      competitiveAdvantage: parseFloat(aiAnalysis.competitiveAdvantage.score),
      codeQuality: this.calculateCodeQualityScore(codeValidation),
      security: codeValidation.security.passed ? 100 : 0,
      performance: codeValidation.performance.passed ? 100 : 0
    };
    
    const weightedScore = (
      scores.marketFit * weights.marketFit +
      scores.technicalFeasibility * weights.technicalFeasibility +
      scores.revenuePotential * weights.revenuePotential +
      scores.riskAssessment * weights.riskAssessment +
      scores.competitiveAdvantage * weights.competitiveAdvantage +
      scores.codeQuality * weights.codeQuality +
      scores.security * weights.security +
      scores.performance * weights.performance
    );
    
    return weightedScore;
  }

  // Calculate code quality score
  calculateCodeQualityScore(codeValidation) {
    const checks = [
      codeValidation.linting.passed,
      codeValidation.typeChecking.passed,
      codeValidation.security.passed,
      codeValidation.secrets.passed,
      codeValidation.dependencies.passed,
      codeValidation.bestPractices.passed,
      codeValidation.performance.passed,
      codeValidation.accessibility.passed
    ];
    
    return (checks.filter(c => c).length / checks.length) * 100;
  }

  // Generate rationale for decision
  generateRationale(aiAnalysis, codeValidation, score) {
    const rationale = [];
    
    if (score >= 70) {
      rationale.push('Overall score meets approval threshold');
      
      if (parseFloat(aiAnalysis.marketFit.score) > 70) {
        rationale.push('Strong market fit identified');
      }
      
      if (parseFloat(aiAnalysis.technicalFeasibility.score) > 70) {
        rationale.push('Technical feasibility confirmed');
      }
      
      if (codeValidation.security.passed) {
        rationale.push('Security checks passed');
      }
      
      if (codeValidation.dependencies.passed) {
        rationale.push('No critical dependency vulnerabilities');
      }
    } else {
      rationale.push('Overall score below approval threshold');
      
      if (parseFloat(aiAnalysis.marketFit.score) < 50) {
        rationale.push('Market fit concerns identified');
      }
      
      if (parseFloat(aiAnalysis.riskAssessment.overall) > 0.6) {
        rationale.push('Elevated risk level detected');
      }
      
      if (!codeValidation.security.passed) {
        rationale.push('Security issues require attention');
      }
      
      if (!codeValidation.dependencies.passed) {
        rationale.push('Dependency vulnerabilities found');
      }
    }
    
    return rationale;
  }

  // Generate conditions for approval
  generateConditions(aiAnalysis, codeValidation) {
    const conditions = [];
    
    if (parseFloat(aiAnalysis.riskAssessment.overall) > 0.4) {
      conditions.push({
        type: 'monitoring',
        description: 'Enhanced monitoring required due to risk level',
        duration: '30 days'
      });
    }
    
    if (!codeValidation.performance.passed) {
      conditions.push({
        type: 'optimization',
        description: 'Performance optimization required within 7 days',
        deadline: '7 days'
      });
    }
    
    if (parseFloat(aiAnalysis.competitiveAdvantage.score) < 60) {
      conditions.push({
        type: 'differentiation',
        description: 'Competitive differentiation strategy required',
        deadline: '14 days'
      });
    }
    
    return conditions;
  }

  // Generate rejection recommendations
  generateRejectionRecommendations(aiAnalysis, codeValidation) {
    const recommendations = [];
    
    if (parseFloat(aiAnalysis.marketFit.score) < 50) {
      recommendations.push({
        priority: 'high',
        action: 'Reconsider market fit or pivot strategy',
        reason: 'Market fit score is below threshold'
      });
    }
    
    if (parseFloat(aiAnalysis.technicalFeasibility.score) < 50) {
      recommendations.push({
        priority: 'high',
        action: 'Simplify technical approach or reduce scope',
        reason: 'Technical feasibility is low'
      });
    }
    
    if (!codeValidation.security.passed) {
      recommendations.push({
        priority: 'critical',
        action: 'Address all security issues before re-submission',
        reason: 'Security checks failed'
      });
    }
    
    if (!codeValidation.dependencies.passed) {
      recommendations.push({
        priority: 'high',
        action: 'Update or replace vulnerable dependencies',
        reason: 'Dependency vulnerabilities detected'
      });
    }
    
    if (parseFloat(aiAnalysis.riskAssessment.overall) > 0.6) {
      recommendations.push({
        priority: 'medium',
        action: 'Implement risk mitigation strategies',
        reason: 'Overall risk level is elevated'
      });
    }
    
    return recommendations;
  }

  // Calculate decision confidence
  calculateDecisionConfidence(aiAnalysis, codeValidation) {
    const factors = {
      dataQuality: 0.9,
      modelAccuracy: parseFloat(aiAnalysis.confidence) / 100,
      validationCompleteness: this.calculateValidationCompleteness(codeValidation),
      historicalAccuracy: 0.85
    };
    
    return ((factors.dataQuality + factors.modelAccuracy + factors.validationCompleteness + factors.historicalAccuracy) / 4 * 100).toFixed(2);
  }

  // Calculate validation completeness
  calculateValidationCompleteness(codeValidation) {
    const checks = Object.keys(codeValidation).length;
    const passed = Object.values(codeValidation).filter(v => v.passed).length;
    return passed / checks;
  }

  // Request approval for financial action
  async requestFinancialApproval(action, amount, reason) {
    console.log(`🤖 AI evaluating financial approval: ${action} ($${amount})`);
    
    // Check rate limits
    const rateLimitCheck = await this.rateLimiter.checkLimit('financialActions');
    if (!rateLimitCheck.allowed) {
      return {
        approved: false,
        reason: `Rate limit exceeded: ${rateLimitCheck.reason}`,
        type: 'rate-limit'
      };
    }
    
    // AI evaluation
    const evaluation = await this.evaluateFinancialAction(action, amount, reason);
    
    // Record approval
    this.approvals.push(evaluation);
    this.saveApprovals();
    
    // If approved, record the action
    if (evaluation.approved) {
      await this.rateLimiter.recordAction('financialActions');
    }
    
    return evaluation;
  }

  // Evaluate financial action
  async evaluateFinancialAction(action, amount, reason) {
    const riskFactors = {
      amount: this.assessAmountRisk(amount),
      action: this.assessActionRisk(action),
      reason: this.assessReasonRisk(reason),
      history: this.assessHistoryRisk(action)
    };
    
    const overallRisk = (
      riskFactors.amount * 0.4 +
      riskFactors.action * 0.3 +
      riskFactors.reason * 0.2 +
      riskFactors.history * 0.1
    );
    
    const approved = overallRisk < 0.7; // 70% risk threshold
    
    return {
      id: this.generateApprovalId(action),
      action,
      amount,
      reason,
      approved,
      riskScore: overallRisk.toFixed(2),
      riskFactors,
      rationale: approved ? 'Risk within acceptable limits' : 'Risk exceeds threshold',
      confidence: '85.00',
      timestamp: new Date().toISOString()
    };
  }

  // Assess amount risk
  assessAmountRisk(amount) {
    if (amount < 100) return 0.1;
    if (amount < 1000) return 0.3;
    if (amount < 10000) return 0.5;
    return 0.8;
  }

  // Assess action risk
  assessActionRisk(action) {
    const riskMap = {
      'create_product': 0.3,
      'update_pricing': 0.5,
      'refund': 0.7,
      'payout': 0.8
    };
    return riskMap[action] || 0.5;
  }

  // Assess reason risk
  assessReasonRisk(reason) {
    const riskKeywords = ['urgent', 'emergency', 'immediate'];
    const hasRiskKeyword = riskKeywords.some(keyword => reason.toLowerCase().includes(keyword));
    return hasRiskKeyword ? 0.6 : 0.2;
  }

  // Assess history risk
  assessHistoryRisk(action) {
    const history = this.approvals.filter(a => a.action === action);
    if (history.length === 0) return 0.3;
    
    const recentRejections = history.filter(a => !a.approved && this.isRecent(a.timestamp)).length;
    return recentRejections / history.length;
  }

  // Check if timestamp is recent (within 24 hours)
  isRecent(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = now - then;
    return diff < 24 * 60 * 60 * 1000;
  }

  // Generate approval ID
  generateApprovalId(name) {
    return `approval-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  }

  // Load approvals
  loadApprovals() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      this.approvals = JSON.parse(data);
    }
  }

  // Save approvals
  saveApprovals() {
    if (this.approvals.length > 100) {
      this.approvals = this.approvals.slice(-100);
    }
    fs.writeFileSync(this.dataPath, JSON.stringify(this.approvals, null, 2));
  }

  // Get approvals
  getApprovals() {
    return this.approvals;
  }

  // Get approval statistics
  getApprovalStats() {
    const total = this.approvals.length;
    const approved = this.approvals.filter(a => a.approved).length;
    const rejected = total - approved;
    
    return {
      total,
      approved,
      rejected,
      approvalRate: total > 0 ? (approved / total * 100).toFixed(2) : 0,
      averageScore: this.approvals.reduce((sum, a) => sum + (a.score || 0), 0) / total
    };
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const approvalGates = new AIApprovalGates();

  switch (command) {
    case 'approve-deployment':
      if (args[1] && args[2]) {
        const projectPath = args[1];
        const projectSpec = JSON.parse(args[2]);
        const decision = await approvalGates.requestDeploymentApproval(projectPath, projectSpec);
        console.log('🤖 AI Approval Decision:');
        console.log(JSON.stringify(decision, null, 2));
      } else {
        console.error('Usage: node ai-approval.js approve-deployment <project-path> <project-spec-json>');
      }
      break;

    case 'approve-financial':
      if (args[1] && args[2] && args[3]) {
        const action = args[1];
        const amount = parseFloat(args[2]);
        const reason = args[3];
        const decision = await approvalGates.requestFinancialApproval(action, amount, reason);
        console.log('🤖 Financial Approval Decision:');
        console.log(JSON.stringify(decision, null, 2));
      } else {
        console.error('Usage: node ai-approval.js approve-financial <action> <amount> <reason>');
      }
      break;

    case 'stats':
      const stats = approvalGates.getApprovalStats();
      console.log('📊 Approval Statistics:');
      console.log(JSON.stringify(stats, null, 2));
      break;

    case 'list':
      const approvals = approvalGates.getApprovals();
      console.log('📋 Approvals:');
      console.log(JSON.stringify(approvals, null, 2));
      break;

    default:
      console.log('🤖 AI-Based Approval Gates');
      console.log('');
      console.log('Commands:');
      console.log('  approve-deployment - Request AI approval for deployment');
      console.log('  approve-financial  - Request AI approval for financial action');
      console.log('  stats              - Get approval statistics');
      console.log('  list               - List all approvals');
      console.log('');
      console.log('Examples:');
      console.log('  node ai-approval.js approve-deployment ./project \'{"name":"Test"}\'');
      console.log('  node ai-approval.js approve-financial create_product 29 "New product"');
      console.log('  node ai-approval.js stats');
      console.log('  node ai-approval.js list');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  AIApprovalGates
};
