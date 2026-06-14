/**
 * Risks & Gaps Register
 * Tracks risks, gaps, and mitigation strategies for trial arbitrage system
 * Prioritized by business impact (money > security > reliability > polish)
 */

interface RiskItem {
  id: string;
  title: string;
  tier: 'T1_MONEY_CRITICAL' | 'T2_SECURITY_RISK' | 'T3_RELIABILITY' | 'T4_CONNECTIVE_TISSUE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'MITIGATED' | 'ACCEPTED' | 'DEFERRED';
  description: string;
  impact: string;
  mitigation: string;
  owner: string;
  dueDate?: string;
  dependencies: string[];
  acceptanceCriteria: string[];
}

class RisksGapsRegister {
  private risks: Map<string, RiskItem>;
  private registerFile: string;

  constructor() {
    this.risks = new Map();
    this.registerFile = 'risks-gaps-register.json';
    this.loadRegister();
    this.initializeRisks();
  }

  /**
   * Load register from file
   */
  private loadRegister(): void {
    try {
      if (require('fs').existsSync(this.registerFile)) {
        const data = require('fs').readFileSync(this.registerFile, 'utf-8');
        const risks = JSON.parse(data);
        Object.entries(risks).forEach(([id, risk]) => {
          this.risks.set(id, risk);
        });
      }
    } catch (error) {
      this.risks = new Map();
    }
  }

  /**
   * Save register to file
   */
  private saveRegister(): void {
    try {
      const risks = Object.fromEntries(this.risks);
      require('fs').writeFileSync(this.registerFile, JSON.stringify(risks, null, 2));
    } catch (error) {
      console.error('Failed to save register:', error);
    }
  }

