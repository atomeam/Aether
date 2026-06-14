/**
 * Form Publishing Automation System
 * Automates form publishing and link generation
 */

const fs = require('fs');
const path = require('path');

class FormPublishingAutomation {
  constructor() {
    this.forms = [];
    this.publishedForms = [];
    this.dataPath = path.resolve(__dirname, 'forms-data.json');
    this.publishedPath = path.resolve(__dirname, 'published-forms.json');
    this.loadFormData();
  }

  // Publish form to get public link
  async publishForm(formId, platform = 'typeform') {
    console.log(`📝 Publishing form ${formId} on ${platform}...`);
    
    const form = this.forms.find(f => f.id === formId);
    
    if (!form) {
      throw new Error('Form not found');
    }
    
    // In production, this would use the platform's API
    const publishedForm = {
      id: this.generatePublishedId(),
      formId,
      platform,
      publicLink: this.generatePublicLink(formId, platform),
      publishedAt: new Date().toISOString(),
      status: 'published',
      settings: {
        allowAnonymous: true,
        requireAuthentication: false,
        collectEmail: true,
        limitResponses: false
      }
    };
    
    this.publishedForms.push(publishedForm);
    this.saveFormData();
    
    return publishedForm;
  }

  // Generate public link
  generatePublicLink(formId, platform) {
    const domains = {
      typeform: 'https://form.typeform.com',
      google: 'https://docs.google.com/forms',
      tally: 'https://tally.so',
      paperform: 'https://paperform.co'
    };
    
    const domain = domains[platform] || 'https://example.com';
    return `${domain}/${formId}`;
  }

  // Unpublish form
  async unpublishForm(publishedId) {
    console.log(`📝 Unpublishing form ${publishedId}...`);
    
    const publishedForm = this.publishedForms.find(f => f.id === publishedId);
    
    if (!publishedForm) {
      throw new Error('Published form not found');
    }
    
    publishedForm.status = 'unpublished';
    publishedForm.unpublishedAt = new Date().toISOString();
    
    this.saveFormData();
    
    return publishedForm;
  }

  // Update form settings
  async updateFormSettings(publishedId, settings) {
    console.log(`⚙️  Updating form settings for ${publishedId}...`);
    
    const publishedForm = this.publishedForms.find(f => f.id === publishedId);
    
    if (!publishedForm) {
      throw new Error('Published form not found');
    }
    
    publishedForm.settings = {
      ...publishedForm.settings,
      ...settings
    };
    
    this.saveFormData();
    
    return publishedForm;
  }

  // Get form responses
  async getFormResponses(publishedId) {
    console.log(`📊 Getting responses for form ${publishedId}...`);
    
    const publishedForm = this.publishedForms.find(f => f.id === publishedId);
    
    if (!publishedForm) {
      throw new Error('Published form not found');
    }
    
    // In production, this would fetch from the platform's API
    const responses = [];
    const count = Math.floor(Math.random() * 20) + 5;
    
    for (let i = 0; i < count; i++) {
      responses.push({
        id: `resp_${Date.now()}_${i}`,
        submittedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        email: `respondent${i}@example.com`,
        data: {
          name: `Respondent ${i}`,
          company: `Company ${i}`,
          pain: 'Manual reconciliation',
          budget: '$500-1000'
        }
      });
    }
    
    return {
      publishedId,
      responseCount: responses.length,
      responses
    };
  }

  // Add form
  async addForm(form) {
    console.log(`📝 Adding form: ${form.name}`);
    
    const newForm = {
      id: this.generateFormId(),
      ...form,
      createdAt: new Date().toISOString(),
      status: 'draft'
    };
    
    this.forms.push(newForm);
    this.saveFormData();
    
    return newForm;
  }

  // Get published forms
  getPublishedForms() {
    return this.publishedForms.filter(f => f.status === 'published');
  }

