/**
 * Autonomous Customer Support Agent
 * 24/7 customer support with AI-powered issue resolution
 */

const fs = require('fs');
const path = require('path');

class CustomerSupportAgent {
  constructor() {
    this.tickets = [];
    this.knowledgeBase = [];
    this.resolutions = [];
    
    this.dataPath = path.resolve(__dirname, 'support-data.json');
    this.kbPath = path.resolve(__dirname, 'knowledge-base.json');
    this.resolutionsPath = path.resolve(__dirname, 'resolutions.json');
    
    this.loadData();
  }

  // Process incoming support ticket
  async processTicket(ticket) {
    console.log(`🎫 Processing support ticket: ${ticket.id}`);
    
    const processedTicket = {
      id: ticket.id,
      originalTicket: ticket,
      timestamp: new Date().toISOString(),
      status: 'processing',
      
      // AI Analysis
      analysis: await this.analyzeTicket(ticket),
      
      // Resolution
      resolution: null,
      
      // Escalation
      escalated: false,
      escalationReason: null
    };
    
    // Attempt resolution
    const resolution = await this.attemptResolution(ticket, processedTicket.analysis);
    
    if (resolution.success) {
      processedTicket.resolution = resolution;
      processedTicket.status = 'resolved';
      processedTicket.resolutionTime = new Date().toISOString();
      
      // Learn from resolution
      this.learnFromResolution(ticket, resolution);
    } else {
      // Escalate to human
      processedTicket.escalated = true;
      processedTicket.escalationReason = resolution.reason;
      processedTicket.status = 'escalated';
      
      // Generate escalation summary
      processedTicket.escalationSummary = this.generateEscalationSummary(ticket, processedTicket.analysis);
    }
    
    this.tickets.push(processedTicket);
    this.saveData();
    
    return processedTicket;
  }

  // Analyze ticket with AI
  async analyzeTicket(ticket) {
    console.log('🧠 Analyzing ticket with AI...');
    
    const analysis = {
      category: this.classifyCategory(ticket),
      urgency: this.assessUrgency(ticket),
      complexity: this.assessComplexity(ticket),
      sentiment: this.analyzeSentiment(ticket),
      keywords: this.extractKeywords(ticket),
      similarTickets: this.findSimilarTickets(ticket),
      suggestedResolution: this.suggestResolution(ticket),
      confidence: this.calculateConfidence(ticket)
    };
    
    return analysis;
  }

  // Classify ticket category
  classifyCategory(ticket) {
    const categories = {
      'technical': ['bug', 'error', 'broken', 'not working', 'crash', 'issue'],
      'billing': ['payment', 'charge', 'refund', 'invoice', 'subscription', 'pricing'],
      'feature': ['feature', 'request', 'suggestion', 'improvement', 'add', 'new'],
      'account': ['login', 'password', 'account', 'signup', 'profile', 'settings'],
      'usage': ['how to', 'help', 'tutorial', 'guide', 'question', 'usage'],
      'integration': ['api', 'integration', 'connect', 'webhook', 'third-party']
    };
    
    const text = (ticket.subject + ' ' + ticket.description).toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  }

  // Assess urgency
  assessUrgency(ticket) {
    const urgencyKeywords = ['urgent', 'emergency', 'critical', 'asap', 'immediately', 'broken', 'down'];
    const text = (ticket.subject + ' ' + ticket.description).toLowerCase();
    
    if (urgencyKeywords.some(keyword => text.includes(keyword))) {
      return 'critical';
    }
    
    if (ticket.priority === 'high') {
      return 'high';
    }
    
    return 'normal';
  }

