#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// Target companies from job postings
const targets = [
  {
    company: 'UMATR',
    position: 'Senior Agentic AI Engineer',
    context: 'Building autonomous agents for industrial supply chains and B2B financing',
    salary: '$150k-180k/year',
    email: 'careers@umatr.io' // Placeholder - need to find actual email
  },
  {
    company: 'Kyndryl',
    position: 'Agentic AI Developer',
    context: 'Building Agentic Service Management framework',
    salary: '$150k-180k/year',
    email: 'careers@kyndryl.com' // Placeholder - need to find actual email
  },
  {
    company: 'Teradata',
    position: 'Senior AI Engineer - Agentic Systems',
    context: 'Building agentic systems for AI-driven analytics',
    salary: '$150k-180k/year',
    email: 'careers@teradata.com' // Placeholder - need to find actual email
  },
  {
    company: 'ketteQ',
    position: 'Autonomous AI Developer - Supply Chain Planning',
    context: 'Building autonomous agents for supply chain planning',
    salary: '$150k-180k/year',
    email: 'careers@ketteq.com' // Placeholder - need to find actual email
  }
];

// Email template
const emailTemplate = (target) => `
Subject: Production-Ready Autonomous Agent API - Skip Hiring

Hi Hiring Manager,

I saw your job posting for ${target.position}. I have a production-ready autonomous agent system with API access that you can use immediately instead of hiring.

What I have:
- Autonomous agent team system
- API access with priority rate limits
- Council session logs & replay
- Email support
- Multi-chain crypto payments (no KYC, instant settlement)

Pricing: $49/month for API access (vs ${target.salary} salary)

Try it: https://aether-pay.pages.dev

API Documentation: https://github.com/atomeam/Aether

Why this makes sense:
- Skip hiring process (months)
- Save ${target.salary} in salary
- Get immediate access to production system
- Scale without headcount

Would you like to try the API before hiring?

Best,
[Your Name]
`;

// Function to send email (placeholder - would need SMTP credentials)
function sendEmail(to, subject, body) {
  console.log(`[EMAIL] To: ${to}`);
  console.log(`[EMAIL] Subject: ${subject}`);
  console.log(`[EMAIL] Body: ${body.substring(0, 100)}...`);
  console.log('[EMAIL] (Email not sent - SMTP credentials required)');
  console.log('');
}

// Function to save email drafts
function saveEmailDraft(target) {
  const filename = `email-${target.company.toLowerCase()}.txt`;
  const content = emailTemplate(target);
  fs.writeFileSync(filename, content);
  console.log(`[SAVED] Email draft saved to ${filename}`);
}

// Main execution
async function main() {
  console.log('🎯 Direct Sales Outreach - B2B API Access');
  console.log('Payment URL: https://aether-pay.pages.dev');
  console.log('');

  // Save email drafts
  for (const target of targets) {
    saveEmailDraft(target);
  }

  console.log('');
  console.log('📊 Outreach Summary');
  console.log('Target companies:', targets.length);
  console.log('Email drafts saved:', targets.length);
  console.log('');
  console.log('💡 Next steps:');
  console.log('1. Find actual email addresses for these companies');
  console.log('2. Update the email templates with your name');
  console.log('3. Send the emails');
  console.log('4. Follow up in 24 hours');
  console.log('5. Offer free trial if no response');
  console.log('');
  console.log('🔗 Payment URL: https://aether-pay.pages.dev');
  console.log('💰 Expected revenue: $49/month per sale');
  console.log('⏱️  Expected time to first dollar: 24-72 hours');
}

main().catch(console.error);