  /**
   * Initialize risks from gap analysis
   */
  private initializeRisks(): void {
    const risks: RiskItem[] = [
      // Tier 1 - Money Critical
      {
        id: 'RISK-001',
        title: 'Timezone correctness in danger date calculations',
        tier: 'T1_MONEY_CRITICAL',
        severity: 'CRITICAL',
        status: 'OPEN',
        description: 'Billing happens in vendor timezone, but dangerDate/due sweep runs in fixed zone. Off-by-one means sweep fires after charge.',
        impact: 'Direct financial loss - most expensive bug in system',
        mitigation: 'Store vendor timezone with each trial, calculate danger dates in vendor timezone, run sweep with timezone-aware scheduling',
        owner: 'Devin',
        dependencies: [],
        acceptanceCriteria: [
          'Each trial record includes vendor timezone field',
          'Danger date calculated in vendor timezone',
          'Scheduled sweep runs in vendor timezone',
          'Timezone-aware comparison for due date checks',
          'Test with cross-timezone trials (UTC, PST, EST, etc.)'
        ]
      },
      {
        id: 'RISK-002',
        title: 'Sweep cadence vs billing time alignment',
        tier: 'T1_MONEY_CRITICAL',
        severity: 'CRITICAL',
        status: 'OPEN',
        description: 'Once-daily sweep may be too coarse. Service bills at 00:30 their time, sweep runs at 09:00. 2-day buffer is only safety.',
        impact: 'Missed cancellation window if sweep cadence doesn\'t align with billing patterns',
        mitigation: 'Implement per-service sweep cadence based on billing time, tighten cadence for high-risk services, widen buffer for coarse cadence',
        owner: 'Devin',
        dependencies: ['RISK-001'],
        acceptanceCriteria: [
          'Each service has billing time metadata',
          'Sweep cadence calculated per service based on billing time',
          'High-risk services have hourly sweeps near billing time',
          'Buffer period configurable per service',
          'Test with services billing at different times'
        ]
      },
      {
        id: 'RISK-003',
        title: 'Cancellation verification missing',
        tier: 'T1_MONEY_CRITICAL',
        severity: 'CRITICAL',
        status: 'OPEN',
        description: 'JobProof captured but no re-check that cancellation actually stuck (status flipped, confirmation received). "Submitted" ≠ "cancelled".',
        impact: 'False confidence in cancellation success, potential charges despite "successful" job',
        mitigation: 'Implement verification step that checks account status post-cancellation, scrape confirmation emails/numbers, retry on failure',
        owner: 'Devin',
        dependencies: [],
        acceptanceCriteria: [
          'Verification step after each cancellation job',
          'Check account status via API or RPA',
          'Capture confirmation email/number',
          'Retry mechanism if verification fails',
          'Escalate to manual if verification fails 3 times'
        ]
      },
      {
        id: 'RISK-004',
        title: 'Escalation timing and notification channel',
        tier: 'T1_MONEY_CRITICAL',
        severity: 'HIGH',
        status: 'OPEN',
        description: 'manual_only and failed need notification with enough lead time for manual action. No notification channel wired (email/Slack/Notion).',
        impact: 'Silent failures lead to charges, no time to react manually',
        mitigation: 'Wire notification channels (email/Slack/Notion), implement lead time calculation, escalate based on urgency',
        owner: 'Devin',
        dependencies: [],
        acceptanceCriteria: [
          'Notification channel wired (email/Slack/Notion)',
          'Lead time calculation per service urgency',
          'Escalation rules: manual_only = 24h notice, failed = immediate',
          'Notification includes service, action needed, deadline',
          'Test notification delivery and timing'
        ]
      },

      // Tier 2 - Security Risk
      {
        id: 'RISK-005',
        title: 'Credential storage for RPA cancellation',
        tier: 'T2_SECURITY_RISK',
        severity: 'CRITICAL',
        status: 'OPEN',
        description: 'RPA cancellation requires login credentials. No design for encrypted storage, scoping, or boundary between Cloudflare worker and secret store.',
        impact: 'High-value secret exposure, security breach risk, credential management nightmare',
        mitigation: 'Design secure credential storage (Azure Key Vault), define Cloudflare worker boundary, implement encryption at rest/transit',
        owner: 'Devin',
        dependencies: [],
        acceptanceCriteria: [
          'Secret store architecture designed (Azure Key Vault)',
          'Cloudflare worker boundary defined',
          'Encryption at rest and in transit',
          'Credential scoping per service',
          'Access control and audit logging',
          'Secret rotation policy'
        ]
      },
      {
        id: 'RISK-006',
        title: 'Legal review of service ToS not completed',
        tier: 'T2_SECURITY_RISK',
        severity: 'HIGH',
        status: 'OPEN',
        description: 'Rule is "nothing public until proven legal" but no per-service ToS classification, no virtual-card-decline backstop check against issuer terms.',
        impact: 'Legal liability, account bans, payment processor issues, violates own rule',
        mitigation: 'Classify per-service ToS (automated cancellation allowed?), check virtual card decline backstop, complete legal review before production',
        owner: 'Human',
        dependencies: [],
        acceptanceCriteria: [
          'Per-service ToS classification completed',
          'Automated cancellation legality documented',
          'Virtual card decline backstop checked',
          'Legal review completed and documented',
          'Risk assessment per service',
          'Production deployment blocked until legal sign-off'
        ]
      },
      {
        id: 'RISK-007',
        title: 'PII retention and deletion policy missing',
        tier: 'T2_SECURITY_RISK',
        severity: 'MEDIUM',
        status: 'OPEN',
        description: 'Telemetry pseudonymized but no data-retention or deletion policy for stored trials, userIds, proofs - even for personal use.',
        impact: 'Data compliance issues, privacy concerns, data accumulation over time',
        mitigation: 'Define retention policy per data type, implement automatic deletion, add data export functionality',
        owner: 'Devin',
        dependencies: [],
        acceptanceCriteria: [
          'Retention policy defined (trials, userIds, proofs)',
          'Automatic deletion after retention period',
          'Data export functionality for GDPR compliance',
          'Pseudonymization strategy documented',
          'Audit trail for data access and deletion'
        ]
      },

      // Tier 3 - Reliability
      {
        id: 'RISK-008',
        title: 'Idempotency of cancellation jobs',
        tier: 'T3_RELIABILITY',
        severity: 'HIGH',
        status: 'OPEN',
        description: 'If sweep double-runs or job retries, can we double-submit cancellation? KV adapter has locks but trial→job dedup not proven.',
        impact: 'Double cancellation attempts, API rate limits, confusing status, potential account lockouts',
        mitigation: 'Implement job deduplication at trial level, add job idempotency keys, test double-run scenarios',
        owner: 'Devin',
        dependencies: [],
        acceptanceCriteria: [
          'Job deduplication at trial level',
          'Idempotency keys for each cancellation attempt',
          'Double-run scenario testing',
          'Retry logic with idempotency',
          'Job status tracking prevents double-submission'
        ]
      },
      {
        id: 'RISK-009',
        title: 'Quarantine review workflow not defined',
        tier: 'T3_RELIABILITY',
        severity: 'MEDIUM',
        status: 'OPEN',
        description: 'QuarantineEvent exists in schema but no defined human review path for quarantined flows.',
        impact: 'Quarantined trials stuck in limbo, no way to recover valid trials, manual intervention required',
        mitigation: 'Define quarantine review workflow, create review queue, implement approval/rejection mechanism',
        owner: 'Human',
        dependencies: [],
        acceptanceCriteria: [
          'Quarantine review workflow documented',
          'Review queue interface created',
          'Approval/rejection mechanism implemented',
          'Automatic cleanup of resolved quarantines',
          'Human notification for quarantine review'
        ]
      },
      {
        id: 'RISK-010',
        title: '"Keep this one" workflow missing',
        tier: 'T3_RELIABILITY',
        severity: 'MEDIUM',
        status: 'OPEN',
        description: 'Sometimes you want to convert a trial. No clean way to mark "keep, don\'t cancel" - everything trends toward auto-cancel.',
        impact: 'Forced cancellation of desired trials, manual intervention required, poor user experience',
        mitigation: 'Add "keep" status flag, exclude from auto-cancel, implement conversion workflow',
        owner: 'Devin',
        dependencies: [],
        acceptanceCriteria: [
          'Add "keep" status to trial schema',
          'Exclude "keep" trials from auto-cancel',
          'Conversion workflow from trial to paid',
          'Manual override for auto-cancel',
          'User interface for "keep" selection'
        ]
      },

      // Tier 4 - Connective Tissue
      {
        id: 'RISK-011',
        title: 'KV ↔ Notion sync not implemented',
        tier: 'T4_CONNECTIVE_TISSUE',
        severity: 'HIGH',
        status: 'IN_PROGRESS',
        description: 'Trials DB is empty mirror until sync exists. KV is source of truth, Notion is human mirror, but no sync mechanism.',
        impact: 'Human oversight impossible, data inconsistency, no visibility into trial status',
        mitigation: 'Implement bidirectional KV ↔ Notion sync, define conflict resolution, add sync monitoring',
        owner: 'Devin',
        dependencies: [],
        acceptanceCriteria: [
          'Bidirectional sync implemented',
          'Conflict resolution strategy defined',
          'Sync monitoring and alerts',
          'Human mirror updated in real-time',
          'Sync failure handling and recovery'
        ]
      },
      {
        id: 'RISK-012',
        title: 'Discovery review queue not built',
        tier: 'T4_CONNECTIVE_TISSUE',
        severity: 'MEDIUM',
        status: 'OPEN',
        description: 'Designed in Devin brief but not built. No human approval path for discovered trials before signup.',
        impact: 'Automated signup violates safety rails, no human oversight of trial selection',
        mitigation: 'Build discovery review queue, implement approval workflow, add trial signup gating',
        owner: 'Devin',
        dependencies: [],
        acceptanceCriteria: [
          'Discovery review queue interface',
          'Human approval workflow',
          'Trial signup gating',
          'Review history and audit trail',
          'Bulk approval/rejection functionality'
        ]
      },
      {
        id: 'RISK-013',
        title: 'Canary testing on live KV not performed',
        tier: 'T4_CONNECTIVE_TISSUE',
        severity: 'HIGH',
        status: 'OPEN',
        description: '3 canary checks skipped, no end-to-end test against real sandbox service, no chaos/timeout testing of MYBROWSER contract.',
        impact: 'Production bugs discovered too late, MYBROWSER contract reliability unknown, no chaos testing',
        mitigation: 'Perform canary checks on live KV, implement end-to-end sandbox testing, add chaos/timeout testing',
        owner: 'Devin',
        dependencies: [],
        acceptanceCriteria: [
          'Canary checks completed on live KV',
          'End-to-end sandbox service testing',
          'MYBROWSER contract chaos testing',
          'Timeout and failure scenario testing',
          'Performance baseline established'
        ]
      },
      {
        id: 'RISK-014',
        title: 'Alert receiver not wired',
        tier: 'T4_CONNECTIVE_TISSUE',
        severity: 'MEDIUM',
        status: 'OPEN',
        description: 'AlertRules schema exists but points at nothing. No alert delivery mechanism configured.',
        impact: 'Alerts generated but not delivered, no operational visibility, silent failures',
        mitigation: 'Wire alert receiver (email/Slack/Notion), configure alert routing, test alert delivery',
        owner: 'Devin',
        dependencies: [],
        acceptanceCriteria: [
          'Alert receiver configured',
          'Alert routing rules defined',
          'Alert delivery tested',
          'Alert severity levels working',
          'Alert aggregation and deduplication'
        ]
      },
      {
        id: 'RISK-015',
        title: 'Two-stack drift between Cloudflare and Azure',
        tier: 'T4_CONNECTIVE_TISSUE',
        severity: 'MEDIUM',
        status: 'OPEN',
        description: 'Cloudflare (orchestrator) + Azure (Runbook Operator) need clear owner-of-record and schema-version alignment or they\'ll diverge.',
        impact: 'Schema drift, inconsistent behavior, integration breakage, maintenance nightmare',
        mitigation: 'Define owner-of-record per stack, implement schema version alignment, add cross-stack integration tests',
        owner: 'Human',
        dependencies: [],
        acceptanceCriteria: [
          'Owner-of-record defined per stack',
          'Schema version alignment strategy',
          'Cross-stack integration tests',
          'Schema change notification process',
          'Documentation of stack boundaries'
        ]
      }
    ];

    risks.forEach(risk => {
      this.risks.set(risk.id, risk);
    });
    this.saveRegister();
  }

