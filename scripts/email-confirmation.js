/**
 * Email Confirmation Automation
 * Automatically handles email verification and confirmation steps
 */

const PersistentBrowserClient = require('./persistent-browser-client');

class EmailConfirmationAutomation {
  constructor() {
    this.client = new PersistentBrowserClient();
    this.confirmations = [];
    this.dataPath = './email-confirmations.json';
    this.loadConfirmations();
  }

  // Monitor for confirmation emails and auto-confirm
  async handleEmailConfirmation(targetEmail = 'atomicmoonbeam88@gmail.com') {
    console.log('📧 Starting email confirmation automation...');
    
    try {
      // Navigate to Gmail
      console.log('📝 Navigating to Gmail...');
      await this.client.navigateTo('https://mail.google.com');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Search for confirmation emails
      console.log('🔍 Searching for confirmation emails...');
      const confirmationKeywords = ['confirm', 'verify', 'verification', 'confirm your email', 'verify your email'];
      
      // Look for emails with confirmation keywords
      const emailSelectors = [
        'div[role="listitem"]',
        'tr.zA7wbf',
        'div[data-thread-id]'
      ];
      
      let confirmationEmail = null;
      
      for (const selector of emailSelectors) {
        try {
          const elements = await this.client.listElements(selector);
          console.log(`📋 Found ${elements.length} elements with selector: ${selector}`);
          
          for (const element of elements) {
            const text = element.text || '';
            if (confirmationKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
              console.log(`✅ Found confirmation email: ${text.substring(0, 50)}...`);
              confirmationEmail = element;
              break;
            }
          }
          
          if (confirmationEmail) break;
        } catch (error) {
          continue;
        }
      }
      
      if (!confirmationEmail) {
        console.log('⚠️  No confirmation email found, checking recent emails...');
        // Try to open the most recent email
        const recentEmails = await this.listRecentEmails();
        if (recentEmails.length > 0) {
          console.log(`📧 Opening most recent email: ${recentEmails[0].subject}`);
          await this.openEmail(recentEmails[0]);
          
          // Check if it contains confirmation link
          const confirmationLink = await this.findConfirmationLink();
          if (confirmationLink) {
            console.log('✅ Found confirmation link, clicking...');
            await this.clickConfirmationLink(confirmationLink);
            return true;
          }
        }
      } else {
        // Open the confirmation email
        console.log('📧 Opening confirmation email...');
        await this.openEmail(confirmationEmail);
        
        // Find and click confirmation link
        const confirmationLink = await this.findConfirmationLink();
        if (confirmationLink) {
          console.log('✅ Found confirmation link, clicking...');
          await this.clickConfirmationLink(confirmationLink);
          return true;
        }
      }
      
      // Alternative: Use Gmail API to check for confirmation emails
      console.log('🔄 Trying Gmail API approach...');
      const apiResult = await this.checkGmailAPI(targetEmail);
      
      if (apiResult.success) {
        console.log('✅ Successfully confirmed via Gmail API');
        return true;
      }
      
      console.log('⚠️  Could not auto-confirm, manual intervention may be required');
      return false;
      
    } catch (error) {
      console.error('❌ Email confirmation failed:', error.message);
      return false;
    }
  }

  // List recent emails
  async listRecentEmails() {
    console.log('📧 Listing recent emails...');
    
    try {
      const emailSelectors = [
        'div[role="listitem"]',
        'tr.zA7wbf'
      ];
      
      const emails = [];
      
      for (const selector of emailSelectors) {
        try {
          const elements = await this.client.listElements(selector);
          console.log(`📋 Found ${elements.length} email elements`);
          
          for (const element of elements.slice(0, 10)) { // Get first 10 emails
            const text = element.text || '';
            const subject = this.extractSubject(text);
            if (subject) {
              emails.push({
                subject,
                element,
                text: text.substring(0, 100)
              });
            }
          }
          
          if (emails.length > 0) break;
        } catch (error) {
          continue;
        }
      }
      
      return emails;
    } catch (error) {
      console.error('❌ Failed to list emails:', error.message);
      return [];
    }
  }

