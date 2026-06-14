/**
 * Reconciliation SaaS Orchestrator
 * Unified workflow for reconciliation SaaS operations
 */

const { ReconciliationScout } = require('./scout');
const { LeadQualifier } = require('./qualifier');
const { ReconciliationOutreach } = require('./outreach');
const { OnePagerMaintenance } = require('./one-pager');
const { ReconciliationReportGenerator } = require('./report-generator');

class ReconciliationSaaSOrchestrator {
  constructor() {
    // Core systems
    this.scout = new ReconciliationScout();
    this.qualifier = new LeadQualifier();
    this.outreach = new ReconciliationOutreach();
    this.onePager = new OnePagerMaintenance();
    this.reportGenerator = new ReconciliationReportGenerator();
    
    // Orchestrator state
    this.workflows = [];
    this.dataPath = __dirname + '/orchestrator-data.json';
    this.loadWorkflows();
  }

  // Run complete Reconciliation SaaS workflow
  async runCompleteWorkflow() {
    console.log('🚀 Running complete Reconciliation SaaS workflow...\n');
    
    const workflowId = this.generateWorkflowId();
    const startTime = Date.now();
    
    try {
      // Step 1: Scout founders with reconciliation pain
      console.log('🔍 Step 1: Scouting founders with reconciliation pain...');
      const founders = await this.scout.scoutFounders();
      console.log(`✅ Found ${founders.length} founders with reconciliation pain\n`);
      
      // Step 2: Qualify and deduplicate into Leads Queue
      console.log('✅ Step 2: Qualifying and deduplicating founders...');
      const qualificationResults = await this.qualifier.qualifyFounders(founders);
      console.log(`✅ Qualified ${qualificationResults.qualified.length} leads, disqualified ${qualificationResults.disqualified.length}, found ${qualificationResults.duplicates.length} duplicates\n`);
      
      // Step 3: Get leads queue
      const leadsQueue = this.qualifier.getLeadsQueue();
      
      // Step 4: Draft personalized outreach per lead
      console.log('📧 Step 4: Drafting personalized outreach per lead...');
      const outreachResults = await this.outreach.generateOutreachForQueue(leadsQueue);
      console.log(`✅ Generated ${outreachResults.length} personalized outreach messages\n`);
      
      // Step 5: Keep the offer one-pager current
      console.log('📄 Step 5: Refreshing one-pager with latest data...');
      const onePager = await this.onePager.refreshOnePager();
      console.log(`✅ One-pager refreshed to version ${onePager.version}\n`);
      
      // Step 6: Prepare reconciliation reports for existing customers
      console.log('📊 Step 6: Preparing reconciliation reports for existing customers...');
      const customers = this.reportGenerator.customers;
      const reports = [];
      
      for (const customer of customers) {
        const dataReady = await this.reportGenerator.checkCustomerDataReady(customer.id);
        
        if (dataReady.ready) {
          const report = await this.reportGenerator.generateReport(customer.id, 'current');
          reports.push(report);
        }
      }
      
      console.log(`✅ Generated ${reports.length} reconciliation reports\n`);
      
      const workflowDuration = Date.now() - startTime;
      
      const workflow = {
        id: workflowId,
        timestamp: new Date().toISOString(),
        duration: workflowDuration,
        results: {
          foundersScouted: founders.length,
          leadsQualified: qualificationResults.qualified.length,
          leadsDisqualified: qualificationResults.disqualified.length,
          duplicatesFound: qualificationResults.duplicates.length,
          outreachGenerated: outreachResults.length,
          onePagerVersion: onePager.version,
          reportsGenerated: reports.length
        },
        status: 'completed'
      };
      
      this.workflows.push(workflow);
      this.saveWorkflows();
      
      console.log('🎉 Complete Reconciliation SaaS workflow finished!');
      console.log(`⏱️  Total time: ${workflowDuration}ms`);
      console.log(`🔍 Founders scouted: ${founders.length}`);
      console.log(`✅ Leads qualified: ${qualificationResults.qualified.length}`);
      console.log(`📧 Outreach generated: ${outreachResults.length}`);
      console.log(`📄 One-pager version: ${onePager.version}`);
      console.log(`📊 Reports generated: ${reports.length}`);
      
      return workflow;
    } catch (error) {
      console.error(`❌ Workflow failed: ${error.message}`);
      throw error;
    }
  }

  // Run scout workflow only
  async runScoutWorkflow() {
    console.log('🔍 Running scout workflow...');
    
    const founders = await this.scout.scoutFounders();
    
    return {
      founders,
      count: founders.length,
      statistics: this.scout.getStatistics()
    };
  }

  // Run qualification workflow only
  async runQualificationWorkflow(founders) {
    console.log('✅ Running qualification workflow...');
    
    const results = await this.qualifier.qualifyFounders(founders);
    
    return {
      results,
      leadsQueue: this.qualifier.getLeadsQueue(),
      statistics: this.qualifier.getStatistics()
    };
  }

  // Run outreach workflow only
  async runOutreachWorkflow(leadsQueue) {
    console.log('📧 Running outreach workflow...');
    
    const results = await this.outreach.generateOutreachForQueue(leadsQueue);
    
    return {
      results,
      statistics: this.outreach.getStatistics()
    };
  }

  // Run one-pager workflow only
  async runOnePagerWorkflow() {
    console.log('📄 Running one-pager workflow...');
    
    const onePager = await this.onePager.refreshOnePager();
    
    return {
      onePager,
      html: this.onePager.generateHTML(),
      statistics: {
        version: onePager.version,
        lastUpdated: onePager.lastUpdated
      }
    };
  }

