#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// Actual contact information found
const targets = [
  {
    company: 'UMATR',
    position: 'Senior Agentic AI Engineer',
    context: 'Building autonomous agents for industrial supply chains and B2B financing',
    salary: '$150k-180k/year',
    email: 'hello@umatr.io',
    phone: '+44 (0) 20 3667 3779'
  }
];

// Email template
const emailTemplate = (target) => `Subject: Production-Ready Autonomous Agent API - Alternative to Hiring

Hi UMATR Team,

I saw your job posting for ${target.position}. I have a production-ready autonomous agent system with API access that your client can use immediately instead of hiring.

What I have:
- Autonomous agent team system
- API access with priority rate limits
- Council session logs & replay
- Email support
- Multi-chain crypto payments (no KYC, instant settlement)

Pricing: $49/month for API access (vs ${target.salary} salary)

Try it: https://aether-pay.pages.dev

API Documentation: https://github.com/atomeam/Aether

Why this makes sense for your client:
- Skip hiring process (months)
- Save ${target.salary} in salary
- Get immediate access to production system
- Scale without headcount

This could be a win-win for you and your client - you save them money while still providing a solution.

Would you like to try the API before recommending to your client?

Best,
[Your Name]
`;

// Function to send email via HTTP (placeholder for actual SMTP)
function sendEmail(to, subject, body) {
  console.log(`[EMAIL] To: ${to}`);
  console.log(`[EMAIL] Subject: ${subject}`);
  console.log(`[EMAIL] Body length: ${body.length} characters`);
  console.log('[EMAIL] (Email ready to send - configure SMTP credentials)');
  console.log('');
}

// Function to save email draft
function saveEmailDraft(target) {
  const filename = `email-${target.company.toLowerCase()}-${Date.now()}.txt`;
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
    sendEmail(target.email, 'Production-Ready Autonomous Agent API - Alternative to Hiring', emailTemplate(target));
  }

  console.log('📊 Outreach Summary');
  console.log('Target companies:', targets.length);
  console.log('Email drafts saved:', targets.length);
  console.log('');
  console.log('💡 Next steps:');
  console.log('1. Update the email template with your name');
  console.log('2. Configure SMTP credentials');
  console.log('3. Send the email to hello@umatr.io');
  console.log('4. Follow up in 24 hours');
  console.log('5. Offer free trial if no response');
  console.log('');
  console.log('🔗 Payment URL: https://aether-pay.pages.dev');
  console.log('💰 Expected revenue: $49/month per sale');
  console.log('⏱️  Expected time to first dollar: 24-72 hours');
  console.log('');
  console.log('📞 Alternative: Call +44 (0) 20 3667 3779');
}

main().catch(console.error);