  /**
   * Get all risks
   */
  getAllRisks(): RiskItem[] {
    return Array.from(this.risks.values());
  }

  /**
   * Get risks by tier
   */
  getRisksByTier(tier: RiskItem['tier']): RiskItem[] {
    return this.getAllRisks().filter(risk => risk.tier === tier);
  }

  /**
   * Get risks by severity
   */
  getRisksBySeverity(severity: RiskItem['severity']): RiskItem[] {
    return this.getAllRisks().filter(risk => risk.severity === severity);
  }

  /**
   * Get risks by status
   */
  getRisksByStatus(status: RiskItem['status']): RiskItem[] {
    return this.getAllRisks().filter(risk => risk.status === status);
  }

  /**
   * Update risk status
   */
  updateRiskStatus(riskId: string, status: RiskItem['status']): void {
    const risk = this.risks.get(riskId);
    if (risk) {
      risk.status = status;
      this.saveRegister();
    }
  }

  /**
   * Generate risk report
   */
  generateReport(): string {
    let report = 'RISKS & GAPS REGISTER\n';
    report += '='.repeat(50) + '\n\n';

    const allRisks = this.getAllRisks();
    report += 'Total Risks: ' + allRisks.length + '\n\n';

    // Summary by tier
    report += 'By Tier:\n';
    const tiers = ['T1_MONEY_CRITICAL', 'T2_SECURITY_RISK', 'T3_RELIABILITY', 'T4_CONNECTIVE_TISSUE'];
    tiers.forEach(tier => {
      const count = this.getRisksByTier(tier as RiskItem['tier']).length;
      const open = this.getRisksByTier(tier as RiskItem['tier']).filter(r => r.status === 'OPEN').length;
      report += '  ' + tier + ': ' + count + ' total (' + open + ' open)\n';
    });
    report += '\n';

    // Summary by severity
    report += 'By Severity:\n';
    const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    severities.forEach(severity => {
      const count = this.getRisksBySeverity(severity as RiskItem['severity']).length;
      const open = this.getRisksBySeverity(severity as RiskItem['severity']).filter(r => r.status === 'OPEN').length;
      report += '  ' + severity + ': ' + count + ' total (' + open + ' open)\n';
    });
    report += '\n';

    // Critical risks first
    report += 'CRITICAL RISKS (Tier 1 - Money Critical):\n';
    const criticalRisks = this.getRisksByTier('T1_MONEY_CRITICAL').filter(r => r.severity === 'CRITICAL');
    criticalRisks.forEach(risk => {
      report += '\n' + risk.id + ' - ' + risk.title + '\n';
      report += '  Status: ' + risk.status + '\n';
      report += '  Owner: ' + risk.owner + '\n';
      report += '  Impact: ' + risk.impact + '\n';
      report += '  Mitigation: ' + risk.mitigation + '\n';
    });
    report += '\n';

    // Open risks
    report += 'OPEN RISKS (All Tiers):\n';
    const openRisks = this.getRisksByStatus('OPEN');
    openRisks.forEach(risk => {
      report += '\n' + risk.id + ' - ' + risk.title + '\n';
      report += '  Tier: ' + risk.tier + '\n';
      report += '  Severity: ' + risk.severity + '\n';
      report += '  Owner: ' + risk.owner + '\n';
    });
    report += '\n';

    return report;
  }