  // Assess complexity
  assessComplexity(ticket) {
    const complexityFactors = {
      wordCount: (ticket.subject + ' ' + ticket.description).split(' ').length,
      hasAttachments: ticket.attachments && ticket.attachments.length > 0,
      hasCode: ticket.description.includes('```') || ticket.description.includes('code'),
      hasLogs: ticket.description.includes('log') || ticket.description.includes('error'),
      categoryComplexity: this.getCategoryComplexity(ticket)
    };
    
    let complexityScore = 0;
    
    if (complexityFactors.wordCount > 100) complexityScore += 2;
    if (complexityFactors.hasAttachments) complexityScore += 1;
    if (complexityFactors.hasCode) complexityScore += 2;
    if (complexityFactors.hasLogs) complexityScore += 2;
    complexityScore += complexityFactors.categoryComplexity;
    
    if (complexityScore >= 5) return 'high';
    if (complexityScore >= 3) return 'medium';
    return 'low';
  }

  // Get category complexity
  getCategoryComplexity(ticket) {
    const complexityMap = {
      'technical': 2,
      'billing': 1,
      'feature': 1,
      'account': 1,
      'usage': 0,
      'integration': 2
    };
    
    const category = this.classifyCategory(ticket);
    return complexityMap[category] || 1;
  }