  // Get form by ID
  getFormById(formId) {
    return this.forms.find(f => f.id === formId);
  }

  // Get published form by ID
  getPublishedFormById(publishedId) {
    return this.publishedForms.find(f => f.id === publishedId);
  }

  // Auto-publish form (one-click)
  async autoPublishForm(formId, platform = 'typeform') {
    console.log(`🚀 Auto-publishing form ${formId}...`);
    
    // Check if form exists
    const form = this.getFormById(formId);
    
    if (!form) {
      throw new Error('Form not found');
    }
    
    // Publish with optimal settings
    const publishedForm = await this.publishForm(formId, platform);
    
    // Set optimal settings
    await this.updateFormSettings(publishedForm.id, {
      allowAnonymous: true,
      requireAuthentication: false,
      collectEmail: true,
      limitResponses: false,
      showProgress: true,
      allowEdit: false
    });
    
    return publishedForm;
  }

  // Generate form ID
  generateFormId() {
    return `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate published ID
  generatePublishedId() {
    return `pub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load form data
  loadFormData() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      this.forms = JSON.parse(data);
    }
    
    if (fs.existsSync(this.publishedPath)) {
      const data = fs.readFileSync(this.publishedPath, 'utf8');
      this.publishedForms = JSON.parse(data);
    }
  }

  // Save form data
  saveFormData() {
    if (this.forms.length > 100) {
      this.forms = this.forms.slice(-100);
    }
    if (this.publishedForms.length > 100) {
      this.publishedForms = this.publishedForms.slice(-100);
    }
    
    fs.writeFileSync(this.dataPath, JSON.stringify(this.forms, null, 2));
    fs.writeFileSync(this.publishedPath, JSON.stringify(this.publishedForms, null, 2));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const formAutomation = new FormPublishingAutomation();

  switch (command) {
    case 'add':
      if (args[1]) {
        const form = JSON.parse(args[1]);
        const result = await formAutomation.addForm(form);
        console.log('📝 Added Form:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node form-automation.js add <form-json>');
      }
      break;

    case 'publish':
      if (args[1]) {
        const result = await formAutomation.publishForm(args[1], args[2] || 'typeform');
        console.log('📝 Published Form:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node form-automation.js publish <form-id> [platform]');
      }
      break;

    case 'auto-publish':
      if (args[1]) {
        const result = await formAutomation.autoPublishForm(args[1], args[2] || 'typeform');
        console.log('🚀 Auto-Published Form:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node form-automation.js auto-publish <form-id> [platform]');
      }
      break;

    case 'unpublish':
      if (args[1]) {
        const result = await formAutomation.unpublishForm(args[1]);
        console.log('📝 Unpublished Form:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node form-automation.js unpublish <published-id>');
      }
      break;

    case 'responses':
      if (args[1]) {
        const result = await formAutomation.getFormResponses(args[1]);
        console.log('📊 Form Responses:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node form-automation.js responses <published-id>');
      }
      break;

    case 'list':
      const published = formAutomation.getPublishedForms();
      console.log('📋 Published Forms:');
      console.log(JSON.stringify(published, null, 2));
      break;

    default:
      console.log('📝 Form Publishing Automation System');
      console.log('');
      console.log('Commands:');
      console.log('  add          - Add form');
      console.log('  publish      - Publish form');
      console.log('  auto-publish  - Auto-publish form with optimal settings');
      console.log('  unpublish    - Unpublish form');
      console.log('  responses    - Get form responses');
      console.log('  list         - List published forms');
      console.log('');
      console.log('Examples:');
      console.log('  node form-automation.js add \'{"name":"Test"}\'');
      console.log('  node form-automation.js publish form-123 typeform');
      console.log('  node form-automation.js auto-publish form-123');
      console.log('  node form-automation.js unpublish pub-123');
      console.log('  node form-automation.js responses pub-123');
      console.log('  node form-automation.js list');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  FormPublishingAutomation
};