  /**
   * Get acceptance criteria for a risk
   */
  getAcceptanceCriteria(riskId: string): string[] {
    const risk = this.risks.get(riskId);
    return risk ? risk.acceptanceCriteria : [];
  }

  /**
   * Check if acceptance criteria met
   */
  checkAcceptanceCriteria(riskId: string): boolean {
    const criteria = this.getAcceptanceCriteria(riskId);
    // In production, this would check each criterion
    // For now, return false to indicate manual verification needed
    return false;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const register = new RisksGapsRegister();

  switch (command) {
    case 'report':
      console.log(register.generateReport());
      break;
    
    case 'tier':
      const tier = args[1];
      if (tier) {
        const risks = register.getRisksByTier(tier as any);
        console.log('Risks in ' + tier + ':');
        risks.forEach(risk => {
          console.log('  ' + risk.id + ' - ' + risk.title + ' (' + risk.status + ')');
        });
      } else {
        console.log('Usage: risks-gaps tier <T1_MONEY_CRITICAL|T2_SECURITY_RISK|T3_RELIABILITY|T4_CONNECTIVE_TISSUE>');
      }
      break;
    
    case 'severity':
      const severity = args[1];
      if (severity) {
        const risks = register.getRisksBySeverity(severity as any);
        console.log('Risks with ' + severity + ' severity:');
        risks.forEach(risk => {
          console.log('  ' + risk.id + ' - ' + risk.title + ' (' + risk.status + ')');
        });
      } else {
        console.log('Usage: risks-gaps severity <CRITICAL|HIGH|MEDIUM|LOW>');
      }
      break;
    
    case 'open':
      const openRisks = register.getRisksByStatus('OPEN');
      console.log('Open Risks: ' + openRisks.length);
      openRisks.forEach(risk => {
        console.log('  ' + risk.id + ' - ' + risk.title + ' (' + risk.tier + ', ' + risk.severity + ')');
      });
      break;
    
    case 'criteria':
      const riskId = args[1];
      if (riskId) {
        const criteria = register.getAcceptanceCriteria(riskId);
        console.log('Acceptance Criteria for ' + riskId + ':');
        criteria.forEach((criterion, index) => {
          console.log('  ' + (index + 1) + '. ' + criterion);
        });
      } else {
        console.log('Usage: risks-gaps criteria <riskId>');
      }
      break;
    
    case 'update':
      const updateId = args[1];
      const newStatus = args[2];
      if (updateId && newStatus) {
        register.updateRiskStatus(updateId, newStatus as any);
        console.log('Updated ' + updateId + ' to ' + newStatus);
      } else {
        console.log('Usage: risks-gaps update <riskId> <OPEN|IN_PROGRESS|MITIGATED|ACCEPTED|DEFERRED>');
      }
      break;
    
    default:
      console.log('Risks & Gaps Register');
      console.log('');
      console.log('Commands:');
      console.log('  report                    - Generate full risk report');
      console.log('  tier <name>              - Show risks by tier');
      console.log('  severity <name>          - Show risks by severity');
      console.log('  open                     - Show open risks');
      console.log('  criteria <riskId>        - Show acceptance criteria for risk');
      console.log('  update <id> <status>     - Update risk status');
      console.log('');
      console.log('Tiers:');
      console.log('  T1_MONEY_CRITICAL      - Direct financial impact');
      console.log('  T2_SECURITY_RISK       - Security and legal exposure');
      console.log('  T3_RELIABILITY          - System reliability');
      console.log('  T4_CONNECTIVE_TISSUE   - Integration and polish');
      console.log('');
      console.log('Severities:');
      console.log('  CRITICAL - System-breaking or expensive');
      console.log('  HIGH     - Significant impact');
      console.log('  MEDIUM   - Moderate impact');
      console.log('  LOW      - Minor impact');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { RisksGapsRegister, RiskItem };
