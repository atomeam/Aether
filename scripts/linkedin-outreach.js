#!/usr/bin/env node

// LinkedIn outreach templates
const linkedinTemplates = {
  connectionRequest: `
Hi [Name],

I have a production-ready autonomous agent system with API access. I'm looking to connect with companies building agentic AI systems.

Try it: https://aether-pay.pages.dev

Would you like to connect?
  `.trim(),

  directMessage: `
Hi [Name],

I saw you're hiring for [Position]. I have a production-ready autonomous agent system with API access that you can use immediately instead of hiring.

Pricing: $49/month vs $150k-180k/year salary.

Try it: https://aether-pay.pages.dev

Would you like to try the API before hiring?
  `.trim(),

  inMail: `
Subject: Production-Ready Autonomous Agent API

Hi [Name],

I have a production-ready autonomous agent system with API access that you can use immediately instead of hiring.

What I have:
- Autonomous agent team system
- API access with priority rate limits
- Council session logs & replay
- Email support
- Multi-chain crypto payments (no KYC, instant settlement)

Pricing: $49/month for API access (vs $150k-180k/year salary)

Try it: https://aether-pay.pages.dev

API Documentation: https://github.com/atomeam/Aether

Why this makes sense:
- Skip hiring process (months)
- Save $150k-180k/year in salary
- Get immediate access to production system
- Scale without headcount

Would you like to try the API before hiring?

Best,
[Your Name]
  `.trim()
};

// Target LinkedIn profiles (need to find actual profiles)
const targets = [
  {
    company: 'UMATR',
    position: 'Senior Agentic AI Engineer',
    linkedinUrl: 'https://www.linkedin.com/jobs/view/...' // Need to find actual job posting
  },
  {
    company: 'Kyndryl',
    position: 'Agentic AI Developer',
    linkedinUrl: 'https://www.linkedin.com/jobs/view/...' // Need to find actual job posting
  },
  {
    company: 'Teradata',
    position: 'Senior AI Engineer - Agentic Systems',
    linkedinUrl: 'https://www.linkedin.com/jobs/view/...' // Need to find actual job posting
  },
  {
    company: 'ketteQ',
    position: 'Autonomous AI Developer - Supply Chain Planning',
    linkedinUrl: 'https://www.linkedin.com/jobs/view/...' // Need to find actual job posting
  }
];

console.log('🎯 LinkedIn Outreach - B2B API Access');
console.log('Payment URL: https://aether-pay.pages.dev');
console.log('');

console.log('📋 LinkedIn Templates:');
console.log('');
console.log('1. Connection Request:');
console.log(linkedinTemplates.connectionRequest);
console.log('');
console.log('2. Direct Message:');
console.log(linkedinTemplates.directMessage);
console.log('');
console.log('3. InMail:');
console.log(linkedinTemplates.inMail);
console.log('');

console.log('📊 Outreach Summary');
console.log('Target companies:', targets.length);
console.log('Templates available:', 3);
console.log('');
console.log('💡 Next steps:');
console.log('1. Find actual LinkedIn profiles for hiring managers');
console.log('2. Send connection requests with template 1');
console.log('3. Send direct messages with template 2');
console.log('4. Send InMails with template 3 (if available)');
console.log('5. Follow up in 24 hours');
console.log('');
console.log('🔗 Payment URL: https://aether-pay.pages.dev');
console.log('💰 Expected revenue: $49/month per sale');
console.log('⏱️  Expected time to first dollar: 24-72 hours');