  // Extract subject from email text
  extractSubject(text) {
    const subjectMatch = text.match(/Subject:\s*(.+?)(?:\n|$)/i);
    if (subjectMatch) {
      return subjectMatch[1].trim();
    }
    
    // Try to find first line that looks like a subject
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.length > 5 && line.length < 100 && !line.includes('From:') && !line.includes('To:')) {
        return line.trim();
      }
    }
    
    return null;
  }

  // Open an email
  async openEmail(emailElement) {
    try {
      const selector = emailElement.selector || 'div[role="listitem"]';
      await this.client.clickElement(selector);
      console.log('✅ Opened email');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('❌ Failed to open email:', error.message);
    }
  }

  // Find confirmation link in email body
  async findConfirmationLink() {
    console.log('🔍 Looking for confirmation link...');
    
    const linkSelectors = [
      'a[href*="confirm"]',
      'a[href*="verify"]',
      'a[href*="verification"]',
      'a[href*="confirm-email"]',
      'a[href*="verify-email"]'
    ];
    
    for (const selector of linkSelectors) {
      try {
        const links = await this.listElements(selector);
        console.log(`📋 Found ${links.length} potential confirmation links`);
        
        for (const link of links) {
          const href = link.href || '';
          if (href && (href.includes('confirm') || href.includes('verify'))) {
            console.log(`✅ Found confirmation link: ${href}`);
            return link;
          }
        }
        
        if (links.length > 0) break;
      } catch (error) {
        continue;
      }
    }
    
    return null;
  }

  // Click confirmation link
  async clickConfirmationLink(linkElement) {
    try {
      const href = linkElement.href;
      console.log(`🔗 Navigating to confirmation link: ${href}`);
      await this.client.navigateTo(href);
      console.log('✅ Navigated to confirmation page');
      
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Look for confirmation button
      const confirmButtonSelectors = [
        'button:has-text("Confirm")',
        'button:has-text("Verify")',
        'button[type="submit"]',
        'button[data-primary-action-label="Confirm"]'
      ];
      
      for (const selector of confirmButtonSelectors) {
        try {
          await this.client.clickElement(selector);
          console.log(`✅ Clicked confirmation button: ${selector}`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          return true;
        } catch (error) {
          continue;
        }
      }
      
      console.log('⚠️  Could not find confirmation button');
      return false;
      
    } catch (error) {
      console.error('❌ Failed to click confirmation link:', error.message);
      return false;
    }
  }

  // Check Gmail API for confirmation emails (requires API access)
  async checkGmailAPI(targetEmail) {
    console.log('🔌 Checking Gmail API for confirmation emails...');
    
    // This would require Gmail API setup
    // For now, return false as fallback
    return {
      success: false,
      message: 'Gmail API not configured'
    };
  }

  // Auto-confirm email and continue with original flow
  async autoConfirmAndContinue(targetEmail, nextAction) {
    console.log('🔄 Auto-confirming email and continuing...');
    
    const confirmed = await this.handleEmailConfirmation(targetEmail);
    
    if (confirmed) {
      console.log('✅ Email confirmed successfully');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Continue with the next action
      if (nextAction) {
        console.log('🔄 Continuing with next action...');
        return await nextAction();
      }
    } else {
      console.log('⚠️  Auto-confirmation failed, manual intervention required');
      return false;
    }
  }

  // Load confirmations
  loadConfirmations() {
    try {
      if (require('fs').existsSync(this.dataPath)) {
        const data = require('fs').readFileSync(this.dataPath, 'utf8');
        this.confirmations = JSON.parse(data);
      }
    } catch (error) {
      console.log('No previous confirmations found');
    }
  }

  // Save confirmations
  saveConfirmations() {
    try {
      if (this.confirmations.length > 50) {
        this.confirmations = this.confirmations.slice(-50);
      }
      require('fs').writeFileSync(this.dataPath, JSON.stringify(this.confirmations, null, 2));
    } catch (error) {
      console.log('Failed to save confirmations');
    }
  }

  // Get confirmations
  getConfirmations() {
    return this.confirmations;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const automation = new EmailConfirmationAutomation();

  switch (command) {
    case 'confirm':
      const email = args[1] || 'atomicmoonbeam88@gmail.com';
      const result = await automation.handleEmailConfirmation(email);
      console.log('📧 Confirmation Result:', result);
      break;

    case 'list-emails':
      const emails = await automation.listRecentEmails();
      console.log('📧 Recent Emails:');
      console.log(JSON.stringify(emails, null, 2));
      break;

    case 'auto-continue':
      const targetEmail = args[1] || 'atomicmoonbeam88@gmail.com';
      // Define the next action here
      const nextAction = async () => {
        console.log('🔄 Continuing with Google login...');
        // This would call the next step in the flow
        return true;
      };
      const autoResult = await automation.autoConfirmAndContinue(targetEmail, nextAction);
      console.log('🔄 Auto-Continue Result:', autoResult);
      break;

    default:
      console.log('📧 Email Confirmation Automation');
      console.log('');
      console.log('Commands:');
    console.log('  confirm       - Handle email confirmation');
    console.log('  list-emails    - List recent emails');
    console.log('  auto-continue - Auto-confirm and continue flow');
    console.log('');
    console.log('Examples:');
    console.log('  node email-confirmation.js confirm');
    console.log('  node email-confirmation.js list-emails');
    console.log('  node email-confirmation.js auto-continue');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  EmailConfirmationAutomation
};