  // Analyze sentiment
  analyzeSentiment(ticket) {
    const text = ticket.subject + ' ' + ticket.description;
    
    const positiveWords = ['great', 'good', 'excellent', 'love', 'thanks', 'helpful', 'amazing'];
    const negativeWords = ['bad', 'terrible', 'hate', 'angry', 'frustrated', 'broken', 'worst'];
    
    const positiveCount = positiveWords.filter(word => text.toLowerCase().includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.toLowerCase().includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Extract keywords
  extractKeywords(ticket) {
    const text = (ticket.subject + ' ' + ticket.description).toLowerCase();
    const words = text.split(/\s+/);
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'want', 'like', 'just', 'only', 'also', 'very', 'really', 'please', 'thank', 'thanks'];
    
    return words
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .slice(0, 10);
  }

  // Find similar tickets
  findSimilarTickets(ticket) {
    const keywords = this.extractKeywords(ticket);
    
    const similar = this.resolutions.filter(resolution => {
      const resolutionKeywords = resolution.keywords || [];
      const overlap = keywords.filter(k => resolutionKeywords.includes(k)).length;
      return overlap >= 2;
    });
    
    return similar.slice(0, 5);
  }

  // Suggest resolution
  suggestResolution(ticket) {
    const category = this.classifyCategory(ticket);
    const similarTickets = this.findSimilarTickets(ticket);
    
    if (similarTickets.length > 0) {
      // Use resolution from similar ticket
      return {
        type: 'similar',
        resolution: similarTickets[0].resolution,
        confidence: 0.8
      };
    }
    
    // Generate resolution based on category
    const categoryResolutions = {
      'technical': 'Please try clearing your cache and restarting. If the issue persists, please provide error logs.',
      'billing': 'I can help with billing issues. Please check your subscription status in your account settings.',
      'feature': 'Thank you for your feature suggestion! I\'ve added it to our roadmap for consideration.',
      'account': 'Please try resetting your password using the "Forgot Password" link on the login page.',
      'usage': 'I\'d be happy to help you with that. Here\'s a quick guide to get you started.',
      'integration': 'For API integration, please refer to our documentation at docs.example.com/api',
      'general': 'I understand your concern. Let me help you resolve this issue.'
    };
    
    return {
      type: 'category',
      resolution: categoryResolutions[category] || categoryResolutions['general'],
      confidence: 0.6
    };
  }

  // Calculate confidence
  calculateConfidence(ticket) {
    const similarTickets = this.findSimilarTickets(ticket);
    const category = this.classifyCategory(ticket);
    const complexity = this.assessComplexity(ticket);
    
    let confidence = 0.5; // Base confidence
    
    if (similarTickets.length > 0) confidence += 0.3;
    if (category !== 'general') confidence += 0.1;
    if (complexity === 'low') confidence += 0.1;
    
    return Math.min(1, confidence);
  }

  // Attempt resolution
  async attemptResolution(ticket, analysis) {
    console.log('🔧 Attempting resolution...');
    
    // Check if we can auto-resolve
    if (analysis.confidence > 0.7 && analysis.complexity !== 'high') {
      const resolution = analysis.suggestedResolution.resolution;
      
      // Generate personalized response
      const response = this.generateResponse(ticket, analysis, resolution);
      
      return {
        success: true,
        resolution,
        response,
        autoResolved: true
      };
    }
    
    // Check if similar tickets exist
    if (analysis.similarTickets.length > 0) {
      const similarResolution = analysis.similarTickets[0];
      
      if (similarResolution.success) {
        const response = this.generateResponse(ticket, analysis, similarResolution.resolution);
        
        return {
          success: true,
          resolution: similarResolution.resolution,
          response,
          autoResolved: true,
          fromSimilarTicket: true
        };
      }
    }
    
    // Cannot auto-resolve
    return {
      success: false,
      reason: analysis.complexity === 'high' ? 'Too complex for auto-resolution' : 'Insufficient confidence for auto-resolution'
    };
  }

  // Generate personalized response
  generateResponse(ticket, analysis, resolution) {
    const greeting = this.generateGreeting(ticket);
    const body = resolution;
    const closing = this.generateClosing(ticket);
    
    return {
      greeting,
      body,
      closing,
      fullResponse: `${greeting}\n\n${body}\n\n${closing}`
    };
  }

  // Generate greeting
  generateGreeting(ticket) {
    const greetings = [
      `Hi ${ticket.customerName},`,
      `Hello ${ticket.customerName},`,
      `Dear ${ticket.customerName},`
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // Generate closing
  generateClosing(ticket) {
    const closings = [
      'Best regards,\nSupport Team',
      'Let me know if you need anything else!\nSupport Team',
      'Is there anything else I can help you with?\nSupport Team'
    ];
    
    return closings[Math.floor(Math.random() * closings.length)];
  }

  // Generate escalation summary
  generateEscalationSummary(ticket, analysis) {
    return {
      ticketId: ticket.id,
      category: analysis.category,
      urgency: analysis.urgency,
      complexity: analysis.complexity,
      sentiment: analysis.sentiment,
      suggestedResolution: analysis.suggestedResolution.resolution,
      similarTickets: analysis.similarTickets.length,
      reason: analysis.complexity === 'high' ? 'Complex issue requiring human expertise' : 'Insufficient information for auto-resolution',
      recommendedAction: this.escalationAction(analysis)
    };
  }

  // Determine escalation action
  escalationAction(analysis) {
    if (analysis.urgency === 'critical') {
      return 'Immediate escalation to senior support';
    }
    
    if (analysis.category === 'billing') {
      return 'Escalate to billing specialist';
    }
    
    if (analysis.category === 'technical' && analysis.complexity === 'high') {
      return 'Escalate to technical lead';
    }
    
    return 'Escalate to human support agent';
  }

  // Learn from resolution
  learnFromResolution(ticket, resolution) {
    const learning = {
      ticketId: ticket.id,
      category: this.classifyCategory(ticket),
      keywords: this.extractKeywords(ticket),
      resolution: resolution.resolution,
      success: resolution.success,
      timestamp: new Date().toISOString()
    };
    
    this.resolutions.push(learning);
    this.saveResolutions();
  }

  // Add to knowledge base
  async addToKnowledgeBase(article) {
    console.log(`📚 Adding to knowledge base: ${article.title}`);
    
    const kbArticle = {
      id: this.generateKBId(),
      title: article.title,
      content: article.content,
      category: article.category,
      tags: article.tags || [],
      keywords: this.extractKeywords({ subject: article.title, description: article.content }),
      createdAt: new Date().toISOString(),
      views: 0,
      helpful: 0
    };
    
    this.knowledgeBase.push(kbArticle);
    this.saveKnowledgeBase();
    
    return kbArticle;
  }

  // Search knowledge base
  searchKnowledgeBase(query) {
    const queryKeywords = this.extractKeywords({ subject: query, description: '' });
    
    const results = this.knowledgeBase.filter(article => {
      const articleKeywords = article.keywords || [];
      const overlap = queryKeywords.filter(k => articleKeywords.includes(k)).length;
      return overlap >= 1;
    });
    
    return results.slice(0, 10);
  }

  // Generate KB ID
  generateKBId() {
    return `kb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load data
  loadData() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      this.tickets = JSON.parse(data);
    }
    
    if (fs.existsSync(this.kbPath)) {
      const data = fs.readFileSync(this.kbPath, 'utf8');
      this.knowledgeBase = JSON.parse(data);
    }
    
    if (fs.existsSync(this.resolutionsPath)) {
      const data = fs.readFileSync(this.resolutionsPath, 'utf8');
      this.resolutions = JSON.parse(data);
    }
  }

  // Save data
  saveData() {
    if (this.tickets.length > 1000) {
      this.tickets = this.tickets.slice(-1000);
    }
    fs.writeFileSync(this.dataPath, JSON.stringify(this.tickets, null, 2));
  }

  // Save knowledge base
  saveKnowledgeBase() {
    if (this.knowledgeBase.length > 500) {
      this.knowledgeBase = this.knowledgeBase.slice(-500);
    }
    fs.writeFileSync(this.kbPath, JSON.stringify(this.knowledgeBase, null, 2));
  }

  // Save resolutions
  saveResolutions() {
    if (this.resolutions.length > 1000) {
      this.resolutions = this.resolutions.slice(-1000);
    }
    fs.writeFileSync(this.resolutionsPath, JSON.stringify(this.resolutions, null, 2));
  }

  // Get support statistics
  getStatistics() {
    const total = this.tickets.length;
    const resolved = this.tickets.filter(t => t.status === 'resolved').length;
    const escalated = this.tickets.filter(t => t.status === 'escalated').length;
    const autoResolved = this.tickets.filter(t => t.resolution && t.resolution.autoResolved).length;
    
    return {
      total,
      resolved,
      escalated,
      autoResolved,
      resolutionRate: total > 0 ? (resolved / total * 100).toFixed(2) : 0,
      autoResolutionRate: total > 0 ? (autoResolved / total * 100).toFixed(2) : 0,
      knowledgeBaseSize: this.knowledgeBase.length,
      resolutionsLearned: this.resolutions.length
    };
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const agent = new CustomerSupportAgent();

  switch (command) {
    case 'process':
      if (args[1]) {
        const ticket = JSON.parse(args[1]);
        const result = await agent.processTicket(ticket);
        console.log('🎫 Processed Ticket:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node customer-support.js process <ticket-json>');
      }
      break;

    case 'add-kb':
      if (args[1]) {
        const article = JSON.parse(args[1]);
        const result = await agent.addToKnowledgeBase(article);
        console.log('📚 Added to Knowledge Base:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node customer-support.js add-kb <article-json>');
      }
      break;

    case 'search':
      if (args[1]) {
        const results = agent.searchKnowledgeBase(args[1]);
        console.log('🔍 Knowledge Base Search Results:');
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.error('Usage: node customer-support.js search <query>');
      }
      break;

    case 'stats':
      const stats = agent.getStatistics();
      console.log('📊 Support Statistics:');
      console.log(JSON.stringify(stats, null, 2));
      break;

    default:
      console.log('🎫 Autonomous Customer Support Agent');
      console.log('');
      console.log('Commands:');
      console.log('  process  - Process support ticket');
      console.log('  add-kb   - Add article to knowledge base');
      console.log('  search   - Search knowledge base');
      console.log('  stats    - Get support statistics');
      console.log('');
      console.log('Examples:');
      console.log('  node customer-support.js process \'{"id":"123","subject":"Help"}\'');
      console.log('  node customer-support.js add-kb \'{"title":"Guide"}\'');
      console.log('  node customer-support.js search "login issue"');
      console.log('  node customer-support.js stats');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  CustomerSupportAgent
};
