/**
 * Email Sending Automation with Auto-Confirmation
 * Handles email sending with automatic confirmation approval
 */

const PersistentBrowserClient = require('./persistent-browser-client');

class EmailSendingAutomation {
  constructor() {
    this.client = new PersistentBrowserClient();
    this.sends = [];
    this.dataPath = './email-sends.json';
    this.loadSends();
  }

  // Send email with auto-confirmation
  async sendEmailWithConfirmation(recipient, subject, body, targetEmail = 'atomicmoonbeam88@gmail.com') {
    console.log(`📧 Sending email to ${recipient}...`);
    
    try {
      // Navigate to Gmail
      console.log('📝 Navigating to Gmail...');
      await this.client.navigateTo('https://mail.google.com');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Click compose button
      console.log('✏️  Clicking compose button...');
      const composeSelectors = [
        'div[role="button"][data-tooltip*="Compose"]',
        'div[role="button"][aria-label*="Compose"]',
        'div.T-I.T-I-KE.L3'
      ];
      
      let composeClicked = false;
      for (const selector of composeSelectors) {
        try {
          await this.client.clickElement(selector);
          console.log(`✅ Clicked compose with selector: ${selector}`);
          composeClicked = true;
          await new Promise(resolve => setTimeout(resolve, 2000));
          break;
        } catch (error) {
          continue;
        }
      }
      
      if (!composeClicked) {
        console.log('⚠️  Could not click compose button');
        return false;
      }
      
      // Fill recipient
      console.log('📝 Filling recipient...');
      const recipientSelectors = [
        'input[name="to"]',
        'textarea[name="to"]',
        'div[contenteditable="true"][aria-label*="To"]'
      ];
      
      let recipientFilled = false;
      for (const selector of recipientSelectors) {
        try {
          await this.client.fillInput(selector, recipient);
          console.log(`✅ Filled recipient with selector: ${selector}`);
          recipientFilled = true;
          await new Promise(resolve => setTimeout(resolve, 1000));
          break;
        } catch (error) {
          continue;
        }
      }
      
      if (!recipientFilled) {
        console.log('⚠️  Could not fill recipient');
        return false;
      }
      
      // Fill subject
      console.log('📝 Filling subject...');
      const subjectSelectors = [
        'input[name="subjectbox"]',
        'input[name="subject"]',
        'div[contenteditable="true"][aria-label*="Subject"]'
      ];
      
      let subjectFilled = false;
      for (const selector of subjectSelectors) {
        try {
          await this.client.fillInput(selector, subject);
          console.log(`✅ Filled subject with selector: ${selector}`);
          subjectFilled = true;
          await new Promise(resolve => setTimeout(resolve, 1000));
          break;
        } catch (error) {
          continue;
        }
      }
      
      if (!subjectFilled) {
        console.log('⚠️  Could not fill subject');
        return false;
      }
      
      // Fill body
      console.log('📝 Filling email body...');
      const bodySelectors = [
        'div[contenteditable="true"][aria-label*="Message body"]',
        'div[role="textbox"]',
        'div.Am.Al.editable'
      ];
      
      let bodyFilled = false;
      for (const selector of bodySelectors) {
        try {
          await this.client.fillInput(selector, body);
          console.log(`✅ Filled body with selector: ${selector}`);
          bodyFilled = true;
          await new Promise(resolve => setTimeout(resolve, 1000));
          break;
        } catch (error) {
          continue;
        }
      }
      
      if (!bodyFilled) {
        console.log('⚠️  Could not fill body');
        return false;
      }
      
      // Click send button
      console.log('📤 Clicking send button...');
      const sendSelectors = [
        'div[role="button"][data-tooltip*="Send"]',
        'div[role="button"][aria-label*="Send"]',
        'div.T-I.T-I-KE.L3:has-text("Send")'
      ];
      
      let sendClicked = false;
      for (const selector of sendSelectors) {
        try {
          await this.client.clickElement(selector);
          console.log(`✅ Clicked send with selector: ${selector}`);
          sendClicked = true;
          await new Promise(resolve => setTimeout(resolve, 2000));
          break;
        } catch (error) {
          continue;
        }
      }
      
      if (!sendClicked) {
        console.log('⚠️  Could not click send button');
        return false;
      }
      
      // Handle confirmation dialog if it appears
      console.log('🔍 Checking for confirmation dialog...');
      await this.handleSendConfirmation();
      
      console.log('✅ Email sent successfully');
      
      // Record the send
      const sendRecord = {
        recipient,
        subject,
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      
      this.sends.push(sendRecord);
      this.saveSends();
      
      return true;
      
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      return false;
    }
  }

  // Handle send confirmation dialog
  async handleSendConfirmation() {
    console.log('🔍 Looking for send confirmation dialog...');
    
    // Wait a moment for dialog to appear
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Look for confirmation dialog
    const dialogSelectors = [
      'div[role="dialog"]',
      'div[role="alertdialog"]',
      '.bBe'
    ];
    
    let dialogFound = false;
    for (const selector of dialogSelectors) {
      try {
        const dialogs = await this.listElements(selector);
        console.log(`📋 Found ${dialogs.length} dialogs`);
        
        for (const dialog of dialogs) {
          const text = dialog.text || '';
          if (text.toLowerCase().includes('confirm') || text.toLowerCase().includes('send')) {
            console.log(`✅ Found confirmation dialog: ${text.substring(0, 50)}...`);
            dialogFound = true;
            
            // Look for confirm button
            const confirmSelectors = [
              'button:has-text("Send")',
              'button:has-text("Confirm")',
              'button[type="submit"]',
              'div[role="button"][data-tooltip*="Send"]'
            ];
            
            for (const confirmSelector of confirmSelectors) {
              try {
                await this.client.clickElement(confirmSelector);
                console.log(`✅ Clicked confirm button: ${confirmSelector}`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return true;
              } catch (error) {
                continue;
              }
            }
          }
        }
        
        if (dialogFound) break;
      } catch (error) {
        continue;
      }
    }
    
    if (!dialogFound) {
      console.log('ℹ️  No confirmation dialog found, email may have sent without confirmation');
    }
    
    return true;
  }

  // List elements (helper method)
  async listElements(selector) {
    try {
      const result = await this.client.executeScript(`
        const elements = Array.from(document.querySelectorAll('${selector}'));
        return elements.map(el => ({
          text: el.textContent?.substring(0, 100),
          visible: el.offsetParent !== null,
          href: el.href
        }));
      `);
      return result || [];
    } catch (error) {
      return [];
    }
  }

  // Send bulk emails with auto-confirmation
  async sendBulkEmails(recipients, subject, bodyTemplate) {
    console.log(`📧 Sending bulk emails to ${recipients.length} recipients...`);
    
    const results = [];
    
    for (const recipient of recipients) {
      const body = bodyTemplate.replace('{recipient}', recipient);
      const success = await this.sendEmailWithConfirmation(recipient, subject, body);
      
      results.push({
        recipient,
        success,
        timestamp: new Date().toISOString()
      });
      
      // Wait between sends to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log(`✅ Sent ${results.filter(r => r.success).length}/${results.length} emails successfully`);
    return results;
  }

  // Load sends
  loadSends() {
    try {
      if (require('fs').existsSync(this.dataPath)) {
        const data = require('fs').readFileSync(this.dataPath, 'utf8');
        this.sends = JSON.parse(data);
      }
    } catch (error) {
      console.log('No previous sends found');
    }
  }

  // Save sends
  saveSends() {
    try {
      if (this.sends.length > 100) {
        this.sends = this.sends.slice(-100);
      }
      require('fs').writeFileSync(this.dataPath, JSON.stringify(this.sends, null, 2));
    } catch (error) {
      console.log('Failed to save sends');
    }
  }

  // Get sends
  getSends() {
    return this.sends;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const automation = new EmailSendingAutomation();

  switch (command) {
    case 'send':
      if (args[1] && args[2] && args[3]) {
        const recipient = args[1];
        const subject = args[2];
        const body = args[3];
        const result = await automation.sendEmailWithConfirmation(recipient, subject, body);
        console.log('📧 Send Result:', result);
      } else {
        console.error('Usage: node email-sending.js send <recipient> <subject> <body>');
      }
      break;

    case 'bulk':
      if (args[1] && args[2]) {
        const recipients = JSON.parse(args[1]);
        const subject = args[2];
        const bodyTemplate = args[3] || 'Hello {recipient}, this is a test email.';
        const results = await automation.sendBulkEmails(recipients, subject, bodyTemplate);
        console.log('📧 Bulk Send Results:');
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.error('Usage: node email-sending.js bulk <recipients-json> <subject> <body-template>');
      }
      break;

    case 'list':
      const sends = automation.getSends();
      console.log('📧 Email Sends:');
      console.log(JSON.stringify(sends, null, 2));
      break;

    default:
      console.log('📧 Email Sending Automation with Auto-Confirmation');
      console.log('');
      console.log('Commands:');
      console.log('  send  - Send single email with auto-confirmation');
      console.log('  bulk  - Send bulk emails with auto-confirmation');
      console.log('  list  - List all email sends');
      console.log('');
      console.log('Examples:');
      console.log('  node email-sending.js send test@example.com "Test Subject" "Test body"');
      console.log('  node email-sending.js bulk \'["a@ex.com","b@ex.com"]\' "Subject" "Body"');
      console.log('  node email-sending.js list');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  EmailSendingAutomation
};