  // Run report workflow only
  async runReportWorkflow() {
    console.log('📊 Running report workflow...');
    
    const customers = this.reportGenerator.customers;
    const reports = [];
    
    for (const customer of customers) {
      const dataReady = await this.reportGenerator.checkCustomerDataReady(customer.id);
      
      if (dataReady.ready) {
        const report = await this.reportGenerator.generateReport(customer.id, 'current');
        reports.push(report);
      }
    }
    
    return {
      reports,
      count: reports.length,
      statistics: this.reportGenerator.getStatistics()
    };
  }

  // Add customer and generate report
  async addCustomerAndGenerateReport(customer) {
    console.log('👤 Adding customer and generating report...');
    
    const addedCustomer = await this.reportGenerator.addCustomer(customer);
    
    const report = await this.reportGenerator.generateReportWhenReady(addedCustomer.id, 'current');
    
    return {
      customer: addedCustomer,
      report
    };
  }

  // Get unified statistics
  getUnifiedStatistics() {
    return {
      scout: this.scout.getStatistics(),
      qualifier: this.qualifier.getStatistics(),
      outreach: this.outreach.getStatistics(),
      onePager: {
        version: this.onePager.onePager.version,
        lastUpdated: this.onePager.onePager.lastUpdated
      },
      reportGenerator: this.reportGenerator.getStatistics(),
      totalWorkflows: this.workflows.length
    };
  }

  // Generate workflow ID
  generateWorkflowId() {
    return `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load workflows
  loadWorkflows() {
    if (require('fs').existsSync(this.dataPath)) {
      const data = require('fs').readFileSync(this.dataPath, 'utf8');
      this.workflows = JSON.parse(data);
    }
  }

  // Save workflows
  saveWorkflows() {
    if (this.workflows.length > 50) {
      this.workflows = this.workflows.slice(-50);
    }
    require('fs').writeFileSync(this.dataPath, JSON.stringify(this.workflows, null, 2));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const orchestrator = new ReconciliationSaaSOrchestrator();

  switch (command) {
    case 'run':
      const workflow = await orchestrator.runCompleteWorkflow();
      console.log('🚀 Complete Workflow:');
      console.log(JSON.stringify(workflow, null, 2));
      break;

    case 'scout':
      const scoutWorkflow = await orchestrator.runScoutWorkflow();
      console.log('🔍 Scout Workflow:');
      console.log(JSON.stringify(scoutWorkflow, null, 2));
      break;

    case 'qualify':
      if (args[1]) {
        const founders = JSON.parse(args[1]);
        const qualWorkflow = await orchestrator.runQualificationWorkflow(founders);
        console.log('✅ Qualification Workflow:');
        console.log(JSON.stringify(qualWorkflow, null, 2));
      } else {
        console.error('Usage: node orchestrator.js qualify <founders-json>');
      }
      break;

    case 'outreach':
      if (args[1]) {
        const leadsQueue = JSON.parse(args[1]);
        const outreachWorkflow = await orchestrator.runOutreachWorkflow(leadsQueue);
        console.log('📧 Outreach Workflow:');
        console.log(JSON.stringify(outreachWorkflow, null, 2));
      } else {
        console.error('Usage: node orchestrator.js outreach <leads-queue-json>');
      }
      break;

    case 'one-pager':
      const onePagerWorkflow = await orchestrator.runOnePagerWorkflow();
      console.log('📄 One-Pager Workflow:');
      console.log(JSON.stringify(onePagerWorkflow, null, 2));
      break;

    case 'reports':
      const reportWorkflow = await orchestrator.runReportWorkflow();
      console.log('📊 Report Workflow:');
      console.log(JSON.stringify(reportWorkflow, null, 2));
      break;

    case 'add-customer':
      if (args[1]) {
        const customer = JSON.parse(args[1]);
        const result = await orchestrator.addCustomerAndGenerateReport(customer);
        console.log('👤 Customer Added and Report Generated:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node orchestrator.js add-customer <customer-json>');
      }
      break;

    case 'stats':
      const stats = orchestrator.getUnifiedStatistics();
      console.log('📊 Unified Statistics:');
      console.log(JSON.stringify(stats, null, 2));
      break;

    default:
      console.log('🚀 Reconciliation SaaS Orchestrator');
      console.log('');
      console.log('Commands:');
      console.log('  run         - Run complete workflow');
      console.log('  scout       - Run scout workflow');
      console.log('  qualify     - Run qualification workflow');
      console.log('  outreach    - Run outreach workflow');
      console.log('  one-pager   - Run one-pager workflow');
      console.log('  reports     - Run report workflow');
      console.log('  add-customer - Add customer and generate report');
      console.log('  stats       - Get unified statistics');
      console.log('');
      console.log('Examples:');
      console.log('  node orchestrator.js run');
      console.log('  node orchestrator.js scout');
      console.log('  node orchestrator.js qualify \'[{"name":"Test"}]\'');
      console.log('  node orchestrator.js outreach \'[{"name":"Test"}]\'');
      console.log('  node orchestrator.js one-pager');
      console.log('  node orchestrator.js reports');
      console.log('  node orchestrator.js add-customer \'{"name":"Test"}\'');
      console.log('  node orchestrator.js stats');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  ReconciliationSaaSOrchestrator
};
